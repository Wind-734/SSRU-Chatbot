const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const { retrieveRAGContext, RAG_DOCUMENTS } = require('./ragKnowledge');
const { fetchLiveSSRUData, getRealtimeRAGContext } = require('./liveScraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// MongoDB Atlas connection instance
let db = null;
let chatHistoryCollection = null;
let usersCollection = null;
let inMemoryUsers = [];

// Helper functions for secure password hashing using Node.js built-in crypto
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

async function initMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.includes('@')) {
    console.log('⚠️ MONGODB_URI ยังไม่ได้ตั้งค่าหรือยังไม่สมบูรณ์ (กำลังทำงานด้วย In-Memory Storage)');
    return;
  }
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('ssru_chatbot');
    chatHistoryCollection = db.collection('history');
    usersCollection = db.collection('users');

    // Create unique index for email and studentId if needed
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      await usersCollection.createIndex({ studentId: 1 }, { unique: true });
    } catch (idxErr) {
      // index already exists or background warning
    }

    console.log('✅ เชื่อมต่อ MongoDB Atlas สำเร็จแล้ว! (Database: ssru_chatbot, Collections: history, users)');
  } catch (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ MongoDB Atlas ได้:', err.message);
  }
}

// Warm up live scraper on server startup
fetchLiveSSRUData().catch(err => console.log('Live scraper startup notice:', err.message));

// Initialize Google Gen AI client if key exists
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const { GoogleGenAI } = require('@google/genai');
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('✅ Google Gen AI Client initialized with Real-Time Web Grounding');
  } catch (err) {
    console.log('Gemini AI Client init notice:', err.message);
  }
}

// ==========================================
// Authentication & User Endpoints
// ==========================================

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, studentId, email, password } = req.body;

    if (!fullName || !studentId || !email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
    }

    const cleanFullName = String(fullName).trim();
    const cleanStudentId = String(studentId).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    // Check duplicate
    if (usersCollection) {
      const existingEmail = await usersCollection.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
      }

      const existingStudent = await usersCollection.findOne({ studentId: cleanStudentId });
      if (existingStudent) {
        return res.status(400).json({ error: 'รหัสนักศึกษานี้ถูกลงทะเบียนไว้แล้ว' });
      }
    } else {
      const existing = inMemoryUsers.find(u => u.email === cleanEmail || u.studentId === cleanStudentId);
      if (existing) {
        return res.status(400).json({
          error: existing.email === cleanEmail ? 'อีเมลนี้ถูกใช้งานในระบบแล้ว' : 'รหัสนักศึกษานี้ถูกลงทะเบียนไว้แล้ว'
        });
      }
    }

    const { hash, salt } = hashPassword(cleanPassword);
    const newUser = {
      fullName: cleanFullName,
      studentId: cleanStudentId,
      email: cleanEmail,
      passwordHash: hash,
      salt: salt,
      role: 'นักศึกษา',
      faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
      major: 'วิทยาการคอมพิวเตอร์',
      phone: '',
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let insertedId = null;
    if (usersCollection) {
      const result = await usersCollection.insertOne(newUser);
      insertedId = result.insertedId.toString();
    } else {
      insertedId = 'mem_' + Date.now();
      newUser._id = insertedId;
      inMemoryUsers.push(newUser);
    }

    console.log(`👤 New user registered: ${cleanFullName} (${cleanStudentId})`);

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จเรียบร้อยแล้ว',
      user: {
        id: insertedId,
        fullName: cleanFullName,
        studentId: cleanStudentId,
        email: cleanEmail,
        role: newUser.role,
        faculty: newUser.faculty,
        major: newUser.major,
        avatar: cleanFullName.charAt(0).toUpperCase()
      }
    });
  } catch (err) {
    console.error('Register API Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + err.message });
  }
});

// Login Endpoint (Supports both Student ID and Email)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginKey = (identifier || email || '').trim();

    if (!loginKey || !password) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสนักศึกษา/อีเมล และรหัสผ่าน' });
    }

    let user = null;
    if (usersCollection) {
      user = await usersCollection.findOne({
        $or: [
          { email: loginKey.toLowerCase() },
          { studentId: loginKey }
        ]
      });
    } else {
      user = inMemoryUsers.find(
        u => u.email.toLowerCase() === loginKey.toLowerCase() || u.studentId === loginKey
      );
    }

    if (!user) {
      return res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isValid = verifyPassword(String(password), user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
    }

    const userId = user._id ? user._id.toString() : user.id;
    const nameInitial = (user.fullName || 'U').charAt(0).toUpperCase();

    console.log(`🔓 User logged in: ${user.fullName} (${user.studentId})`);

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: userId,
        fullName: user.fullName,
        studentId: user.studentId,
        email: user.email,
        role: user.role || 'นักศึกษา',
        faculty: user.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี',
        major: user.major || 'วิทยาการคอมพิวเตอร์',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: nameInitial
      }
    });
  } catch (err) {
    console.error('Login API Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + err.message });
  }
});

