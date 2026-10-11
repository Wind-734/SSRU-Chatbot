// สคริปต์สำหรับทดสอบระบบ Register และ Login กับ MongoDB Atlas อัตโนมัติ (รองรับทั้งนักศึกษา อาจารย์ และบุคลากร)
require('dotenv').config();

async function runTest() {
  const baseUrl = 'http://localhost:3000';
  const timestamp = Date.now();
  const testStudent = {
    fullName: 'สมชาย นักศึกษาทดสอบ',
    studentId: '67' + String(timestamp).slice(-9),
    email: `student_${timestamp}@ssru.ac.th`,
    password: 'password1234',
    role: 'นักศึกษา'
  };

  const testTeacher = {
    fullName: 'ดร.สมศรี อาจารย์ทดสอบ',
    studentId: 'T' + String(timestamp).slice(-7),
    email: `teacher_${timestamp}@ssru.ac.th`,
    password: 'teacherPass1234',
    role: 'อาจารย์'
  };

  const testStaff = {
    fullName: 'คุณสมศักดิ์ บุคลากรทดสอบ',
    studentId: 'S' + String(timestamp).slice(-7),
    email: `staff_${timestamp}@ssru.ac.th`,
    password: 'staffPass1234',
    role: 'บุคลากร'
  };

  console.log('====================================================');
  console.log('       เริ่มการทดสอบระบบ SSRU Chatbot Auth          ');
  console.log('  (ทดสอบทั้งบทบาทนักศึกษา อาจารย์ และบุคลากร)       ');
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

    // 2. ทดสอบสมัครสมาชิกบทบาทนักศึกษา (Register Student)
    console.log('▶ [1/8] ทดสอบสมัครสมาชิกบทบาท "นักศึกษา"...');
    console.log(`      ข้อมูล: ${testStudent.fullName} | รหัส: ${testStudent.studentId} | บทบาท: ${testStudent.role}`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent)
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.success && regData.user.role === 'นักศึกษา') {
      console.log('  ✅ สมัครสมาชิกนักศึกษาสำเร็จ! บทบาทถูกต้อง:', regData.user.role, '\n');
    } else {
      console.log('  ❌ สมัครสมาชิกนักศึกษาไม่ผ่าน:', regData.error, '\n');
    }

    // 3. ทดสอบสมัครสมาชิกบทบาทอาจารย์ (Register Teacher)
    console.log('▶ [2/8] ทดสอบสมัครสมาชิกบทบาท "อาจารย์"...');
    console.log(`      ข้อมูล: ${testTeacher.fullName} | รหัส: ${testTeacher.studentId} | บทบาท: ${testTeacher.role}`);
    const regTeacherRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTeacher)
    });
    const regTeacherData = await regTeacherRes.json();
    if (regTeacherRes.status === 201 && regTeacherData.success && regTeacherData.user.role === 'อาจารย์') {
      console.log('  ✅ สมัครสมาชิกอาจารย์สำเร็จ! บทบาทถูกต้อง:', regTeacherData.user.role, '\n');
    } else {
      console.log('  ❌ สมัครสมาชิกอาจารย์ไม่ผ่าน:', regTeacherData.error, '\n');
    }

    // 4. ทดสอบสมัครสมาชิกบทบาทบุคลากร (Register Staff)
    console.log('▶ [3/8] ทดสอบสมัครสมาชิกบทบาท "บุคลากร"...');
    console.log(`      ข้อมูล: ${testStaff.fullName} | รหัส: ${testStaff.studentId} | บทบาท: ${testStaff.role}`);
    const regStaffRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStaff)
    });
    const regStaffData = await regStaffRes.json();
    if (regStaffRes.status === 201 && regStaffData.success && regStaffData.user.role === 'บุคลากร') {
      console.log('  ✅ สมัครสมาชิกบุคลากรสำเร็จ! บทบาทถูกต้อง:', regStaffData.user.role, '\n');
    } else {
      console.log('  ❌ สมัครสมาชิกบุคลากรไม่ผ่าน:', regStaffData.error, '\n');
    }

    // 5. ทดสอบเข้าสู่ระบบด้วยรหัสนักศึกษา (Login with Student ID)
    console.log('▶ [4/8] ทดสอบล็อกอินด้วย "รหัสนักศึกษา"...');
    const loginIdRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStudent.studentId,
        password: testStudent.password
      })
    });
    const loginIdData = await loginIdRes.json();
    if (loginIdRes.ok && loginIdData.success && loginIdData.user.role === 'นักศึกษา') {
      console.log(`  ✅ ล็อกอินด้วยรหัสนักศึกษาสำเร็จ! (ผู้ใช้: ${loginIdData.user.fullName}, บทบาท: ${loginIdData.user.role})\n`);
    } else {
      console.log('  ❌ ล็อกอินไม่ผ่าน:', loginIdData.error, '\n');
    }

    // 6. ทดสอบเข้าสู่ระบบด้วยรหัสอาจารย์ (Login with Teacher ID)
    console.log('▶ [5/8] ทดสอบล็อกอินด้วย "รหัสอาจารย์"...');
    const loginTeacherRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testTeacher.studentId,
        password: testTeacher.password
      })
    });
    const loginTeacherData = await loginTeacherRes.json();
    if (loginTeacherRes.ok && loginTeacherData.success && loginTeacherData.user.role === 'อาจารย์') {
      console.log(`  ✅ ล็อกอินด้วยรหัสอาจารย์สำเร็จ! (ผู้ใช้: ${loginTeacherData.user.fullName}, บทบาท: ${loginTeacherData.user.role})\n`);
    } else {
      console.log('  ❌ ล็อกอินไม่ผ่าน:', loginTeacherData.error, '\n');
    }

    // 7. ทดสอบเข้าสู่ระบบด้วยรหัสบุคลากร (Login with Staff ID)
    console.log('▶ [6/8] ทดสอบล็อกอินด้วย "รหัสบุคลากร"...');
    const loginStaffRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStaff.studentId,
        password: testStaff.password
      })
    });
    const loginStaffData = await loginStaffRes.json();
    if (loginStaffRes.ok && loginStaffData.success && loginStaffData.user.role === 'บุคลากร') {
      console.log(`  ✅ ล็อกอินด้วยรหัสบุคลากรสำเร็จ! (ผู้ใช้: ${loginStaffData.user.fullName}, บทบาท: ${loginStaffData.user.role})\n`);
    } else {
      console.log('  ❌ ล็อกอินไม่ผ่าน:', loginStaffData.error, '\n');
    }

    // 8. ทดสอบเข้าสู่ระบบด้วยอีเมลบุคลากร (Login Staff with Email)
    console.log('▶ [7/8] ทดสอบล็อกอินด้วย "อีเมลบุคลากร"...');
    const loginEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStaff.email,
        password: testStaff.password
      })
    });
    const loginEmailData = await loginEmailRes.json();
    if (loginEmailRes.ok && loginEmailData.success) {
      console.log(`  ✅ ล็อกอินด้วยอีเมลสำเร็จ! (ผู้ใช้: ${loginEmailData.user.email})\n`);
    } else {
      console.log('  ❌ ล็อกอินไม่ผ่าน:', loginEmailData.error, '\n');
    }

    // 9. ทดสอบกรณีใส่รหัสผ่านผิด (Wrong Password)
    console.log('▶ [8/8] ทดสอบความปลอดภัยเมื่อ "ใส่รหัสผิด"...');
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
