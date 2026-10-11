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
    const { fullName, studentId, email, password, role, major } = req.body;

    if (!fullName || !studentId || !email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
    }

    const cleanFullName = String(fullName).trim();
    const cleanStudentId = String(studentId).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);
    const validRoles = ['นักศึกษา', 'อาจารย์', 'บุคลากร'];
    const cleanRole = role && validRoles.includes(String(role).trim()) ? String(role).trim() : 'นักศึกษา';
    const cleanMajor = major ? String(major).trim() : (cleanRole === 'นักศึกษา' ? 'วิทยาการคอมพิวเตอร์' : '');

    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const idLabel = cleanRole === 'อาจารย์' ? 'รหัสอาจารย์' : (cleanRole === 'บุคลากร' ? 'รหัสบุคลากร' : 'รหัสนักศึกษา');

    // Check duplicate
    if (usersCollection) {
      const existingEmail = await usersCollection.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
      }

      const existingStudent = await usersCollection.findOne({ studentId: cleanStudentId });
      if (existingStudent) {
        return res.status(400).json({ error: `${idLabel}นี้ถูกลงทะเบียนไว้แล้ว` });
      }
    } else {
      const existing = inMemoryUsers.find(u => u.email === cleanEmail || u.studentId === cleanStudentId);
      if (existing) {
        return res.status(400).json({
          error: existing.email === cleanEmail ? 'อีเมลนี้ถูกใช้งานในระบบแล้ว' : `${idLabel}นี้ถูกลงทะเบียนไว้แล้ว`
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
      role: cleanRole,
      faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
      major: cleanMajor,
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
    const { id, studentId, fullName, faculty, major, phone, bio, role } = req.body;
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
    if (role !== undefined) updateFields.role = role.trim();

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
    } else {
      let memUser = inMemoryUsers.find(u => (id && u._id === id) || (studentId && u.studentId === studentId));
      if (memUser) {
        Object.assign(memUser, updateFields);
        return res.json({
          success: true,
          message: 'บันทึกข้อมูลโปรไฟล์สำเร็จ',
          user: {
            id: memUser._id,
            fullName: memUser.fullName,
            studentId: memUser.studentId,
            email: memUser.email,
            role: memUser.role || 'นักศึกษา',
            faculty: memUser.faculty || '',
            major: memUser.major || '',
            phone: memUser.phone || '',
            bio: memUser.bio || '',
            avatar: (memUser.fullName || 'U').charAt(0).toUpperCase()
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
  const { studentId, userId } = req.query;
  try {
    if (chatHistoryCollection) {
      const query = {};
      if (studentId) query.studentId = String(studentId).trim();
      else if (userId) query.userId = String(userId).trim();

      const docs = await chatHistoryCollection.find(query).sort({ createdAt: -1 }).toArray();
      return res.json(docs.map(d => ({
        id: d._id.toString(),
        title: d.title,
        date: d.date,
        studentId: d.studentId || ''
      })));
    }
  } catch (err) {
    console.error('Error fetching chat history from MongoDB:', err.message);
  }
  const filtered = initialHistory.filter(c => {
    if (studentId) return c.studentId === String(studentId).trim();
    if (userId) return c.userId === String(userId).trim();
    return true;
  });
  res.json(filtered);
});

app.post('/api/history', async (req, res) => {
  const { title, studentId, userId } = req.body;
  const newChat = {
    title: title || 'การสนทนาใหม่',
    studentId: studentId ? String(studentId).trim() : '',
    userId: userId ? String(userId).trim() : '',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  try {
    if (chatHistoryCollection) {
      const result = await chatHistoryCollection.insertOne(newChat);
      return res.status(201).json({
        id: result.insertedId.toString(),
        title: newChat.title,
        date: newChat.date,
        studentId: newChat.studentId
      });
    }
  } catch (err) {
    console.error('Error saving chat history to MongoDB:', err.message);
  }

  const fallbackChat = {
    id: Date.now().toString(),
    title: newChat.title,
    date: newChat.date,
    studentId: newChat.studentId
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

// Helpers for Number & Arithmetic Calculations
function formatNumber(num) {
  if (num === 'Infinity') return 'ไม่สิ้นสุด (Infinity)';
  if (typeof num !== 'number' || isNaN(num)) return num;
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function safeEvalArithmetic(expr) {
  let clean = expr
    .replace(/×/g, '*')
    .replace(/x/gi, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .trim();

  const tokens = clean.match(/(\d+\.?\d*|\+|\-|\*|\/|\^|\(|\)|%)/g);
  if (!tokens || tokens.length === 0) return null;

  const outputQueue = [];
  const opStack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
  const rightAssoc = { '^': true };

  let lastToken = null;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const num = parseFloat(token);

    if (!isNaN(num)) {
      outputQueue.push(num);
    } else if (token in precedence) {
      if (token === '-' && (lastToken === null || lastToken === '(' || lastToken in precedence)) {
        outputQueue.push(0);
      }
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1] in precedence &&
        ((!rightAssoc[token] && precedence[token] <= precedence[opStack[opStack.length - 1]]) ||
         (rightAssoc[token] && precedence[token] < precedence[opStack[opStack.length - 1]]))
      ) {
        outputQueue.push(opStack.pop());
      }
      opStack.push(token);
    } else if (token === '(') {
      opStack.push(token);
    } else if (token === ')') {
      while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
        outputQueue.push(opStack.pop());
      }
      if (opStack.length === 0) return null;
      opStack.pop();
    } else {
      return null;
    }
    lastToken = token;
  }

  while (opStack.length > 0) {
    const op = opStack.pop();
    if (op === '(' || op === ')') return null;
    outputQueue.push(op);
  }

  const evalStack = [];
  for (const token of outputQueue) {
    if (typeof token === 'number') {
      evalStack.push(token);
    } else {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop();
      const a = evalStack.pop();
      let res;
      switch (token) {
        case '+': res = a + b; break;
        case '-': res = a - b; break;
        case '*': res = a * b; break;
        case '/':
          if (b === 0) return 'Infinity';
          res = a / b;
          break;
        case '%': res = a % b; break;
        case '^': res = Math.pow(a, b); break;
        default: return null;
      }
      evalStack.push(res);
    }
  }

  return evalStack.length === 1 ? evalStack[0] : null;
}

// Master Math & Tuition Calculator Function
function evaluateMathAndTuition(query, lang = 'th') {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim();
  const isEn = lang === 'en';

  // 1. Tuition Installment / Deferment Breakdown
  const installmentRegexTh = /(?:ค่าเทอม|ค่าธรรมเนียม|ยอดเงิน|เงิน)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:บาท)?\s*(?:แบ่ง|ผ่อน|จ่าย|ขอผ่อนผัน|แบ่งจ่าย|หาร)\s*([0-9]+)\s*งวด/i;
  const installmentRegexEn = /(?:tuition|fee|amount)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:baht|thb)?\s*(?:in|into|for|divide by|over)?\s*([0-9]+)\s*(?:installments|terms|parts)/i;
  
  let match = clean.match(installmentRegexTh) || clean.match(installmentRegexEn);
  if (match) {
    const total = parseFloat(match[1].replace(/,/g, ''));
    const parts = parseInt(match[2], 10);
    if (!isNaN(total) && !isNaN(parts) && parts > 0) {
      const perPart = total / parts;
      if (isEn) {
        return `🧮 **Tuition Installment Calculation (SSRU Deferment Breakdown):**\n\n` +
          `• Total Tuition: **${formatNumber(total)} THB**\n` +
          `• Installments: **${parts} payments**\n` +
          `• Estimated Payment per Installment: **${formatNumber(perPart)} THB / installment**\n\n` +
          `📌 *Note:* According to the SSRU Office of the Registrar and Student Development Division, deferment is submitted via reg.ssru.ac.th during the academic calendar enrollment period. The 1st installment is typically paid at registration, followed by subsequent scheduled deadlines.`;
      }
      return `🧮 **การคำนวณแบ่งจ่ายค่าธรรมเนียมการศึกษา (Tuition Installment Breakdown):**\n\n` +
        `• ยอดค่าเทอมรวม: **${formatNumber(total)} บาท**\n` +
        `• จำนวนงวดที่ขอผ่อนผัน: **${parts} งวด**\n` +
        `• ค่างวดโดยประมาณ: **${formatNumber(perPart)} บาท / งวด**\n\n` +
        `📌 *คำแนะนำ:* นักศึกษาสามารถยื่นคำร้องขอผ่อนผันค่าเทอมออนไลน์ผ่านระบบ reg.ssru.ac.th ตามปฏิทินการศึกษา โดยงวดที่ 1 ชำระช่วงลงทะเบียนเรียน และงวดถัดไปชำระตามกำหนดที่มหาวิทยาลัยประกาศค่ะ`;
    }
  }

  // 2. Tuition Credit Calculation (จำนวนหน่วยกิต x ราคา + ค่าบำรุง)
  const creditRegexTh = /([0-9]+)\s*หน่วยกิต(?:\s*(?:หน่วยกิตละ|ละ)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:บาท)?)?(?:\s*(?:รวม|บวก|และ)?(?:\s*(?:ค่าบำรุง(?:การศึกษา)?|ค่าธรรมเนียม))?\s*([0-9,]+(?:\.[0-9]+)?))?/i;
  const creditRegexEn = /([0-9]+)\s*credits?(?:\s*(?:at|@)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:baht)?)?(?:\s*(?:\+|plus|fee|maintenance)\s*([0-9,]+(?:\.[0-9]+)?))?/i;
  
  match = clean.match(creditRegexTh) || clean.match(creditRegexEn);
  if (match) {
    const credits = parseInt(match[1], 10);
    const rate = match[2] ? parseFloat(match[2].replace(/,/g, '')) : 500;
    const fee = match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
    const creditSubtotal = credits * rate;
    const grandTotal = creditSubtotal + fee;

    if (isEn) {
      return `🧮 **Tuition Credit Fee Calculation:**\n\n` +
        `• Registered Credits: **${credits} credits**\n` +
        `• Rate per Credit: **${formatNumber(rate)} THB / credit**\n` +
        `• Credits Subtotal: **${formatNumber(creditSubtotal)} THB**\n` +
        (fee > 0 ? `• University Maintenance / Fixed Fees: **${formatNumber(fee)} THB**\n` : '') +
        `• **Estimated Total Tuition: ${formatNumber(grandTotal)} THB**\n\n` +
        `📌 *Note:* Exact credit fees vary by program and faculty. You can print the official invoice from reg.ssru.ac.th.`;
    }
    return `🧮 **การคำนวณค่าเทอมตามหน่วยกิต (Credit Fee Calculation):**\n\n` +
      `• จำนวนหน่วยกิตที่ลงเรียน: **${credits} หน่วยกิต**\n` +
      `• ค่าหน่วยกิตละ: **${formatNumber(rate)} บาท / หน่วยกิต**\n` +
      `• ยอดรวมค่าหน่วยกิต: **${formatNumber(creditSubtotal)} บาท**\n` +
      (fee > 0 ? `• ค่าธรรมเนียมบำรุงการศึกษา: **${formatNumber(fee)} บาท**\n` : '') +
      `• **ยอดรวมค่าธรรมเนียมโดยประมาณ: ${formatNumber(grandTotal)} บาท**\n\n` +
      `📌 *คำแนะนำ:* อัตราค่าหน่วยกิตและค่าธรรมเนียมขึ้นอยู่กับหลักสูตรและคณะ สามารถตรวจสอบใบแจ้งชำระเงินจริง (Invoice) ได้ที่ระบบ e-Regis (reg.ssru.ac.th) ค่ะ`;
  }

  // 3. Discount / Scholarship Percentage Calculation
  const discountRegex = /(?:ค่าเทอม|ราคา|ยอดเงิน)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:บาท)?\s*(?:ได้ทุน|ลด|ส่วนลด|หัก)?\s*([0-9,]+(?:\.[0-9]+)?)\s*%/i;
  const percentOfRegex = /([0-9,]+(?:\.[0-9]+)?)\s*%\s*(?:ของ|จาก|of)\s*([0-9,]+(?:\.[0-9]+)?)/i;

  let pMatch = clean.match(percentOfRegex);
  if (pMatch) {
    const pct = parseFloat(pMatch[1].replace(/,/g, ''));
    const base = parseFloat(pMatch[2].replace(/,/g, ''));
    if (!isNaN(pct) && !isNaN(base)) {
      const result = (pct / 100) * base;
      if (isEn) {
        return `🧮 **Percentage Calculation:**\n\n` +
          `• Formula: ${pct}% × ${formatNumber(base)}\n` +
          `• **Result: ${formatNumber(result)}**`;
      }
      return `🧮 **การคำนวณร้อยละ / เปอร์เซ็นต์:**\n\n` +
        `• วิธีคำนวณ: ${pct}% × ${formatNumber(base)}\n` +
        `• **ผลลัพธ์: ${formatNumber(result)}**`;
    }
  }

  let dMatch = clean.match(discountRegex);
  if (dMatch && clean.includes('%')) {
    const total = parseFloat(dMatch[1].replace(/,/g, ''));
    const pct = parseFloat(dMatch[2].replace(/,/g, ''));
    if (!isNaN(total) && !isNaN(pct)) {
      const discountAmount = (pct / 100) * total;
      const netPay = total - discountAmount;
      if (isEn) {
        return `🧮 **Scholarship / Discount Calculation:**\n\n` +
          `• Original Amount: **${formatNumber(total)} THB**\n` +
          `• Scholarship / Discount (${pct}%): **-${formatNumber(discountAmount)} THB**\n` +
          `• **Net Amount to Pay: ${formatNumber(netPay)} THB**`;
      }
      return `🧮 **การคำนวณส่วนลด / ทุนการศึกษา:**\n\n` +
        `• ยอดเดิม: **${formatNumber(total)} บาท**\n` +
        `• ส่วนลด / ทุนที่ได้รับ (${pct}%): **-${formatNumber(discountAmount)} บาท**\n` +
        `• **ยอดสุทธิที่ต้องชำระ: ${formatNumber(netPay)} บาท**`;
    }
  }

  // 4. Rate per unit x Quantity / Daily / Monthly Multiplier
  // e.g. "วันละ 120 บาท 30 วัน", "30 วัน วันละ 120 บาท", "เดือนละ 3500 บาท 12 เดือน"
  const ratePatternTh1 = /(?:ละ|วันละ|คนละ|เดือนละ|ปีละ|ชิ้นละ|ตัวละ|ข้อละ|หน่วยละ|รายการละ)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:บาท)?\s*(?:จำนวน|ทั้งหมด)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:วัน|คน|เดือน|ปี|ชิ้น|ตัว|ชุด|อัน|ครั้ง|รอบ|หน่วย)/i;
  const ratePatternTh2 = /([0-9,]+(?:\.[0-9]+)?)\s*(?:วัน|คน|เดือน|ปี|ชิ้น|ตัว|ชุด|อัน|ครั้ง|รอบ|หน่วย)\s*(?:ละ|วันละ|คนละ|เดือนละ|ปีละ|ชิ้นละ|ตัวละ|ข้อละ|หน่วยละ|รายการละ)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:บาท)?/i;
  const ratePatternEn1 = /(?:at|@)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:baht|thb|\$)?\s*(?:per day|per month|per person|each|per unit)\s*(?:for)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:days|months|people|units|items)/i;
  const ratePatternEn2 = /([0-9,]+(?:\.[0-9]+)?)\s*(?:days|months|people|units|items)\s*(?:at|@)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:baht|thb|\$)?\s*(?:each|per day|per month|per person|per unit)?/i;

  let rMatch = clean.match(ratePatternTh1) || clean.match(ratePatternEn1);
  let rateVal, countVal;
  if (rMatch) {
    rateVal = parseFloat(rMatch[1].replace(/,/g, ''));
    countVal = parseFloat(rMatch[2].replace(/,/g, ''));
  } else {
    rMatch = clean.match(ratePatternTh2) || clean.match(ratePatternEn2);
    if (rMatch) {
      countVal = parseFloat(rMatch[1].replace(/,/g, ''));
      rateVal = parseFloat(rMatch[2].replace(/,/g, ''));
    }
  }

  if (rMatch && !isNaN(rateVal) && !isNaN(countVal)) {
    const totalMultiplier = rateVal * countVal;
    if (isEn) {
      return `🧮 **Quantity & Unit Rate Calculation:**\n\n` +
        `• Rate per Unit: **${formatNumber(rateVal)}**\n` +
        `• Quantity / Duration: **${formatNumber(countVal)}**\n` +
        `• Formula: ${formatNumber(rateVal)} × ${formatNumber(countVal)}\n` +
        `• **Total: ${formatNumber(totalMultiplier)}**`;
    }
    return `🧮 **การคำนวณอัตราต่อหน่วยและจำนวน (Unit Rate & Total):**\n\n` +
      `• อัตราต่อหน่วย: **${formatNumber(rateVal)}**\n` +
      `• จำนวน / ระยะเวลา: **${formatNumber(countVal)}**\n` +
      `• วิธีคิด: ${formatNumber(rateVal)} × ${formatNumber(countVal)}\n` +
      `• **ยอดรวมทั้งหมด: ${formatNumber(totalMultiplier)}**`;
  }

  // 5. Natural Thai / English Arithmetic Words & Expressions
  let expr = clean
    .replace(/(?:คำนวณ|หาค่า|ช่วยคิดเลข|ช่วยคิดหน่อย|คิดเลข|เลข|what is|calculate|solve)\s*:?/gi, '')
    .replace(/(?:ได้เท่าไหร่|เท่ากับเท่าไหร่|ได้เท่าไร|เท่ากับอะไร|คือเท่าไหร่|เหลือเท่าไหร่|จะเป็นเงินกี่บาท|เป็นเงินกี่บาท|กี่บาท|\?)/gi, '')
    .trim();

  expr = expr
    .replace(/\s*(?:บวก|plus|add)\s*/gi, ' + ')
    .replace(/\s*(?:ลบ|minus|subtract)\s*/gi, ' - ')
    .replace(/\s*(?:คูณ|times|multiplied by)\s*/gi, ' * ')
    .replace(/\s*(?:หารด้วย|หาร|divided by|divide)\s*/gi, ' / ')
    .replace(/\s*(?:ยกกำลัง|power|pow)\s*/gi, ' ^ ')
    .replace(/×/g, '*')
    .replace(/÷/g, '/');

  if (/[\+\-\*\/\^\%]/.test(expr) && /\d/.test(expr)) {
    const sanitized = expr.replace(/[^\d\+\-\*\/\^\%\(\)\.\,\s]/g, '').trim();
    if (sanitized && /[\+\-\*\/\^]/.test(sanitized)) {
      const res = safeEvalArithmetic(sanitized);
      if (res !== null) {
        const formattedRes = formatNumber(res);
        if (isEn) {
          return `🧮 **Calculation Result:**\n\n` +
            `• Expression: \`${sanitized.replace(/\s+/g, ' ')}\`\n` +
            `• **Answer: ${formattedRes}**`;
        }
        return `🧮 **ผลการคำนวณ:**\n\n` +
          `• โจทย์: \`${sanitized.replace(/\s+/g, ' ')}\`\n` +
          `• **คำตอบ: ${formattedRes}**`;
      }
    }
  }

  return null;
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
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: `Translate into English:\n\n${textToTranslate}` }] }]
        })).text.trim()
      : localTranslateFallback(textToTranslate, 'en');

    return res.json({
      reply: `🇬🇧 **English Translation / ผลการแปลภาษา:**\n\n${translated}`,
      source: 'translation_service',
      isRealtime: false
    });
  }

  // Check if message is a math or tuition calculation inquiry
  const mathReply = evaluateMathAndTuition(cleanMsg, isEn ? 'en' : 'th');
  if (mathReply) {
    return res.json({
      reply: mathReply,
      source: 'math_calculator',
      isRealtime: false
    });
  }

  // 1. Fetch Real-Time Grounded Context from reg.ssru.ac.th
  const ragContext = await getRealtimeRAGContext(cleanMsg);
  const ragDocs = ragContext.matchedDocs;
  const liveNewsText = ragContext.liveNews.length > 0
    ? `ข่าวสารและประกาศสดล่าสุดจาก reg.ssru.ac.th:\n- ${ragContext.liveNews.join('\n- ')}`
    : '';

  const ragContextText = ragDocs.map(d => {
    if (isEn) {
      return `[Topic: ${d.titleEn || d.title}]\n${d.contentEn || d.content}\n(Reference: ${d.source})`;
    }
    return `[หัวข้อ: ${d.title}]\n${d.content}\n(อ้างอิง: ${d.source})`;
  }).join('\n\n');

  // 2. Try Gemini AI with Live Grounding if API key is configured
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = isEn
        ? `You are SSRU Chatbot, the official intelligent assistant for Suan Sunandha Rajabhat University (SSRU).
CRITICAL: You must answer strictly and entirely in natural, fluent ENGLISH. Do NOT output Thai language in your response.
Base your answer accurately on the official SSRU Office of the Registrar information from reg.ssru.ac.th provided below.
If the student asks for numeric calculations (such as tuition fee breakdown, credit fees, installment deferment, scholarships, or general math), calculate accurately step-by-step, showing the formula and final answer with appropriate units.
Be polite, professional, concise, and helpful to university students.`
        : `คุณคือ SSRU Chatbot ผู้ช่วยอัจฉริยะประจำมหาวิทยาลัยราชภัฏสวนสุนันทา (Suan Sunandha Rajabhat University).
ตอบคำถามนักศึกษาโดยอิงข้อมูลจริงจากฝ่ายทะเบียนและประมวลผล reg.ssru.ac.th (ลิงก์: https://share.google/o9BnGzbQACRVfvE4n) เป็นหลัก.
หากนักศึกษาถามคำนวณตัวเลข (เช่น ค่าเทอม, ค่าหน่วยกิต, การแบ่งจ่ายผ่อนผัน, ทุนการศึกษา หรือการคำนวณตัวเลขทั่วไป) ให้คำนวณอย่างถูกต้อง แสดงวิธีคิดเป็นลำดับขั้นตอน พร้อมระบุผลลัพธ์และหน่วยให้ชัดเจน.
ตอบคำถามอย่างถูกต้อง สุภาพ ชัดเจน และเป็นกันเอง.`;

      const promptUserText = isEn
        ? `${systemInstruction}\n\nSSRU Reference Information:\n${ragContextText}\n\n${liveNewsText}\n\nStudent question: "${cleanMsg}"\n\nPlease answer thoroughly in English:`
        : `${systemInstruction}\n\nข้อมูล RAG อ้างอิงปัจจุบัน (จาก reg.ssru.ac.th):\n${ragContextText}\n\n${liveNewsText}\n\nคำถามจากนักศึกษา: ${cleanMsg}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: promptUserText
              }
            ]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }] // Enable Live Google Search Grounding for real-time web info
        }
      });

      const replyText = response.text || (ragDocs.length > 0 ? (isEn ? (ragDocs[0].contentEn || ragDocs[0].content) : ragDocs[0].content) : (isEn ? 'I am happy to assist you with Suan Sunandha Rajabhat University (SSRU) inquiries.' : 'ยินดีให้คำแนะนำเกี่ยวกับ SSRU ค่ะ'));
      return res.json({
        reply: replyText,
        source: 'gemini_realtime_rag',
        isRealtime: true,
        lastSynced: ragContext.lastSynced,
        ragSources: ragDocs.map(d => ({ title: isEn ? (d.titleEn || d.title) : d.title, url: d.source }))
      });
    } catch (err) {
      console.error('Gemini API Error, falling back to local real-time RAG context:', err.message);
    }
  }

  // 3. Fallback to Local Real-Time RAG Matching
  if (ragDocs.length > 0 && ragDocs[0].score > 0) {
    const topDoc = ragDocs[0];
    let replyContent = isEn ? (topDoc.contentEn || topDoc.content) : topDoc.content;
    if (ragContext.liveNews.length > 0) {
      replyContent += isEn
        ? `\n\n📌 Latest live announcement from reg.ssru.ac.th:\n- ${ragContext.liveNews[0]}`
        : `\n\n📌 ประกาศสดล่าสุดจาก reg.ssru.ac.th:\n- ${ragContext.liveNews[0]}`;
    }
    replyContent += isEn
      ? `\n\n📌 Live reference from SSRU Office of the Registrar: https://reg.ssru.ac.th (Shortcut: https://share.google/o9BnGzbQACRVfvE4n)`
      : `\n\n📌 ข้อมูลอ้างอิงสดจากฝ่ายทะเบียนและประมวลผล SSRU: https://reg.ssru.ac.th (ทางลัด: https://share.google/o9BnGzbQACRVfvE4n)`;

    return res.json({
      reply: replyContent,
      source: 'local_realtime_rag',
      isRealtime: true,
      lastSynced: ragContext.lastSynced,
      ragSources: [{ title: isEn ? (topDoc.titleEn || topDoc.title) : topDoc.title, url: topDoc.source }]
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

  if (cleanMsg.includes('ขอบคุณ') || cleanMsg.includes('ขอบใจ') || cleanMsg.includes('thanks') || cleanMsg.includes('thank')) {
    return res.json({
      reply: isEn
        ? 'You are very welcome! Please feel free to ask if you have any further questions about SSRU.'
        : 'ยินดีให้บริการค่ะ มีเรื่องอื่นต้องการสอบถามเกี่ยวกับทะเบียนการศึกษา SSRU เพิ่มเติมบอกได้เสมอเลยนะคะ',
      source: 'thanks'
    });
  }

  // Default helpful response
  const defaultText = isEn
    ? `Thank you for your question. Regarding "${cleanMsg}", you can check the latest announcements and details on the SSRU Office of the Registrar website at https://reg.ssru.ac.th (Shortcut: https://share.google/o9BnGzbQACRVfvE4n).`
    : `ขอบคุณสำหรับคำถามนะคะ สำหรับเรื่อง "${cleanMsg}" สามารถตรวจสอบรายละเอียดและประกาศอัพเดตล่าสุดได้ที่เว็บไซต์ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา reg.ssru.ac.th (ทางลัด: https://share.google/o9BnGzbQACRVfvE4n) ค่ะ`;
  res.json({
    reply: defaultText,
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