// User Info Endpoint (Dynamic with query & fallback)
app.get('/api/user', async (req, res) => {
  const { id, studentId, email } = req.query;
  try {
    if ((id || studentId || email) && usersCollection) {
      let query = {};
      if (id) {
        try { query._id = new ObjectId(id); } catch(e) { query._id = id; }
      } else if (studentId) {
        query.studentId = studentId;
      } else if (email) {
        query.email = email.toLowerCase();
      }

      const user = await usersCollection.findOne(query);
      if (user) {
        return res.json({
          id: user._id.toString(),
          name: user.fullName,
          fullName: user.fullName,
          studentId: user.studentId,
          email: user.email,
          faculty: user.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี',
          major: user.major || 'วิทยาการคอมพิวเตอร์',
          role: user.role || 'นักศึกษา',
          phone: user.phone || '',
          bio: user.bio || '',
          avatar: (user.fullName || 'U').charAt(0).toUpperCase()
        });
      }
    }
  } catch (err) {
    console.error('Error fetching user:', err.message);
  }

  res.json({
    name: 'Rattanawut Kerdloet',
    fullName: 'Rattanawut Kerdloet',
    studentId: '67122201001',
    faculty: 'Faculty of Science and Technology',
    major: 'Computer Science',
    role: 'นักศึกษา',
    avatar: 'R'
  });
});

// Update Profile Endpoint
app.put('/api/user/profile', async (req, res) => {
  try {
    const { id, studentId, fullName, faculty, major, phone, bio } = req.body;
    if (!id && !studentId) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลระบุตัวตนของผู้ใช้' });
    }

    const updateFields = {
      updatedAt: new Date()
    };
    if (fullName) updateFields.fullName = fullName.trim();
    if (faculty) updateFields.faculty = faculty.trim();
    if (major) updateFields.major = major.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();

    if (usersCollection) {
      let query = {};
      if (id) {
        try { query._id = new ObjectId(id); } catch(e) { query._id = id; }
      } else {
        query.studentId = studentId;
      }

      await usersCollection.updateOne(query, { $set: updateFields });
      const updatedUser = await usersCollection.findOne(query);

      if (updatedUser) {
        return res.json({
          success: true,
          message: 'บันทึกข้อมูลโปรไฟล์สำเร็จ',
          user: {
            id: updatedUser._id.toString(),
            fullName: updatedUser.fullName,
            studentId: updatedUser.studentId,
            email: updatedUser.email,
            role: updatedUser.role || 'นักศึกษา',
            faculty: updatedUser.faculty || '',
            major: updatedUser.major || '',
            phone: updatedUser.phone || '',
            bio: updatedUser.bio || '',
            avatar: (updatedUser.fullName || 'U').charAt(0).toUpperCase()
          }
        });
      }
    }

    res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message });
  }
});

// Chat History Endpoints (MongoDB with In-Memory fallback)
let initialHistory = [];

app.get('/api/history', async (req, res) => {
  try {
    if (chatHistoryCollection) {
      const docs = await chatHistoryCollection.find().sort({ createdAt: -1 }).toArray();
      return res.json(docs.map(d => ({
        id: d._id.toString(),
        title: d.title,
        date: d.date
      })));
    }
  } catch (err) {
    console.error('Error fetching chat history from MongoDB:', err.message);
  }
  res.json(initialHistory);
});

app.post('/api/history', async (req, res) => {
  const { title } = req.body;
  const newChat = {
    title: title || 'การสนทนาใหม่',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  try {
    if (chatHistoryCollection) {
      const result = await chatHistoryCollection.insertOne(newChat);
      return res.status(201).json({
        id: result.insertedId.toString(),
        title: newChat.title,
        date: newChat.date
      });
    }
  } catch (err) {
    console.error('Error saving chat history to MongoDB:', err.message);
  }

  const fallbackChat = {
    id: Date.now().toString(),
    title: newChat.title,
    date: newChat.date
  };
  initialHistory.unshift(fallbackChat);
  res.status(201).json(fallbackChat);
});

app.delete('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (chatHistoryCollection) {
      try {
        await chatHistoryCollection.deleteOne({ _id: new ObjectId(id) });
      } catch (e) {
        await chatHistoryCollection.deleteOne({ id });
      }
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Error deleting chat from MongoDB:', err.message);
  }

  initialHistory = initialHistory.filter(h => h.id !== id);
  res.json({ success: true });
});

