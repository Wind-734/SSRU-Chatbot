/**
 * SSRU Registration & Records Division Knowledge Base (RAG Dataset)
 * Source URL: https://share.google/o9BnGzbQACRVfvE4n (https://reg.ssru.ac.th)
 */

const RAG_DOCUMENTS = [
  {
    id: "reg-01",
    category: "การลงทะเบียนเรียน",
    title: "ขั้นตอนการลงทะเบียนเรียนและปฏิทินวิชาการ",
    keywords: ["ลงทะเบียน", "reg", "ปฏิทินวิชาการ", "เพิ่มถอน", "ลงทะเบียนเรียน", "แผนการเรียน", "วิชา"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `การลงทะเบียนเรียน มหาวิทยาลัยราชภัฏสวนสุนันทา:
1. นักศึกษาสามารถเข้าสู่ระบบ e-Regis ผ่านทางเว็บไซต์ https://reg.ssru.ac.th
2. ไปที่เมนู "ลงทะเบียนเรียน" แล้วเลือกรายวิชาตามแผนการเรียนประจำภาคการศึกษา
3. ตรวจสอบรายวิชา รหัสวิชา และกลุ่มเรียน (Sec) แล้วคลิกบันทึกและยืนยันการลงทะเบียน
4. การเพิ่ม-ถอนรายวิชา (Add/Drop) สามารถทำได้ภายใน 2 สัปดาห์แรกของการเปิดภาคเรียนผ่านระบบออนไลน์
5. การลงทะเบียนล่าช้า ต้องยื่นคำร้องผ่านระบบ e-Regis ตามกำหนดเวลาในปฏิทินวิชาการและชำระค่าปรับตามเกณฑ์มหาวิทยาลัย`
  },
  {
    id: "reg-02",
    category: "ค่าธรรมเนียมและผ่อนผัน",
    title: "การชำระเงินและการขอผ่อนผันค่าธรรมเนียมการศึกษา",
    keywords: ["ผ่อนผัน", "ค่าเทอม", "ค่าธรรมเนียม", "จ่ายเงิน", "ชำระเงิน", "ใบแจ้งชำระ", "qr code", "ธนาคาร"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `การชำระเงินและการขอผ่อนผันค่าธรรมเนียมการศึกษา:
1. การพิมพ์ใบชำระเงิน (Invoice): เข้าสู่ระบบ e-Regis เมนู "พิมพ์ใบชำระเงิน"
2. ช่องทางการชำระเงิน: สามารถชำระผ่าน App Mobile Banking ทุกธนาคารโดยการสแกน QR Code หรือชำระที่เคาน์เตอร์ธนาคารกรุงเทพ / ธนาคารไทยพาณิชย์
3. การขอผ่อนผันค่าเทอม: นักศึกษาที่ไม่สามารถชำระเงินได้ตามกำหนด สามารถยื่นคำร้องขอผ่อนผันผ่านระบบออนไลน์ reg.ssru.ac.th หรือกองพัฒนานักศึกษา ตามช่วงเวลาที่เปิดให้ยื่นคำร้องในปฏิทินการศึกษา`
  },
  {
    id: "reg-03",
    category: "ตารางสอบและผลการเรียน",
    title: "การตรวจสอบตารางสอบ ผลการเรียน และการแก้ไขเกรด",
    keywords: ["ตารางสอบ", "สอบกลางภาค", "สอบปลายภาค", "เกรด", "ผลการเรียน", "แก้ไขเกรด", "แก้เกรด", "ติด I", "transcript", "เช็ค", "เช็คเกรด", "เช็คตารางสอบ"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `ตารางสอบและผลการเรียน SSRU:
1. ตารางสอบ: ตรวจสอบวัน เวลา และห้องสอบกลางภาค/ปลายภาค ได้ที่เว็บไซต์ https://reg.ssru.ac.th เมนู "ตารางสอบนักศึกษา" โดยระบุรหัสนักศึกษา
2. ตรวจสอบผลการเรียน: เข้าสู่ระบบ e-Regis เมนู "ผลการเรียน" เพื่อดูเกรดประจำภาคเรียนและเกรดเฉลี่ยสะสม (GPAX)
3. การขอแก้เกรด I / I-S: นักศึกษาต้องติดต่ออาจารย์ผู้สอนเพื่อส่งมอบงานหรือประเมินผลการเรียนเพิ่มเติม จากนั้นยื่นคำร้องขอแก้ไขเกรดต่อฝ่ายทะเบียนฯ ภายในระยะเวลาที่กำหนด`
  },
  {
    id: "reg-04",
    category: "เอกสารทางการศึกษา",
    title: "การขอหนังสือรับรอง ใบรายงานผลการศึกษา (Transcript) ผ่านระบบ One Stop Service",
    keywords: ["เอกสาร", "ใบรับรอง", "transcript", "ใบเกรด", "หนังสือรับรอง", "one stop service", "ขอเอกสาร"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `การขอเอกสารทางการศึกษา (One Stop Service):
1. นักศึกษาสามารถยื่นคำร้องขอเอกสารออนไลน์ได้ที่เว็บไซต์ https://reg.ssru.ac.th ในระบบ One Stop Service
2. เอกสารที่สามารถยื่นขอได้: ใบแสดงผลการเรียน (Transcript ไทย/อังกฤษ), หนังสือรับรองสถานภาพนักศึกษา, หนังสือรับรองคาดว่าจะสำเร็จการศึกษา
3. รูปแบบการรับเอกสาร: สามารถเลือกรับเป็นไฟล์ PDF (Digital Document), รับด้วยตนเองที่ฝ่ายทะเบียนฯ อาคาร 32 ชั้น 1 หรือจัดส่งทางไปรษณีย์`
  },
  {
    id: "reg-05",
    category: "ทุนการศึกษาและ กยศ.",
    title: "ทุนการศึกษาและกองทุนกู้ยืมเพื่อการศึกษา (กยศ./กรอ.)",
    keywords: ["ทุน", "ทุนการศึกษา", "กยศ", "กรอ", "กู้ยืม", "ทุนเรียนดี", "ทุนขาดแคลน"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `ทุนการศึกษาและ กยศ./กรอ. มหาวิทยาลัยราชภัฏสวนสุนันทา:
1. กู้ยืม กยศ. / กรอ.: นักศึกษาต้องดำเนินการผ่านระบบ DSL ของกองทุนฯ และบันทึกข้อมูลยืนยันในระบบ e-Regis / กองพัฒนานักศึกษา SSRU
2. ทุนการศึกษามหาวิทยาลัย: มีทั้งทุนเรียนดี, ทุนขาดแคลนทุนทรัพย์ และทุนสนับสนุนกิจกรรม ติดตามประกาศเปิดรับสมัครผ่านทาง reg.ssru.ac.th และแฟนเพจกองพัฒนานักศึกษา SSRU`
  },
  {
    id: "reg-06",
    category: "สถานภาพนักศึกษา",
    title: "การลาพักการเรียน การรักษาสภาพ และการขอคืนสภาพนักศึกษา",
    keywords: ["ลาพัก", "ลาพักการเรียน", "พ้นสภาพ", "รักษาสภาพ", "คืนสภาพ", "สถานะนักศึกษา"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `สถานภาพนักศึกษาและการลาพักการเรียน:
1. การขอลาพักการเรียน: หากมีเหตุจำเป็นไม่สามารถเรียนได้ ให้ยื่นคำร้องขอลาพักการเรียนผ่านระบบ e-Regis โดยต้องผ่านการอนุมัติจากอาจารย์ที่ปรึกษาและคณบดี
2. การรักษาสภาพนักศึกษา: ต้องชำระค่าธรรมเนียมรักษาสภาพนักศึกษาตามกำหนดเพื่อมิให้พ้นสภาพการเป็นนักศึกษา
3. การขอคืนสภาพนักศึกษา: กรณีพ้นสภาพเนื่องจากขาดการลงทะเบียน สามารถยื่นคำร้องขอคืนสภาพพร้อมชำระค่าธรรมเนียมตามระเบียบมหาวิทยาลัย`
  },
  {
    id: "reg-07",
    category: "ข้อมูลติดต่อ",
    title: "ข้อมูลติดต่อฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา",
    keywords: ["ติดต่อ", "เบอร์โทร", "สถานที่", "อาคาร 32", "ฝ่ายทะเบียน", "เวลาทำการ", "แผนที่"],
    source: "https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)",
    content: `ข้อมูลติดต่อ ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา:
- เว็บไซต์หลัก: https://reg.ssru.ac.th (ทางลัด: https://share.google/o9BnGzbQACRVfvE4n)
- สถานที่ทำการ: อาคาร 32 ชั้น 1 มหาวิทยาลัยราชภัฏสวนสุนันทา เลขที่ 1 ถนนอู่ทองนอก แขวงดุสิต เขตดุสิต กรุงเทพมหานคร 10300
- เวลาทำการ: วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น. (หยุดวันเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)`
  }
];

/**
 * Retrieve relevant RAG context documents for a given query
 */
function retrieveRAGContext(query, topK = 3) {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();

  const scoredDocs = RAG_DOCUMENTS.map(doc => {
    let score = 0;

    // Check keywords match
    doc.keywords.forEach(kw => {
      if (lowerQuery.includes(kw.toLowerCase())) {
        score += 3;
      }
    });

    // Check title match
    if (lowerQuery.includes(doc.title.toLowerCase()) || doc.title.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }

    // Check category match
    if (lowerQuery.includes(doc.category.toLowerCase())) {
      score += 4;
    }

    // Check word overlaps in content
    const words = lowerQuery.split(/\s+/);
    words.forEach(w => {
      if (w.length > 2 && doc.content.toLowerCase().includes(w)) {
        score += 1;
      }
    });

    return { ...doc, score };
  });

  // Filter docs with score > 0 and sort descending
  const results = scoredDocs
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // If no match found, fallback to top general documents
  if (results.length === 0) {
    return RAG_DOCUMENTS.slice(0, 2);
  }

  return results;
}

module.exports = {
  RAG_DOCUMENTS,
  retrieveRAGContext
};
