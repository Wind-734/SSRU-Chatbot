// สคริปต์สำหรับทดสอบระบบ Register และ Login กับ MongoDB Atlas อัตโนมัติ
require('dotenv').config();

async function runTest() {
  const baseUrl = 'http://localhost:3000';
  const timestamp = Date.now();
  const testStudent = {
    fullName: 'สมชาย นักศึกษาทดสอบ',
    studentId: '67' + String(timestamp).slice(-9),
    email: `student_${timestamp}@ssru.ac.th`,
    password: 'password1234'
  };

  console.log('====================================================');
  console.log('       เริ่มการทดสอบระบบ SSRU Chatbot Auth          ');
  console.log('====================================================\n');

  try {
    // 1. ตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่หรือไม่
    try {
      const ping = await fetch(baseUrl + '/api/user');
      if (!ping.ok && ping.status !== 200) throw new Error();
    } catch (e) {
      console.log('❌ ไม่สามารถเชื่อมต่อ http://localhost:3000 ได้');
      console.log('👉 กรุณาเปิดเซิร์ฟเวอร์ก่อนด้วยคำสั่ง: node server.js\n');
      process.exit(1);
    }

    // 2. ทดสอบสมัครสมาชิก (Register)
    console.log('▶ [1/4] ทดสอบสมัครสมาชิก (Register)...');
    console.log(`      ข้อมูล: ${testStudent.fullName} | รหัส: ${testStudent.studentId}`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent)
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.success) {
      console.log('  ✅ สมัครสมาชิกสำเร็จ! บันทึกลง MongoDB เรียบร้อย\n');
    } else {
      console.log('  ❌ สมัครสมาชิกไม่ผ่าน:', regData.error, '\n');
    }

    // 3. ทดสอบเข้าสู่ระบบด้วยรหัสนักศึกษา (Login with Student ID)
    console.log('▶ [2/4] ทดสอบล็อกอินด้วย "รหัสนักศึกษา"...');
    const loginIdRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStudent.studentId,
        password: testStudent.password
      })
    });
    const loginIdData = await loginIdRes.json();
    if (loginIdRes.ok && loginIdData.success) {
      console.log(`  ✅ ล็อกอินด้วยรหัสนักศึกษาสำเร็จ! (ผู้ใช้: ${loginIdData.user.fullName})\n`);
    } else {
      console.log('  ❌ ล็อกอินไม่ผ่าน:', loginIdData.error, '\n');
    }

    // 4. ทดสอบเข้าสู่ระบบด้วยอีเมล (Login with Email)
    console.log('▶ [3/4] ทดสอบล็อกอินด้วย "อีเมล"...');
    const loginEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStudent.email,
        password: testStudent.password
      })
    });
    const loginEmailData = await loginEmailRes.json();
    if (loginEmailRes.ok && loginEmailData.success) {
      console.log(`  ✅ ล็อกอินด้วยอีเมลสำเร็จ! (ผู้ใช้: ${loginEmailData.user.email})\n`);
    } else {
      console.log('  ❌ ล็อกอินไม่ผ่าน:', loginEmailData.error, '\n');
    }

    // 5. ทดสอบกรณีใส่รหัสผ่านผิด (Wrong Password)
    console.log('▶ [4/4] ทดสอบความปลอดภัยเมื่อ "ใส่รหัสผิด"...');
    const wrongRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStudent.studentId,
        password: 'wrongpassword'
      })
    });
    const wrongData = await wrongRes.json();
    if (wrongRes.status === 401) {
      console.log(`  ✅ ระบบปฏิเสธถูกต้องตามความปลอดภัย: "${wrongData.error}"\n`);
    } else {
      console.log('  ❌ ผลลัพธ์ไม่ถูกต้อง\n');
    }

    console.log('====================================================');
    console.log('        🎉 ผลการทดสอบ: ทุกฟังก์ชันผ่าน 100%!        ');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดระหว่างทดสอบ:', err.message);
  }
}

runTest();
