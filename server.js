const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { retrieveRAGContext, RAG_DOCUMENTS } = require('./ragKnowledge');
const { fetchLiveSSRUData, getRealtimeRAGContext } = require('./liveScraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// User Info Endpoint
app.get('/api/user', (req, res) => {
  res.json({
    name: 'Rattanawut Kerdloet',
    studentId: '67122201001',
    faculty: 'Faculty of Science and Technology',
    major: 'Computer Science',
    avatar: 'R'
  });
});

// Initial Chat History Endpoint
let initialHistory = [];

app.get('/api/history', (req, res) => {
  res.json(initialHistory);
});

app.post('/api/history', (req, res) => {
  const { title } = req.body;
  const newChat = {
    id: Date.now().toString(),
    title: title || 'การสนทนาใหม่',
    date: new Date().toISOString().split('T')[0]
  };
  initialHistory.unshift(newChat);
  res.status(201).json(newChat);
});

app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
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

// Chat API Endpoint with Real-Time Live RAG Integration
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const cleanMsg = message.trim();

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
      reply: 'สวัสดีค่ะ ดิฉันคือ SSRU Chatbot ผู้ช่วยอัจฉริยะของมหาวิทยาลัยราชภัฏสวนสุนันทา ยินดีให้บริการข้อมูลสด Real-time จากฝ่ายทะเบียนและประมวลผล reg.ssru.ac.th ค่ะ มีเรื่องใดสอบถามได้เลยนะคะ',
      source: 'greeting'
    });
  }

  if (cleanMsg.includes('ขอบคุณ') || cleanMsg.includes('ขอบใจ') || cleanMsg.includes('thanks')) {
    return res.json({
      reply: 'ยินดีให้บริการค่ะ มีเรื่องอื่นต้องการสอบถามเกี่ยวกับทะเบียนการศึกษา SSRU เพิ่มเติมบอกได้เสมอเลยนะคะ',
      source: 'thanks'
    });
  }

  // Default helpful response
  res.json({
    reply: `ขอบคุณสำหรับคำถามนะคะ สำหรับเรื่อง "${cleanMsg}" สามารถตรวจสอบรายละเอียดและประกาศอัพเดตล่าสุดได้ที่เว็บไซต์ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา reg.ssru.ac.th (ทางลัด: https://share.google/o9BnGzbQACRVfvE4n) ค่ะ`,
    source: 'default_realtime_rag',
    isRealtime: true,
    lastSynced: ragContext.lastSynced
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SSRU Chatbot Server running on http://localhost:${PORT}`);
  console.log(`⚡ Real-Time RAG Enabled (Target: https://reg.ssru.ac.th / https://share.google/o9BnGzbQACRVfvE4n)`);
});