// RAG Documents & Status Endpoint
app.get('/api/rag/documents', async (req, res) => {
  const liveData = await fetchLiveSSRUData();
  res.json({
    isRealtime: true,
    sourceUrl: 'https://share.google/o9BnGzbQACRVfvE4n',
    targetUrl: 'https://reg.ssru.ac.th',
    lastSyncedAt: liveData.lastUpdatedISO || new Date().toISOString(),
    liveAnnouncementsCount: liveData.announcements.length,
    documentsCount: RAG_DOCUMENTS.length,
    documents: RAG_DOCUMENTS
  });
});

// Force Real-Time Live Sync Endpoint
app.post('/api/rag/sync', async (req, res) => {
  try {
    const freshData = await fetchLiveSSRUData(true);
    res.json({
      success: true,
      message: '✅ ดึงข้อมูล Real-Time จาก reg.ssru.ac.th สำเร็จแล้ว',
      lastSyncedAt: freshData.lastUpdatedISO,
      liveItemsCount: freshData.announcements.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync live data: ' + err.message });
  }
});

// Translation API Endpoint (Thai to English & English to Thai)
app.post('/api/translate', async (req, res) => {
  const { text, targetLang = 'en', sourceLang = 'auto' } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text to translate cannot be empty' });
  }

  const cleanText = text.trim();

  // 1. Try Gemini AI Translation if API key is configured
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = targetLang === 'th'
        ? `Translate the following text into natural, polite Thai. Return ONLY the translated text without commentary or quotes:\n\n${cleanText}`
        : `Translate the following text from Thai into clear, accurate, natural English suitable for Suan Sunandha Rajabhat University (SSRU). Return ONLY the translated text without commentary or quotes:\n\n${cleanText}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      if (response.text && response.text.trim()) {
        return res.json({
          translatedText: response.text.trim(),
          source: 'gemini_ai',
          targetLang
        });
      }
    } catch (err) {
      console.error('Gemini Translation API Error, using fallback dictionary:', err.message);
    }
  }

  // 2. Fallback to Local Dictionary & Rule-based Translation
  const translated = localTranslateFallback(cleanText, targetLang);
  return res.json({
    translatedText: translated,
    source: 'local_dictionary',
    targetLang
  });
});

// Helper for Local Offline Translation
function localTranslateFallback(text, targetLang = 'en') {
  if (!text) return '';
  let result = text;

  if (targetLang === 'th') {
    const dictionaryEnToTh = [
      [/Suan Sunandha Rajabhat University/gi, 'มหาวิทยาลัยราชภัฏสวนสุนันทา'],
      [/Office of the Registrar/gi, 'ฝ่ายทะเบียนและประมวลผล'],
      [/Course Registration/gi, 'การลงทะเบียนเรียน'],
      [/Student Development Division/gi, 'กองพัฒนานักศึกษา'],
      [/Building 32, 1st Floor/gi, 'อาคาร 32 ชั้น 1'],
      [/Payment and Educational Fees/gi, 'การชำระเงินและค่าธรรมเนียมการศึกษา'],
      [/Exam Schedule/gi, 'ตารางสอบ'],
      [/Scholarships/gi, 'ทุนการศึกษา'],
      [/Student Loan Fund/gi, 'กองทุนกู้ยืมเพื่อการศึกษา (กยศ.)'],
      [/Hello/gi, 'สวัสดีค่ะ'],
      [/Thank you/gi, 'ขอบคุณค่ะ']
    ];
    for (const [regex, replacement] of dictionaryEnToTh) {
      result = result.replace(regex, replacement);
    }
    return result;
  }

  const dictionaryThToEn = [
    [/มหาวิทยาลัยราชภัฏสวนสุนันทา/g, 'Suan Sunandha Rajabhat University (SSRU)'],
    [/ฝ่ายทะเบียนและประมวลผล/g, 'Office of the Registrar'],
    [/กองพัฒนานักศึกษา/g, 'Student Development Division'],
    [/การชำระเงินและค่าธรรมเนียมการศึกษา/g, 'Payment & Tuition Fees'],
    [/ขั้นตอนการลงทะเบียนเรียน/g, 'Course Registration Procedures'],
    [/การขอผ่อนผันค่าธรรมเนียมการศึกษา/g, 'Tuition Fee Payment Deferment Request'],
    [/การตรวจสอบตารางสอบ/g, 'Exam Schedule Check'],
    [/การตรวจสอบผลการเรียนและการขอแก้เกรด/g, 'Academic Performance & Grade Correction'],
    [/การขอเอกสารทางการศึกษาออนไลน์/g, 'Online Academic Document Request (One Stop Service)'],
    [/ทุนการศึกษาและ กยศ\./g, 'Scholarships & Student Loans (กยศ./กรอ.)'],
    [/สถานภาพนักศึกษาและการลาพักการเรียน/g, 'Student Status & Leave of Absence'],
    [/ข้อมูลติดต่อ/g, 'Contact Information'],
    [/อาคาร 32 ชั้น 1/g, 'Building 32, 1st Floor'],
    [/เวลาทำการ/g, 'Operating Hours'],
    [/จันทร์ - ศุกร์/g, 'Monday - Friday'],
    [/เว้นวันหยุดนักขัตฤกษ์/g, 'excluding public holidays'],
    [/พิมพ์ใบชำระเงิน/g, 'Print Payment Invoice'],
    [/เข้าสู่ระบบ/g, 'Log in to system'],
    [/สวัสดีค่ะ/g, 'Hello!'],
    [/ยินดีให้บริการค่ะ/g, 'Glad to be of service!'],
    [/ขอบคุณสำหรับคำถามนะคะ/g, 'Thank you for your inquiry.'],
    [/ขอบคุณค่ะ/g, 'Thank you!'],
    [/ลงทะเบียนเรียน/g, 'Course registration'],
    [/ผ่อนผัน/g, 'Payment deferment'],
    [/ค่าเทอม/g, 'Tuition fee'],
    [/ค่าธรรมเนียม/g, 'Fees'],
    [/ตารางสอบ/g, 'Exam schedule'],
    [/ทุนการศึกษา/g, 'Scholarship'],
    [/ผลการเรียน/g, 'Academic grades'],
    [/ประวัติการสนทนา/g, 'Chat History'],
    [/การสนทนาใหม่/g, 'New Conversation']
  ];

  for (const [regex, replacement] of dictionaryThToEn) {
    result = result.replace(regex, replacement);
  }

  // If no dictionary match occurred for complex text, add readable translation indicator prefix if offline
  if (result === text && /[ก-๙]/.test(text)) {
    result = `[EN Translation]: ${text}`;
  }

  return result;
}

// Chat API Endpoint with Real-Time Live RAG Integration
app.post('/api/chat', async (req, res) => {
  const { message, history, language } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const cleanMsg = message.trim();
  const isEn = language === 'en' || /^[A-Za-z0-9\s\.,\?!'-]+$/.test(cleanMsg);

  // Check if message is a direct request to translate
  if (cleanMsg.startsWith('แปล:') || cleanMsg.startsWith('translate:') || cleanMsg.startsWith('แปลภาษา')) {
    const textToTranslate = cleanMsg.replace(/^(แปล:|translate:|แปลภาษา|แปลเป็นภาษาอังกฤษ:?\s*)/i, '').trim();
    const translated = aiClient && process.env.GEMINI_API_KEY
      ? (await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: `Translate into English:\n\n${textToTranslate}` }] }]
        })).text.trim()
      : localTranslateFallback(textToTranslate, 'en');

    return res.json({
      reply: `🇬🇧 **English Translation / ผลการแปลภาษา:**\n\n${translated}`,
      source: 'translation_service',
      isRealtime: false
    });
  }

  // 1. Fetch Real-Time Grounded Context from reg.ssru.ac.th
  const ragContext = await getRealtimeRAGContext(cleanMsg);
  const ragDocs = ragContext.matchedDocs;
  const liveNewsText = ragContext.liveNews.length > 0
    ? `ข่าวสารและประกาศสดล่าสุดจาก reg.ssru.ac.th:\n- ${ragContext.liveNews.join('\n- ')}`
    : '';

  const ragContextText = ragDocs.map(d => `[หัวข้อ: ${d.title}]\n${d.content}\n(อ้างอิง: ${d.source})`).join('\n\n');

  // 2. Try Gemini AI with Live Grounding if API key is configured
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = `คุณคือ SSRU Chatbot ผู้ช่วยอัจฉริยะประจำมหาวิทยาลัยราชภัฏสวนสุนันทา (Suan Sunandha Rajabhat University).
ตอบคำถามนักศึกษาโดยอิงข้อมูลจริงจากฝ่ายทะเบียนและประมวลผล reg.ssru.ac.th (ลิงก์: https://share.google/o9BnGzbQACRVfvE4n) เป็นหลัก.
ตอบคำถามอย่างถูกต้อง สุภาพ ชัดเจน และเป็นกันเอง.
${isEn ? 'Please respond in fluent, accurate English suitable for international students.' : ''}

ข้อมูล RAG อ้างอิงปัจจุบัน (จาก reg.ssru.ac.th):
${ragContextText}

${liveNewsText}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nคำถามจากนักศึกษา: ${cleanMsg}`
              }
            ]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }] // Enable Live Google Search Grounding for real-time web info
        }
      });

      const replyText = response.text || (ragDocs.length > 0 ? ragDocs[0].content : 'ยินดีให้คำแนะนำเกี่ยวกับ SSRU ค่ะ');
      return res.json({
        reply: replyText,
        source: 'gemini_realtime_rag',
        isRealtime: true,
        lastSynced: ragContext.lastSynced,
        ragSources: ragDocs.map(d => ({ title: d.title, url: d.source }))
      });
    } catch (err) {
      console.error('Gemini API Error, falling back to local real-time RAG context:', err.message);
    }
  }

  // 3. Fallback to Local Real-Time RAG Matching
  if (ragDocs.length > 0 && ragDocs[0].score > 0) {
    const topDoc = ragDocs[0];
    let replyContent = `${topDoc.content}`;
    if (ragContext.liveNews.length > 0) {
      replyContent += `\n\n📌 ประกาศสดล่าสุดจาก reg.ssru.ac.th:\n- ${ragContext.liveNews[0]}`;
    }
    replyContent += `\n\n📌 ข้อมูลอ้างอิงสดจากฝ่ายทะเบียนและประมวลผล SSRU: https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)`;

    if (isEn) {
      replyContent = localTranslateFallback(replyContent, 'en');
    }

    return res.json({
      reply: replyContent,
      source: 'local_realtime_rag',
      isRealtime: true,
      lastSynced: ragContext.lastSynced,
      ragSources: [{ title: topDoc.title, url: topDoc.source }]
    });
  }

  // Generic friendly responses
  if (cleanMsg.includes('สวัสดี') || cleanMsg.includes('หวัดดี') || cleanMsg.includes('hi') || cleanMsg.includes('hello')) {
    return res.json({
      reply: isEn
        ? 'Hello! I am SSRU Chatbot, your AI assistant for Suan Sunandha Rajabhat University. How can I help you today?'
        : 'สวัสดีค่ะ ดิฉันคือ SSRU Chatbot ผู้ช่วยอัจฉริยะของมหาวิทยาลัยราชภัฏสวนสุนันทา ยินดีให้บริการข้อมูลสด Real-time จากฝ่ายทะเบียนและประมวลผล reg.ssru.ac.th ค่ะ มีเรื่องใดสอบถามได้เลยนะคะ',
      source: 'greeting'
    });
  }

  if (cleanMsg.includes('ขอบคุณ') || cleanMsg.includes('ขอบใจ') || cleanMsg.includes('thanks')) {
    return res.json({
      reply: isEn
        ? 'You are welcome! Please feel free to ask if you have any further questions about SSRU.'
        : 'ยินดีให้บริการค่ะ มีเรื่องอื่นต้องการสอบถามเกี่ยวกับทะเบียนการศึกษา SSRU เพิ่มเติมบอกได้เสมอเลยนะคะ',
      source: 'thanks'
    });
  }

  // Default helpful response
  const defaultText = `ขอบคุณสำหรับคำถามนะคะ สำหรับเรื่อง "${cleanMsg}" สามารถตรวจสอบรายละเอียดและประกาศอัพเดตล่าสุดได้ที่เว็บไซต์ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา reg.ssru.ac.th (ทางลัด: https://share.google/o9BnGzbQACRVfvE4n) ค่ะ`;
  res.json({
    reply: isEn ? localTranslateFallback(defaultText, 'en') : defaultText,
    source: 'default_realtime_rag',
    isRealtime: true,
    lastSynced: ragContext.lastSynced
  });
});

app.listen(PORT, async () => {
  await initMongoDB();
  console.log(`🚀 SSRU Chatbot Server running on http://localhost:${PORT}`);
  console.log(`⚡ Real-Time RAG Enabled (Target: https://reg.ssru.ac.th / https://share.google/o9BnGzbQACRVfvE4n)`);
});
