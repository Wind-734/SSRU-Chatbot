const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Gen AI client if key exists
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const { GoogleGenAI } = require('@google/genai');
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.log('Gemini AI Client init notice:', err.message);
  }
}

// Default SSRU Knowledge Base for instant accurate responses
const SSRU_KNOWLEDGE = [
  {
    keywords: ['ลงทะเบียน', 'reg', 'เหต', 'เพิ่มถอน', 'ภาคเรียนที่ 2'],
    response: 'นักศึกษาสามารถลงทะเบียนผ่านเว็บไซต์ reg ssru และทำการเลือกเมนูลงทะเบียนเรียนด้วยตัวเอง จากนั้นเลือกเมนูลงทะเบียนเพิ่มถอนรายวิชา หรือติดตามประกาศปฏิทินวิชาการทาง reg.ssru.ac.th ค่ะ'
  },
  {
    keywords: ['ผ่อนผัน', 'ค่าเทอม', 'จ่ายเงิน', 'ค่าธรรมเนียม'],
    response: 'การขอผ่อนผันค่าธรรมเนียมการศึกษา นักศึกษาสามารถยื่นคำร้องผ่านระบบออนไลน์ของกองพัฒนานักศึกษา หรือติดต่อห้องการเงินของมหาวิทยาลัยตามกำหนดเวลาในปฏิทินการศึกษาค่ะ'
  },
  {
    keywords: ['สอบ', 'ตารางสอบ', 'สอบปลายภาค', 'สอบกลางภาค'],
    response: 'ตารางสอบปลายภาคเรียน สามารถตรวจสอบได้ที่เว็บไซต์ reg.ssru.ac.th ในเมนู "ตารางสอบนักศึกษา" โดยระบุรหัสนักศึกษาเพื่อดูวัน เวลา และห้องสอบค่ะ'
  },
  {
    keywords: ['หนังสือรับรอง', 'เอกสาร', 'ใบเกรด', 'transcript', 'ใบรับรอง'],
    response: 'การขอหนังสือรับรองหรือใบรายงานผลการศึกษา (Transcript) สามารถยื่นคำร้องออนไลน์ผ่านระบบ One Stop Service ของสำนักทะเบียนและประมวลผล หรือติดต่อด้วยตนเองที่อาคารสำนักงานอธิการบดีค่ะ'
  },
  {
    keywords: ['ทุน', 'ทุนการศึกษา', '2568', 'กยศ', 'กรอ'],
    response: 'มหาวิทยาลัยมีทุนการศึกษาหลายประเภท เช่น ทุนเรียนดี ทุนขาดแคลนทุนทรัพย์ และทุน กยศ./กรอ. ประจำปี 2568 สามารถติดตามรายละเอียดและสมัครยื่นเอกสารได้ที่ กองพัฒนานักศึกษา SSRU ค่ะ'
  }
];

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

// Initial Chat History Endpoint (Clean state for new sessions)
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

// Chat API Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const cleanMsg = message.trim();

  // Try Gemini AI if API key is provided
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `คุณคือ SSRU Chatbot ผู้ช่วยอัจฉริยะประจำมหาวิทยาลัยราชภัฏสวนสุนันทา (Suan Sunandha Rajabhat University). ตอบคำถามผู้ใช้อย่างสุภาพ กระชับ เป็นกันเอง และมีประโยชน์. คำถาม: ${cleanMsg}`
              }
            ]
          }
        ]
      });

      const replyText = response.text || 'ยินดีที่ช่วยค่ะ มีอะไรให้ช่วยบอกได้อีกนะคะ';
      return res.json({ reply: replyText, source: 'gemini' });
    } catch (err) {
      console.error('Gemini API Error, falling back to SSRU Knowledge:', err.message);
    }
  }

  // Fallback to Knowledge Base matching or General AI response generator
  const lowerMsg = cleanMsg.toLowerCase();
  let matchedResponse = null;

  for (const item of SSRU_KNOWLEDGE) {
    if (item.keywords.some(kw => lowerMsg.includes(kw))) {
      matchedResponse = item.response;
      break;
    }
  }

  if (matchedResponse) {
    return res.json({ reply: matchedResponse, source: 'knowledge_base' });
  }

  // Generic friendly SSRU Chatbot response
  if (cleanMsg.includes('สวัสดี') || cleanMsg.includes('หวัดดี') || cleanMsg.includes('hi') || cleanMsg.includes('hello')) {
    return res.json({
      reply: 'สวัสดีค่ะ ดิฉันคือ SSRU Chatbot ผู้ช่วยอัจฉริยะของมหาวิทยาลัยราชภัฏสวนสุนันทา มีอะไรให้ช่วยเหลือวันนี้คะ?',
      source: 'greeting'
    });
  }

  if (cleanMsg.includes('ขอบคุณ') || cleanMsg.includes('ขอบใจ') || cleanMsg.includes('thanks')) {
    return res.json({
      reply: 'ยินดีที่ช่วยค่ะมีอะไรให้ช่วยบอกได้อีกนะคะ',
      source: 'thanks'
    });
  }

  // Default helpful response
  res.json({
    reply: `ขอบคุณสำหรับคำถามนะคะ เรื่อง "${cleanMsg}" คุณสามารถสอบถามรายละเอียดเพิ่มเติมได้ที่หน่วยงานที่เกี่ยวข้องของ SSRU หรือค้นหาที่เว็บไซต์หลัก www.ssru.ac.th ค่ะ`,
    source: 'default'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SSRU Chatbot Server running on http://localhost:${PORT}`);
});
