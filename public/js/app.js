
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const btnSend = document.getElementById('btn-send');
  const historyList = document.getElementById('history-list');
  const btnNewChat = document.getElementById('btn-new-chat');
  const btnClearChat = document.getElementById('btn-clear-chat');
  const btnClearAllChats = document.getElementById('btn-clear-all-chats');
  const quickPromptsContainer = document.getElementById('quick-prompts-container');
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // Load and sync current logged in user from database session in localStorage
  function initCurrentUserProfile() {
    const rawUser = localStorage.getItem('currentUser');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        const nameEl = document.getElementById('sidebar-user-name');
        const idEl = document.getElementById('sidebar-user-id');
        const avatarEl = document.getElementById('sidebar-user-avatar');
        if (nameEl && user.fullName) nameEl.textContent = user.fullName;
        if (idEl && user.studentId) idEl.textContent = `ID: ${user.studentId}`;
        if (avatarEl && (user.avatar || user.fullName)) {
          avatarEl.textContent = user.avatar || user.fullName.charAt(0).toUpperCase();
        }
      } catch (e) {
        console.error('Error parsing currentUser:', e);
      }
    }
  }
  initCurrentUserProfile();

  // Sidebar Logout Button Handler
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }

  // SSRU Knowledge Base fallback (Bilingual TH/EN)
  const SSRU_RESPONSES = [
    {
      keywords: ['ช่องทาง', 'ชำระเงิน', 'จ่ายเงิน', 'ค่าธรรมเนียม', 'ค่าเทอม', 'การชำระเงิน', 'ใบชำระเงิน', 'invoice', 'qr code', 'โอนเงิน', 'ธนาคาร', 'payment', 'tuition', 'fee', 'pay', 'bank'],
      response: 'การชำระเงินและค่าธรรมเนียมการศึกษา SSRU:\n1. การพิมพ์ใบชำระเงิน (Invoice): เข้าสู่ระบบ e-Regis (reg.ssru.ac.th) เมนู "พิมพ์ใบชำระเงิน"\n2. ช่องทางการชำระเงิน: ชำระผ่าน App Mobile Banking ทุกธนาคารโดยสแกน QR Code บนใบชำระเงิน หรือชำระผ่านเคาน์เตอร์ธนาคารกรุงเทพ / ธนาคารไทยพาณิชย์\n3. การขอผ่อนผันค่าเทอม: ยื่นคำร้องขอผ่อนผันออนไลน์ผ่านระบบ reg.ssru.ac.th หรือกองพัฒนานักศึกษา ตามกำหนดในปฏิทินการศึกษาค่ะ',
      responseEn: 'SSRU Educational Fees & Payment Guidelines:\n1. Printing Invoice: Log in to e-Regis (reg.ssru.ac.th) and select "Print Invoice".\n2. Payment Channels: Scan the QR Code via any Mobile Banking App, or pay at Bangkok Bank / SCB counters.\n3. Tuition Deferment: Submit an online deferment request via reg.ssru.ac.th or contact the Student Development Division per the academic calendar.'
    },
    {
      keywords: ['ลงทะเบียน', 'reg', 'เพิ่มถอน', 'ภาคเรียน', 'วิชา', 'แผนการเรียน', 'ลงเรียน', 'register', 'registration', 'enroll', 'enrollment', 'course', 'add', 'drop'],
      response: 'ขั้นตอนการลงทะเบียนเรียน มหาวิทยาลัยราชภัฏสวนสุนันทา:\n1. เข้าสู่ระบบ e-Regis ทางเว็บไซต์ reg.ssru.ac.th\n2. เลือกเมนู "ลงทะเบียนเรียน" และเลือกรายวิชาตามแผนการเรียน\n3. ตรวจสอบรายวิชาและกลุ่มเรียน (Sec) แล้วคลิกบันทึกและยืนยัน\n4. เพิ่ม-ถอนรายวิชา (Add/Drop) สามารถทำได้ภายใน 2 สัปดาห์แรกของการเปิดภาคเรียนผ่านระบบออนไลน์ค่ะ',
      responseEn: 'SSRU Course Registration Procedures:\n1. Log in to e-Regis at reg.ssru.ac.th.\n2. Click "Course Registration" and select subjects according to your study plan.\n3. Verify subjects and sections (Sec), then click Save and Confirm.\n4. Course Add/Drop can be completed online within the first 2 weeks of the semester.'
    },
    {
      keywords: ['ผ่อนผัน', 'ขอผ่อนผัน', 'ผ่อนชำระ', 'defer', 'deferment', 'installment'],
      response: 'การขอผ่อนผันค่าธรรมเนียมการศึกษา นักศึกษาสามารถยื่นคำร้องผ่านระบบออนไลน์ reg.ssru.ac.th หรือติดต่อกองพัฒนานักศึกษาตามกำหนดเวลาในปฏิทินการศึกษา โดยแนบสำเนาบัตรนักศึกษาและแบบฟอร์มขอผ่อนผันค่ะ',
      responseEn: 'Tuition Fee Payment Deferment: Students can submit an online application via reg.ssru.ac.th or contact the Student Development Division as scheduled in the academic calendar, attaching student ID copy and deferment request form.'
    },
    {
      keywords: ['สอบ', 'ตารางสอบ', 'สอบปลายภาค', 'สอบกลางภาค', 'ห้องสอบ', 'exam', 'test', 'midterm', 'final', 'schedule'],
      response: 'การตรวจสอบตารางสอบ: สามารถตรวจสอบวัน เวลา และห้องสอบกลางภาค/ปลายภาคได้ที่เว็บไซต์ reg.ssru.ac.th ในเมนู "ตารางสอบนักศึกษา" โดยระบุรหัสนักศึกษาค่ะ',
      responseEn: 'Exam Schedule Check: You can verify your midterm and final examination dates, times, and exam rooms on reg.ssru.ac.th under "Student Exam Schedule" by entering your Student ID.'
    },
    {
      keywords: ['เกรด', 'แก้เกรด', 'ติด i', 'ผลการเรียน', 'gpax', 'เช็คเกรด', 'เช็คผลการเรียน', 'grade', 'grades', 'gpa', 'transcript', 'academic result'],
      response: 'การตรวจสอบผลการเรียนและการขอแก้เกรด I:\n1. ตรวจสอบเกรด (เช็คเกรด) ประจำภาคเรียนได้ในระบบ e-Regis เมนู "ผลการเรียน"\n2. กรณีติดเกรด I ให้ติดต่ออาจารย์ผู้สอนเพื่อส่งงาน/สอบประเมินเพิ่มเติม แล้วยื่นคำร้องขอแก้เกรดต่อฝ่ายทะเบียนฯ ภายในระยะเวลาที่กำหนดค่ะ',
      responseEn: 'Grade Verification & Grade I Correction:\n1. View semester grades in e-Regis under "Academic Performance".\n2. If assigned grade I, contact your instructor to complete supplementary tasks/exams, then submit a grade correction form to the Registrar Office before the deadline.'
    },
    {
      keywords: ['รับรอง', 'เอกสาร', 'transcript', 'ใบรับรอง', 'ใบเกรด', 'one stop', 'document', 'certificate', 'paper'],
      response: 'การขอเอกสารทางการศึกษาออนไลน์ (One Stop Service):\n1. ยื่นคำร้องขอเอกสารที่ reg.ssru.ac.th ในระบบ One Stop Service\n2. สามารถขอใบ Transcript (ไทย/อังกฤษ), หนังสือรับรองสถานภาพนักศึกษา หรือใบรับรองคาดว่าจะสำเร็จการศึกษา\n3. เลือกรับเป็นไฟล์ดิจิทัล PDF, รับด้วยตนเองที่ฝ่ายทะเบียนฯ อาคาร 32 ชั้น 1 หรือส่งทางไปรษณีย์ค่ะ',
      responseEn: 'Online Academic Document Request (One Stop Service):\n1. Submit a document request at reg.ssru.ac.th via One Stop Service.\n2. Available documents: Transcripts (TH/EN), Student Status Certificate, and Expected Graduation Certificate.\n3. Pickup options: Digital PDF file, self-pickup at Registrar Office (Building 32, 1st Floor), or postal delivery.'
    },
    {
      keywords: ['ทุน', 'ทุนการศึกษา', '2568', 'กยศ', 'กรอ', 'กู้ยืม', 'scholarship', 'scholarships', 'loan', 'financial aid'],
      response: 'ทุนการศึกษาและ กยศ./กรอ. SSRU:\n1. กู้ยืม กยศ./กรอ.: ยื่นคำร้องผ่านระบบ DSL ของกองทุนฯ และยืนยันข้อมูลในระบบ e-Regis / กองพัฒนานักศึกษา\n2. ทุนการศึกษา: มีทั้งทุนเรียนดี ทุนขาดแคลนทุนทรัพย์ และทุนกิจกรรม ติดตามประกาศเปิดรับสมัครทาง reg.ssru.ac.th และแฟนเพจกองพัฒนานักศึกษา SSRU ค่ะ',
      responseEn: 'SSRU Scholarships & Student Loans (กยศ./กรอ.):\n1. Student Loans: Submit application via the Fund\'s DSL system and verify details in e-Regis / Student Development Division.\n2. Scholarships: Academic merit, financial assistance, and activity scholarships are offered. Check updates on reg.ssru.ac.th and SSRU Student Development fanpage.'
    },
    {
      keywords: ['ลาพัก', 'ลาพักการเรียน', 'พ้นสภาพ', 'รักษาสภาพ', 'คืนสภาพ', 'leave', 'absence', 'maintain', 'status'],
      response: 'สถานภาพนักศึกษาและการลาพักการเรียน:\n1. การขอลาพักการเรียน: ยื่นคำร้องผ่านระบบ e-Regis โดยได้รับการอนุมัติจากอาจารย์ที่ปรึกษาและคณบดี\n2. การรักษาสภาพ: ต้องชำระค่าธรรมเนียมรักษาสภาพนักศึกษาตามกำหนดเพื่อป้องกันการพ้นสภาพค่ะ',
      responseEn: 'Student Status & Leave of Absence:\n1. Leave of Absence Request: Submit application on e-Regis with advisor and dean approval.\n2. Status Maintenance: Pay student status maintenance fee on schedule to avoid dismissal.'
    },
    {
      keywords: ['ติดต่อ', 'อาคาร 32', 'เวลาทำการ', 'ฝ่ายทะเบียน', 'สถานที่', 'contact', 'location', 'office', 'hours', 'address'],
      response: 'ข้อมูลติดต่อ ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา:\nเว็บไซต์: reg.ssru.ac.th\nที่ตั้ง: อาคาร 32 ชั้น 1 มหาวิทยาลัยราชภัฏสวนสุนันทา\nเวลาทำการ: จันทร์ - ศุกร์ 08:30 - 16:30 น. (เว้นวันหยุดนักขัตฤกษ์)ค่ะ',
      responseEn: 'Contact Info - SSRU Office of the Registrar:\nWebsite: reg.ssru.ac.th\nLocation: Building 32, 1st Floor, Suan Sunandha Rajabhat University\nOperating Hours: Monday - Friday 08:30 - 16:30 (Closed on public holidays)'
    }
  ];

  // พจนานุกรมคำแปลภาษาอังกฤษแบบครอบคลุมสำหรับคำถาม/หัวข้อของ SSRU
  const EXACT_TRANSLATIONS_EN = {
    'การลงทะเบียนเรียนภาคเรียนที่ 2': 'Semester 2 Course Registration Schedule & Procedures',
    'การลงทะเบียนเรียนภาคเรียน': 'Course Registration Schedule & Procedures',
    'การลงทะเบียนเรียน': 'Course Registration Procedures',
    'ขั้นตอนการลงทะเบียนเรียน': 'Course Registration Procedures',
    'ลงทะเบียนเรียน': 'Course Registration',
    'ลงทะเบียน': 'Course Registration',
    'ขั้นตอนขอผ่อนผันค่าเทอม': 'Tuition Fee Payment Deferment Procedures',
    'ขั้นตอนการขอผ่อนผันค่าธรรมเนียมการศึกษา': 'Tuition Fee Payment Deferment Procedures',
    'การขอผ่อนผันค่าธรรมเนียมการศึกษา': 'Tuition Fee Payment Deferment Request',
    'ขอผ่อนผันค่าเทอม': 'Apply for Tuition Fee Payment Deferment',
    'ผ่อนผันค่าเทอม': 'Tuition Fee Payment Deferment',
    'ขอผ่อนผัน': 'Apply for Tuition Fee Deferment',
    'ผ่อนผัน': 'Tuition Fee Deferment',
    'ตารางสอบปลายภาค': 'Final Examination Schedule',
    'ตารางสอบกลางภาค': 'Midterm Examination Schedule',
    'ตารางสอบ': 'Student Examination Schedule',
    'สอบปลายภาค': 'Final Examinations',
    'สอบกลางภาค': 'Midterm Examinations',
    'สอบ': 'Examinations',
    'ทุนการศึกษา ปี 2568': 'Scholarships and Student Loans 2025',
    'ทุนการศึกษา': 'Scholarships and Financial Aid',
    'กยศ': 'Student Loan Fund (กยศ.)',
    'กยศ.': 'Student Loan Fund (กยศ.)',
    'กรอ': 'Income Contingent Loan (กรอ.)',
    'กรอ.': 'Income Contingent Loan (กรอ.)',
    'แปลภาษา: ฝ่ายทะเบียนและประมวลผลเปิดกี่โมงและตั้งอยู่ที่ไหน': 'Translate: What time is the Office of the Registrar open and where is it located?',
    'ฝ่ายทะเบียนและประมวลผลเปิดกี่โมงและตั้งอยู่ที่ไหน': 'What time is the Office of the Registrar open and where is it located?',
    'ฝ่ายทะเบียนเปิดกี่โมงและตั้งอยู่ที่ไหน': 'What time is the Office of the Registrar open and where is it located?',
    'ฝ่ายทะเบียนเปิดกี่โมง': 'What time is the Office of the Registrar open?',
    'ฝ่ายทะเบียนอยู่ที่ไหน': 'Where is the Office of the Registrar located?',
    'ติดต่อฝ่ายทะเบียน': 'Contact SSRU Office of the Registrar',
    'ข้อมูลติดต่อ': 'Contact Information',
    'ช่องทางการชำระเงิน': 'Tuition Payment Channels & Methods',
    'การชำระเงินและค่าธรรมเนียมการศึกษา': 'Payment and Tuition Fees',
    'การชำระเงิน': 'Tuition Payment',
    'ชำระเงิน': 'Tuition Payment',
    'จ่ายเงิน': 'Tuition Payment',
    'จ่ายค่าเทอม': 'Pay Tuition Fees',
    'ค่าเทอม': 'Tuition Fees',
    'ค่าธรรมเนียม': 'Educational Fees',
    'ค่าธรรมเนียมการศึกษา': 'Tuition & Educational Fees',
    'การตรวจสอบผลการเรียนและการขอแก้เกรด': 'Academic Performance & Grade Correction',
    'ผลการเรียน': 'Academic Performance & Grades',
    'เช็คเกรด': 'Grade Verification',
    'ตรวจเกรด': 'Grade Verification',
    'ขอแก้เกรด': 'Grade Correction Request',
    'แก้เกรด': 'Grade Correction (Grade I)',
    'ติด i': 'Grade I Status',
    'การขอเอกสารทางการศึกษาออนไลน์': 'Online Academic Document Request (One Stop Service)',
    'ขอเอกสารทางการศึกษา': 'Official Academic Document Request',
    'ขอเอกสาร': 'Request Academic Documents',
    'ใบรับรอง': 'Student Status Certificate Request',
    'ใบเกรด': 'Official Academic Transcript',
    'สถานภาพนักศึกษาและการลาพักการเรียน': 'Student Status & Leave of Absence',
    'ลาพักการเรียน': 'Student Leave of Absence',
    'ลาพัก': 'Leave of Absence',
    'รักษาสภาพนักศึกษา': 'Maintain Student Status',
    'รักษาสภาพ': 'Maintain Student Status',
    'พ้นสภาพนักศึกษา': 'Student Dismissal Status',
    'พ้นสภาพ': 'Student Dismissal Status',
    'เพิ่มถอนรายวิชา': 'Course Add & Drop Procedures',
    'เพิ่มถอน': 'Course Add & Drop',
    'สวัสดี': 'Hello',
    'สวัสดีครับ': 'Hello',
    'สวัสดีค่ะ': 'Hello',
    'ขอบคุณ': 'Thank you',
    'ขอบคุณครับ': 'Thank you',
    'ขอบคุณค่ะ': 'Thank you'
  };

  const PHRASE_TRANSLATIONS_EN = [
    [/แปลภาษา: ฝ่ายทะเบียนและประมวลผลเปิดกี่โมงและตั้งอยู่ที่ไหน/g, 'Translate: What time is the Office of the Registrar open and where is it located?'],
    [/ฝ่ายทะเบียนและประมวลผลเปิดกี่โมงและตั้งอยู่ที่ไหน/g, 'What time is the Office of the Registrar open and where is it located?'],
    [/ขั้นตอนการขอผ่อนผันค่าธรรมเนียมการศึกษา/g, 'Tuition Fee Payment Deferment Procedures'],
    [/การชำระเงินและค่าธรรมเนียมการศึกษา/g, 'Payment & Tuition Fees'],
    [/การตรวจสอบผลการเรียนและการขอแก้เกรด/g, 'Academic Performance & Grade Correction'],
    [/การขอเอกสารทางการศึกษาออนไลน์/g, 'Online Academic Document Request (One Stop Service)'],
    [/สถานภาพนักศึกษาและการลาพักการเรียน/g, 'Student Status & Leave of Absence'],
    [/มหาวิทยาลัยราชภัฏสวนสุนันทา/g, 'Suan Sunandha Rajabhat University (SSRU)'],
    [/ฝ่ายทะเบียนและประมวลผล/g, 'Office of the Registrar'],
    [/กองพัฒนานักศึกษา/g, 'Student Development Division'],
    [/การลงทะเบียนเรียนภาคเรียนที่ 2/g, 'Semester 2 Course Registration Schedule & Procedures'],
    [/การลงทะเบียนเรียน/g, 'Course Registration Procedures'],
    [/ขั้นตอนการลงทะเบียน/g, 'Course Registration Procedures'],
    [/ลงทะเบียนเรียน/g, 'Course Registration'],
    [/ลงทะเบียน/g, 'Course Registration'],
    [/ขั้นตอนขอผ่อนผันค่าเทอม/g, 'Tuition Fee Payment Deferment Procedures'],
    [/ขอผ่อนผันค่าเทอม/g, 'Tuition Fee Payment Deferment Request'],
    [/ผ่อนผันค่าเทอม/g, 'Tuition Fee Deferment'],
    [/ขอผ่อนผัน/g, 'Apply for Deferment'],
    [/ผ่อนผัน/g, 'Tuition Deferment'],
    [/ตารางสอบปลายภาค/g, 'Final Examination Schedule'],
    [/ตารางสอบกลางภาค/g, 'Midterm Examination Schedule'],
    [/ตารางสอบ/g, 'Exam Schedule'],
    [/สอบปลายภาค/g, 'Final Exams'],
    [/สอบกลางภาค/g, 'Midterm Exams'],
    [/ทุนการศึกษา ปี 2568/g, 'Scholarships and Student Loans 2025'],
    [/ทุนการศึกษา/g, 'Scholarships and Student Loans'],
    [/กยศ\./g, 'Student Loan Fund (กยศ.)'],
    [/กยศ/g, 'Student Loan Fund (กยศ.)'],
    [/กรอ\./g, 'Income Contingent Loan (กรอ.)'],
    [/กรอ/g, 'Income Contingent Loan (กรอ.)'],
    [/ช่องทางการชำระเงิน/g, 'Payment Channels & Methods'],
    [/การชำระเงิน/g, 'Tuition Payment'],
    [/ชำระเงิน/g, 'Tuition Payment'],
    [/จ่ายค่าเทอม/g, 'Pay Tuition Fees'],
    [/จ่ายเงิน/g, 'Make Payment'],
    [/ค่าธรรมเนียมการศึกษา/g, 'Tuition & Educational Fees'],
    [/ค่าเทอม/g, 'Tuition Fee'],
    [/ค่าธรรมเนียม/g, 'Fees'],
    [/พิมพ์ใบชำระเงิน/g, 'Print Payment Invoice'],
    [/ผลการเรียน/g, 'Academic Grades & Performance'],
    [/เช็คเกรด/g, 'Check Grades'],
    [/ตรวจเกรด/g, 'View Grades'],
    [/ขอแก้เกรด/g, 'Grade Correction Request'],
    [/แก้เกรด/g, 'Grade Correction'],
    [/ติด i/gi, 'Grade I Status'],
    [/ขอเอกสารทางการศึกษา/g, 'Official Academic Document Request'],
    [/ขอเอกสาร/g, 'Request Documents'],
    [/ใบรับรอง/g, 'Student Status Certificate'],
    [/ใบเกรด/g, 'Academic Transcript'],
    [/ลาพักการเรียน/g, 'Student Leave of Absence'],
    [/ลาพัก/g, 'Leave of Absence'],
    [/รักษาสภาพนักศึกษา/g, 'Maintain Student Status'],
    [/รักษาสภาพ/g, 'Maintain Student Status'],
    [/พ้นสภาพนักศึกษา/g, 'Student Dismissal'],
    [/พ้นสภาพ/g, 'Dismissal Status'],
    [/เพิ่มถอนรายวิชา/g, 'Add/Drop Courses'],
    [/เพิ่มถอน/g, 'Add/Drop Courses'],
    [/ข้อมูลติดต่อ/g, 'Contact Information'],
    [/ติดต่อ/g, 'Contact'],
    [/อาคาร 32 ชั้น 1/g, 'Building 32, 1st Floor'],
    [/อาคาร 32/g, 'Building 32'],
    [/เวลาทำการ/g, 'Operating Hours'],
    [/จันทร์ - ศุกร์/g, 'Monday - Friday'],
    [/เว้นวันหยุดนักขัตฤกษ์/g, 'excluding public holidays'],
    [/เปิดกี่โมง/g, 'Opening hours'],
    [/ปิดกี่โมง/g, 'Closing hours'],
    [/อยู่ที่ไหน/g, 'Location'],
    [/ตั้งอยู่ที่ไหน/g, 'Location'],
    [/อย่างไร/g, 'how to'],
    [/ยังไง/g, 'how to'],
    [/เมื่อไหร่/g, 'when'],
    [/ที่ไหน/g, 'where'],
    [/กี่บาท/g, 'how much fee'],
    [/เท่าไหร่/g, 'how much fee'],
    [/อยากทราบ/g, 'Inquire about'],
    [/สอบถาม/g, 'Inquiry regarding'],
    [/สวัสดีครับ/g, 'Hello'],
    [/สวัสดีค่ะ/g, 'Hello'],
    [/สวัสดี/g, 'Hello'],
    [/ขอบคุณครับ/g, 'Thank you'],
    [/ขอบคุณค่ะ/g, 'Thank you'],
    [/ขอบคุณ/g, 'Thank you']
  ];

  function getWelcomeMessage() {
    const lang = localStorage.getItem('language') || 'th';
    if (lang === 'en') {
      return {
        sender: 'bot',
        text: 'Hello! I am SSRU Chatbot, an intelligent assistant for Suan Sunandha Rajabhat University. How may I assist you today?'
      };
    }
    return {
      sender: 'bot',
      text: 'สวัสดีค่ะ ดิฉันคือ SSRU Chatbot ผู้ช่วยอัจฉริยะมหาวิทยาลัยราชภัฏสวนสุนันทา ยินดีให้บริการค่ะ มีเรื่องใดให้ช่วยเหลือสอบถามได้เลยนะคะ'
    };
  }

  // แปลงข้อความภาษาไทยให้เป็นภาษาอังกฤษแบบสมบูรณ์ ไร้คำไทยตกค้าง
  function translateThToEn(text) {
    if (!text || typeof text !== 'string') return '';
    const clean = text.trim();

    // 1. ถ้าไม่มีภาษาไทยอยู่เลย ให้ส่งกลับได้ทันที
    if (!/[ก-๙]/.test(clean)) return clean;

    // 2. ตรวจสอบตารางคู่แปลตรงประโยค (Exact Match)
    if (EXACT_TRANSLATIONS_EN[clean]) {
      return EXACT_TRANSLATIONS_EN[clean];
    }

    // 3. ตรวจสอบกรณีขึ้นต้นด้วยคำสั่งแปล
    if (/^(แปล:|translate:|แปลภาษา:?|แปลเป็นภาษาอังกฤษ:?)\s*/i.test(clean)) {
      const inner = clean.replace(/^(แปล:|translate:|แปลภาษา:?|แปลเป็นภาษาอังกฤษ:?)\s*/i, '').trim();
      return `Translate: ${translateThToEn(inner)}`;
    }

    // 4. แปลงคำตามพจนานุกรมวลี
    let translated = clean;
    for (const [pattern, replacement] of PHRASE_TRANSLATIONS_EN) {
      translated = translated.replace(pattern, replacement);
    }

    // 5. ตัดคำลงท้ายและคำฟุ่มเฟือยภาษาไทยที่อาจหลงเหลือ
    translated = translated
      .replace(/[ครับ|ค่ะ|คะ|นะคะ|นะคับ|หน่อย|จ้า|ช่วย]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // 6. ถ้ายังมีตัวอักษรไทยหลงเหลือ ให้จำแนกตามหมวดหมู่ของ SSRU เพื่อให้เป็นประโยคภาษาอังกฤษที่สมบูรณ์ 100%
    if (/[ก-๙]/.test(translated)) {
      if (clean.includes('ลงทะเบียน')) return 'Course Registration Procedures & Schedule';
      if (clean.includes('ผ่อนผัน') || clean.includes('ค่าเทอม') || clean.includes('ชำระเงิน')) return 'Tuition Fee Payment & Deferment Inquiry';
      if (clean.includes('สอบ') || clean.includes('ตารางสอบ')) return 'Examination Schedule & Room Inquiry';
      if (clean.includes('เกรด') || clean.includes('ผลการเรียน')) return 'Academic Performance & Grade Correction Inquiry';
      if (clean.includes('เอกสาร') || clean.includes('ใบรับรอง') || clean.includes('ใบเกรด')) return 'Official Academic Documents Request (One Stop Service)';
      if (clean.includes('ทุน') || clean.includes('กยศ') || clean.includes('กรอ')) return 'Scholarships & Student Loans (กยศ./กรอ.) Inquiry';
      if (clean.includes('ติดต่อ') || clean.includes('อาคาร 32') || clean.includes('เวลาทำการ') || clean.includes('ฝ่ายทะเบียน')) return 'Office of the Registrar Location & Operating Hours';
      if (clean.includes('ลาพัก') || clean.includes('รักษาสภาพ') || clean.includes('พ้นสภาพ')) return 'Student Status & Leave of Absence Inquiry';
      if (clean.includes('เพิ่มถอน')) return 'Course Add & Drop Procedures';
      return `Inquiry regarding SSRU academic and registrar services: "${translated.replace(/[ก-๙]/g, '').trim() || 'General Information'}"`;
    }

    return translated;
  }

  // แปลงข้อความภาษาอังกฤษเป็นภาษาไทย
  function translateEnToTh(text) {
    if (!text || typeof text !== 'string') return '';
    const clean = text.trim();
    if (/[ก-๙]/.test(clean)) return clean;

    const dictEnToTh = [
      [/Suan Sunandha Rajabhat University \(SSRU\)/gi, 'มหาวิทยาลัยราชภัฏสวนสุนันทา'],
      [/Suan Sunandha Rajabhat University/gi, 'มหาวิทยาลัยราชภัฏสวนสุนันทา'],
      [/Office of the Registrar/gi, 'ฝ่ายทะเบียนและประมวลผล'],
      [/Student Development Division/gi, 'กองพัฒนานักศึกษา'],
      [/Building 32, 1st Floor/gi, 'อาคาร 32 ชั้น 1'],
      [/Payment and Tuition Fees/gi, 'การชำระเงินและค่าธรรมเนียมการศึกษา'],
      [/Payment & Tuition Fees/gi, 'การชำระเงินและค่าธรรมเนียมการศึกษา'],
      [/Course Registration Procedures/gi, 'ขั้นตอนการลงทะเบียนเรียน'],
      [/Course Registration/gi, 'การลงทะเบียนเรียน'],
      [/Tuition Fee Payment Deferment Procedures/gi, 'ขั้นตอนขอผ่อนผันค่าเทอม'],
      [/Tuition Fee Deferment/gi, 'การผ่อนผันค่าธรรมเนียมการศึกษา'],
      [/Final Examination Schedule/gi, 'ตารางสอบปลายภาค'],
      [/Examination Schedule/gi, 'ตารางสอบ'],
      [/Scholarships and Student Loans/gi, 'ทุนการศึกษาและ กยศ./กรอ.'],
      [/Scholarships/gi, 'ทุนการศึกษา'],
      [/Student Loan Fund \(กยศ\.\)/gi, 'กองทุนกู้ยืมเพื่อการศึกษา (กยศ.)'],
      [/Official Academic Document Request/gi, 'การขอเอกสารทางการศึกษาออนไลน์'],
      [/Academic Performance & Grades/gi, 'การตรวจสอบผลการเรียน'],
      [/Grade Correction/gi, 'การขอแก้เกรด'],
      [/Operating Hours/gi, 'เวลาทำการ'],
      [/Monday - Friday/gi, 'จันทร์ - ศุกร์'],
      [/Hello/gi, 'สวัสดีค่ะ'],
      [/Thank you/gi, 'ขอบคุณค่ะ']
    ];

    let result = clean;
    for (const [re, rep] of dictEnToTh) {
      result = result.replace(re, rep);
    }
    return result;
  }

  // แปลงข้อความ User สำหรับโหมดภาษาอังกฤษ (ป้องกันไทยปน)
  function getDisplayUserText(msgText) {
    const lang = localStorage.getItem('language') || 'th';
    if (lang === 'en') {
      return translateThToEn(msgText);
    }
    return msgText;
  }

  function getDisplayUserTextTh(msgText) {
    return translateEnToTh(msgText);
  }

  // แปลงข้อความ Bot สำหรับโหมดภาษาอังกฤษ (ป้องกันบอทตอบเป็นไทยค้างอยู่)
  function getDisplayBotText(botText) {
    if (!botText || typeof botText !== 'string') return '';
    const clean = botText.trim();

    // ข้อความต้อนรับ
    if (clean.includes('สวัสดีค่ะ ดิฉันคือ SSRU Chatbot') || clean.includes('ยินดีให้บริการค่ะ มีเรื่องใดให้ช่วยเหลือ')) {
      return getWelcomeMessage().text;
    }

    // เทียบกับคลังคำตอบมาตรฐานของ SSRU
    for (const item of SSRU_RESPONSES) {
      if (item.response && (clean === item.response.trim() || clean.includes(item.response.trim()) || item.response.includes(clean))) {
        return item.responseEn || translateThToEn(item.response);
      }
    }

    // ทักทาย / ขอบคุณ / คำตอบทั่วไป
    if (clean.includes('สวัสดีค่ะ ดิฉันคือ SSRU Chatbot') || clean.includes('มีอะไรให้ SSRU Chatbot ช่วยเหลือ')) {
      return 'Hello! I am SSRU Chatbot, your AI assistant for Suan Sunandha Rajabhat University. How can I help you today?';
    }
    if (clean.includes('ยินดีให้บริการค่ะ') || clean.includes('มีเรื่องอื่นต้องการสอบถามเพิ่มเติม')) {
      return 'You are very welcome! Please feel free to ask if you have any further questions about SSRU.';
    }
    if (clean.includes('ข้อมูลติดต่อ ฝ่ายทะเบียนและประมวลผล')) {
      return 'Contact Info - SSRU Office of the Registrar:\nWebsite: reg.ssru.ac.th\nLocation: Building 32, 1st Floor, Suan Sunandha Rajabhat University\nOperating Hours: Monday - Friday 08:30 - 16:30 (Closed on public holidays)';
    }
    if (clean.includes('ขอบคุณสำหรับคำถามนะคะ')) {
      return 'Thank you for your inquiry. You can verify updated details and official announcements on the SSRU Office of the Registrar website at reg.ssru.ac.th.';
    }

    // หากยังเป็นไทย ให้แปลงด้วยระบบแปล
    if (/[ก-๙]/.test(clean)) {
      return translateThToEn(clean);
    }

    return clean;
  }

  function getDisplayBotTextTh(botText) {
    if (!botText || typeof botText !== 'string') return '';
    const clean = botText.trim();
    if (clean.includes('Hello! I am SSRU Chatbot')) {
      return 'สวัสดีค่ะ ดิฉันคือ SSRU Chatbot ผู้ช่วยอัจฉริยะมหาวิทยาลัยราชภัฏสวนสุนันทา ยินดีให้บริการค่ะ มีเรื่องใดให้ช่วยเหลือสอบถามได้เลยนะคะ';
    }
    for (const item of SSRU_RESPONSES) {
      if (item.responseEn && (clean === item.responseEn.trim() || clean.includes(item.responseEn.trim()))) {
        return item.response;
      }
    }
    return translateEnToTh(clean);
  }

  // State Management & LocalStorage Persistence
  let historyData = loadHistoryFromStorage();
  let currentHistoryId = localStorage.getItem('ssru_current_chat_id') || (historyData[0] ? historyData[0].id : '1');

  function loadHistoryFromStorage() {
    try {
      const saved = localStorage.getItem('ssru_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history from localStorage', e);
    }
    const currentLang = localStorage.getItem('language') || 'th';
    const defaultTitle = currentLang === 'en' ? 'New Chat' : 'การสนทนาใหม่';
    return [
      {
        id: '1',
        title: defaultTitle,
        messages: [getWelcomeMessage()]
      }
    ];
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('ssru_chat_history', JSON.stringify(historyData));
      localStorage.setItem('ssru_current_chat_id', currentHistoryId);
    } catch (e) {
      console.error('Failed to save chat history to localStorage', e);
    }
  }

  // Initialize UI
  init();

  function init() {
    if (!historyData.some(h => h.id === currentHistoryId)) {
      currentHistoryId = historyData[0] ? historyData[0].id : '1';
    }
    renderHistoryList();
    loadCurrentChat();
    setupEventListeners();
  }

  function renderHistoryList() {
    if (!historyList) return;
    historyList.innerHTML = '';
    historyData.forEach(item => {
      const li = document.createElement('li');
      li.className = `history-item ${item.id === currentHistoryId ? 'active' : ''}`;
      li.dataset.id = item.id;

      li.innerHTML = `
        <i class="fa-regular fa-comment item-icon"></i>
        <span class="item-title">${escapeHtml(item.title)}</span>
        <button class="btn-delete-item" title="ลบ">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-item')) return;
        selectHistoryItem(item.id);
      });

      const btnDelete = li.querySelector('.btn-delete-item');
      if (btnDelete) {
        btnDelete.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteHistoryItem(item.id);
        });
      }

      historyList.appendChild(li);
    });
  }

  function getCurrentChat() {
    return historyData.find(h => h.id === currentHistoryId);
  }

  function loadCurrentChat() {
    const chat = getCurrentChat();
    if (chat && chat.messages) {
      renderTranscript(chat.messages);
    } else {
      renderTranscript([getWelcomeMessage()]);
    }
  }

  function selectHistoryItem(id) {
    currentHistoryId = id;
    saveHistoryToStorage();
    renderHistoryList();
    loadCurrentChat();
    closeSidebarMobile();
  }

  function deleteHistoryItem(id) {
    historyData = historyData.filter(h => h.id !== id);
    if (historyData.length === 0) {
      startNewChat();
    } else if (currentHistoryId === id) {
      selectHistoryItem(historyData[0].id);
    } else {
      saveHistoryToStorage();
      renderHistoryList();
    }
  }

  function startNewChat() {
    const newId = Date.now().toString();
    const currentLang = localStorage.getItem('language') || 'th';
    const defaultTitle = currentLang === 'en' ? 'New Chat' : 'การสนทนาใหม่';
    const newItem = {
      id: newId,
      title: defaultTitle,
      messages: [getWelcomeMessage()]
    };
    historyData.unshift(newItem);
    currentHistoryId = newId;

    saveHistoryToStorage();
    renderHistoryList();
    renderTranscript(newItem.messages);
    closeSidebarMobile();
  }

  function clearAllChats() {
    const newId = Date.now().toString();
    const currentLang = localStorage.getItem('language') || 'th';
    const defaultTitle = currentLang === 'en' ? 'New Chat' : 'การสนทนาใหม่';
    historyData = [
      {
        id: newId,
        title: defaultTitle,
        messages: [getWelcomeMessage()]
      }
    ];
    currentHistoryId = newId;
    saveHistoryToStorage();
    renderHistoryList();
    renderTranscript(historyData[0].messages);
    closeClearAllModal();
  }

  function renderTranscript(messages) {
    if (!chatMessages) return;
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
      // ปรับเปลี่ยนการแสดงผลข้อความของผู้ใช้ตามโหมดภาษา
      const displayText = msg.sender === 'user' ? getDisplayUserText(msg.text) : msg.text;
      appendMessageUI(msg.sender, displayText);
    });
    scrollToBottom();
  }

  function appendMessageUI(sender, text) {
    if (!chatMessages) return;
    const row = document.createElement('div');
    row.className = `message-row ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot'
      ? '<i class="fa-solid fa-graduation-cap"></i>'
      : '<i class="fa-regular fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-bubble-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatText(text);

    content.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(content);

    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function showTypingIndicator() {
    if (!chatMessages) return;
    const row = document.createElement('div');
    row.className = 'message-row bot typing-row';
    row.id = 'typing-indicator-row';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fa-solid fa-graduation-cap"></i>';

    const content = document.createElement('div');
    content.className = 'message-bubble-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble typing-indicator';
    bubble.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;

    content.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(content);

    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typingRow = document.getElementById('typing-indicator-row');
    if (typingRow) typingRow.remove();
  }

  async function sendMessage(text) {
    if (!text || text.trim() === '') return;

    const userMsg = text.trim();
    if (userInput) userInput.value = '';
    toggleSendButtonState();

    const currentChat = getCurrentChat();
    if (!currentChat) return;

    // 1. Append User Message
    currentChat.messages.push({ sender: 'user', text: userMsg });

    // แปลงข้อความ User เป็นอังกฤษหากอยู่ในโหมดภาษาอังกฤษก่อนแสดงบน UI
    const displayUserMsg = getDisplayUserText(userMsg);
    appendMessageUI('user', displayUserMsg);
    scrollToBottom();

    // Update chat title on initial prompt
    if (currentChat.title === 'การสนทนาใหม่' || currentChat.title === 'New Chat') {
      const titleText = displayUserMsg;
      currentChat.title = titleText.length > 22 ? titleText.substring(0, 22) + '...' : titleText;
      renderHistoryList();
    }
    saveHistoryToStorage();

    // 2. Show Typing Indicator
    showTypingIndicator();

    // 3. Fetch from Backend API or Local Fallback
    let botReply = '';
    try {
      const apiUrl = (window.location.origin && window.location.origin.startsWith('http'))
        ? '/api/chat'
        : 'http://localhost:3000/api/chat';

      const currentLang = localStorage.getItem('language') || 'th';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, language: currentLang })
      });

      if (res.ok) {
        const data = await res.json();
        botReply = data.reply;
      }
    } catch (apiErr) {
      // API call failed, fallback to local match
    }

    if (!botReply) {
      botReply = generateResponse(userMsg);
    }

    setTimeout(() => {
      hideTypingIndicator();
      currentChat.messages.push({ sender: 'bot', text: botReply });
      appendMessageUI('bot', botReply);
      saveHistoryToStorage();
      scrollToBottom();
    }, 500);
  }

  function generateResponse(msg) {
    const lower = msg.toLowerCase();
    const lang = localStorage.getItem('language') || 'th';
    const isEn = lang === 'en' || /^[A-Za-z0-9\s\.,\?!'-]+$/.test(msg.trim());

    for (const item of SSRU_RESPONSES) {
      if (item.keywords.some(kw => lower.includes(kw))) {
        return isEn ? (item.responseEn || item.response) : item.response;
      }
    }

    if (lower.includes('สวัสดี') || lower.includes('หวัดดี') || lower.includes('hi') || lower.includes('hello')) {
      return isEn
        ? 'Hello! I am SSRU Chatbot, your AI assistant for Suan Sunandha Rajabhat University. How can I help you today?'
        : 'สวัสดีค่ะ มีอะไรให้ SSRU Chatbot ช่วยเหลือเกี่ยวกับการเรียนการสอนหรือเรื่องในมหาวิทยาลัยวันนี้ไหมคะ?';
    }

    if (lower.includes('ขอบคุณ') || lower.includes('ขอบใจ') || lower.includes('thanks') || lower.includes('thank')) {
      return isEn
        ? 'You are very welcome! Please feel free to ask if you have any further questions about SSRU.'
        : 'ยินดีให้บริการค่ะ มีเรื่องอื่นต้องการสอบถามเพิ่มเติมบอกได้เสมอเลยนะคะ';
    }

    if (isEn) {
      return `Thank you for your inquiry. Regarding "${msg}", you can find further details and official announcements on the Registrar website reg.ssru.ac.th.`;
    }

    return `ขอบคุณสำหรับคำถามนะคะ สำหรับเรื่อง "${msg}" นักศึกษาสามารถติดตามรายละเอียดเพิ่มเติมได้ที่หน่วยงานที่เกี่ยวข้อง หรือค้นหาในเว็บไซต์หลักของมหาวิทยาลัย www.ssru.ac.th ค่ะ`;
  }

  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function toggleSendButtonState() {
    if (!userInput || !btnSend) return;
    if (userInput.value.trim() !== '') {
      btnSend.classList.add('active');
    } else {
      btnSend.classList.remove('active');
    }
  }

  function setupEventListeners() {
    if (userInput) {
      userInput.addEventListener('input', toggleSendButtonState);
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (userInput) sendMessage(userInput.value);
      });
    }

    if (btnNewChat) {
      btnNewChat.addEventListener('click', startNewChat);
    }

    if (btnClearChat) {
      btnClearChat.addEventListener('click', () => {
        const currentChat = getCurrentChat();
        if (currentChat) {
          currentChat.messages = [getWelcomeMessage()];
          saveHistoryToStorage();
          renderTranscript(currentChat.messages);
        }
      });
    }

    if (btnClearAllChats) {
      btnClearAllChats.addEventListener('click', openClearAllModal);
    }

    if (quickPromptsContainer) {
      quickPromptsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.prompt-chip');
        if (chip && chip.dataset.prompt) {
          sendMessage(chip.dataset.prompt);
        }
      });
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', closeSidebarMobile);
    }

    const btnLogout = document.getElementById('btn-logout');
    const logoutModal = document.getElementById('logout-modal');
    const btnCancelLogout = document.getElementById('btn-cancel-logout');
    const btnConfirmLogout = document.getElementById('btn-confirm-logout');

    const clearAllModal = document.getElementById('clear-all-modal');
    const btnCancelClearAll = document.getElementById('btn-cancel-clear-all');
    const btnConfirmClearAll = document.getElementById('btn-confirm-clear-all');

    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        openLogoutModal();
      });
    }

    if (btnCancelLogout) {
      btnCancelLogout.addEventListener('click', closeLogoutModal);
    }

    if (logoutModal) {
      logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) closeLogoutModal();
      });
    }

    if (btnConfirmLogout) {
      btnConfirmLogout.addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'login.html';
      });
    }

    if (btnCancelClearAll) {
      btnCancelClearAll.addEventListener('click', closeClearAllModal);
    }

    if (clearAllModal) {
      clearAllModal.addEventListener('click', (e) => {
        if (e.target === clearAllModal) closeClearAllModal();
      });
    }

    if (btnConfirmClearAll) {
      btnConfirmClearAll.addEventListener('click', clearAllChats);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLogoutModal();
        closeClearAllModal();
      }
    });
  }

  function openLogoutModal() {
    const logoutModal = document.getElementById('logout-modal');
    const logoutModalCard = document.getElementById('logout-modal-card');
    if (logoutModal && logoutModalCard) {
      logoutModal.classList.remove('opacity-0', 'pointer-events-none');
      logoutModal.classList.add('opacity-100', 'pointer-events-auto');
      logoutModalCard.classList.remove('scale-95');
      logoutModalCard.classList.add('scale-100');
    }
  }

  function closeLogoutModal() {
    const logoutModal = document.getElementById('logout-modal');
    const logoutModalCard = document.getElementById('logout-modal-card');
    if (logoutModal && logoutModalCard) {
      logoutModal.classList.remove('opacity-100', 'pointer-events-auto');
      logoutModal.classList.add('opacity-0', 'pointer-events-none');
      logoutModalCard.classList.remove('scale-100');
      logoutModalCard.classList.add('scale-95');
    }
  }

  function openClearAllModal() {
    const clearAllModal = document.getElementById('clear-all-modal');
    const clearAllModalCard = document.getElementById('clear-all-modal-card');
    if (clearAllModal && clearAllModalCard) {
      clearAllModal.classList.remove('opacity-0', 'pointer-events-none');
      clearAllModal.classList.add('opacity-100', 'pointer-events-auto');
      clearAllModalCard.classList.remove('scale-95');
      clearAllModalCard.classList.add('scale-100');
    }
  }

  function closeClearAllModal() {
    const clearAllModal = document.getElementById('clear-all-modal');
    const clearAllModalCard = document.getElementById('clear-all-modal-card');
    if (clearAllModal && clearAllModalCard) {
      clearAllModal.classList.remove('opacity-100', 'pointer-events-auto');
      clearAllModal.classList.add('opacity-0', 'pointer-events-none');
      clearAllModalCard.classList.remove('scale-100');
      clearAllModalCard.classList.add('scale-95');
    }
  }

  function closeSidebarMobile() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  function formatText(str) {
    if (!str) return '';
    let formatted = escapeHtml(str);
    return formatted.replace(/\n/g, '<br>');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Window Event Listeners
  window.addEventListener('languageChange', () => {
    const currentChat = getCurrentChat();
    if (currentChat && currentChat.messages) {
      renderTranscript(currentChat.messages);
    }
  });

  window.addEventListener('chatHistoryCleared', () => {
    startNewChat();
  });
});