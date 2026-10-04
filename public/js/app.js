document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const btnSend = document.getElementById('btn-send');
  const historyList = document.getElementById('history-list');
  const btnNewChat = document.getElementById('btn-new-chat');
  const btnClearChat = document.getElementById('btn-clear-chat');
  const quickPromptsContainer = document.getElementById('quick-prompts-container');
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // SSRU Knowledge Base fallback for Client-side UI & Local Static Execution
  const SSRU_RESPONSES = [
    {
      keywords: ['ช่องทาง', 'ชำระเงิน', 'จ่ายเงิน', 'ค่าธรรมเนียม', 'ค่าเทอม', 'การชำระเงิน', 'ใบชำระเงิน', 'invoice', 'qr code', 'โอนเงิน', 'ธนาคาร'],
      response: 'การชำระเงินและค่าธรรมเนียมการศึกษา SSRU:\n1. การพิมพ์ใบชำระเงิน (Invoice): เข้าสู่ระบบ e-Regis (reg.ssru.ac.th) เมนู "พิมพ์ใบชำระเงิน"\n2. ช่องทางการชำระเงิน: ชำระผ่าน App Mobile Banking ทุกธนาคารโดยสแกน QR Code บนใบชำระเงิน หรือชำระผ่านเคาน์เตอร์ธนาคารกรุงเทพ / ธนาคารไทยพาณิชย์\n3. การขอผ่อนผันค่าเทอม: ยื่นคำร้องขอผ่อนผันออนไลน์ผ่านระบบ reg.ssru.ac.th หรือกองพัฒนานักศึกษา ตามกำหนดในปฏิทินการศึกษาค่ะ'
    },
    {
      keywords: ['ลงทะเบียน', 'reg', 'เพิ่มถอน', 'ภาคเรียน', 'วิชา', 'แผนการเรียน', 'ลงเรียน'],
      response: 'ขั้นตอนการลงทะเบียนเรียน มหาวิทยาลัยราชภัฏสวนสุนันทา:\n1. เข้าสู่ระบบ e-Regis ทางเว็บไซต์ reg.ssru.ac.th\n2. เลือกเมนู "ลงทะเบียนเรียน" และเลือกรายวิชาตามแผนการเรียน\n3. ตรวจสอบรายวิชาและกลุ่มเรียน (Sec) แล้วคลิกบันทึกและยืนยัน\n4. เพิ่ม-ถอนรายวิชา (Add/Drop) สามารถทำได้ภายใน 2 สัปดาห์แรกของการเปิดภาคเรียนผ่านระบบออนไลน์ค่ะ'
    },
    {
      keywords: ['ผ่อนผัน', 'ขอผ่อนผัน', 'ผ่อนชำระ'],
      response: 'การขอผ่อนผันค่าธรรมเนียมการศึกษา นักศึกษาสามารถยื่นคำร้องผ่านระบบออนไลน์ reg.ssru.ac.th หรือติดต่อกองพัฒนานักศึกษาตามกำหนดเวลาในปฏิทินการศึกษา โดยแนบสำเนาบัตรนักศึกษาและแบบฟอร์มขอผ่อนผันค่ะ'
    },
    {
      keywords: ['สอบ', 'ตารางสอบ', 'สอบปลายภาค', 'สอบกลางภาค', 'ห้องสอบ'],
      response: 'การตรวจสอบตารางสอบ: สามารถตรวจสอบวัน เวลา และห้องสอบกลางภาค/ปลายภาคได้ที่เว็บไซต์ reg.ssru.ac.th ในเมนู "ตารางสอบนักศึกษา" โดยระบุรหัสนักศึกษาค่ะ'
    },
    {
      keywords: ['เกรด', 'แก้เกรด', 'ติด i', 'ผลการเรียน', 'gpax', 'เช็คเกรด', 'เช็คผลการเรียน'],
      response: 'การตรวจสอบผลการเรียนและการขอแก้เกรด I:\n1. ตรวจสอบเกรด (เช็คเกรด) ประจำภาคเรียนได้ในระบบ e-Regis เมนู "ผลการเรียน"\n2. กรณีติดเกรด I ให้ติดต่ออาจารย์ผู้สอนเพื่อส่งงาน/สอบประเมินเพิ่มเติม แล้วยื่นคำร้องขอแก้เกรดต่อฝ่ายทะเบียนฯ ภายในระยะเวลาที่กำหนดค่ะ'
    },
    {
      keywords: ['รับรอง', 'เอกสาร', 'transcript', 'ใบรับรอง', 'ใบเกรด', 'one stop'],
      response: 'การขอเอกสารทางการศึกษาออนไลน์ (One Stop Service):\n1. ยื่นคำร้องขอเอกสารที่ reg.ssru.ac.th ในระบบ One Stop Service\n2. สามารถขอใบ Transcript (ไทย/อังกฤษ), หนังสือรับรองสถานภาพนักศึกษา หรือใบรับรองคาดว่าจะสำเร็จการศึกษา\n3. เลือกรับเป็นไฟล์ดิจิทัล PDF, รับด้วยตนเองที่ฝ่ายทะเบียนฯ อาคาร 32 ชั้น 1 หรือส่งทางไปรษณีย์ค่ะ'
    },
    {
      keywords: ['ทุน', 'ทุนการศึกษา', '2568', 'กยศ', 'กรอ', 'กู้ยืม'],
      response: 'ทุนการศึกษาและ กยศ./กรอ. SSRU:\n1. กู้ยืม กยศ./กรอ.: ยื่นคำร้องผ่านระบบ DSL ของกองทุนฯ และยืนยันข้อมูลในระบบ e-Regis / กองพัฒนานักศึกษา\n2. ทุนการศึกษา: มีทั้งทุนเรียนดี ทุนขาดแคลนทุนทรัพย์ และทุนกิจกรรม ติดตามประกาศเปิดรับสมัครทาง reg.ssru.ac.th และแฟนเพจกองพัฒนานักศึกษา SSRU ค่ะ'
    },
    {
      keywords: ['ลาพัก', 'ลาพักการเรียน', 'พ้นสภาพ', 'รักษาสภาพ', 'คืนสภาพ'],
      response: 'สถานภาพนักศึกษาและการลาพักการเรียน:\n1. การขอลาพักการเรียน: ยื่นคำร้องผ่านระบบ e-Regis โดยได้รับการอนุมัติจากอาจารย์ที่ปรึกษาและคณบดี\n2. การรักษาสภาพ: ต้องชำระค่าธรรมเนียมรักษาสภาพนักศึกษาตามกำหนดเพื่อป้องกันการพ้นสภาพค่ะ'
    },
    {
      keywords: ['ติดต่อ', 'อาคาร 32', 'เวลาทำการ', 'ฝ่ายทะเบียน', 'สถานที่'],
      response: 'ข้อมูลติดต่อ ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา:\n- เว็บไซต์: reg.ssru.ac.th (ทางลัด: share.google/o9BnGzbQACRVfvE4n)\n- ที่ตั้ง: อาคาร 32 ชั้น 1 มหาวิทยาลัยราชภัฏสวนสุนันทา\n- เวลาทำการ: จันทร์ - ศุกร์ 08:30 - 16:30 น. (เว้นวันหยุดนักขัตฤกษ์)ค่ะ'
    }
  ];

  const WELCOME_MESSAGE = {
    sender: 'bot',
    text: 'สวัสดีค่ะ ดิฉันคือ SSRU Chatbot ผู้ช่วยอัจฉริยะมหาวิทยาลัยราชภัฏสวนสุนันทา ยินดีให้บริการค่ะ มีเรื่องใดให้ช่วยเหลือสอบถามได้เลยนะคะ'
  };

  // Initial Chat History - clean state for new users
  let historyData = [
    {
      id: '1',
      title: 'การสนทนาใหม่',
      messages: [{ ...WELCOME_MESSAGE }]
    }
  ];

  let currentHistoryId = '1';

  // Initialize UI
  init();

  function init() {
    renderHistoryList();
    loadCurrentChat();
    setupEventListeners();
  }

  // Render History List in Sidebar
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
      renderTranscript([{ ...WELCOME_MESSAGE }]);
    }
  }

  // Select History Item
  function selectHistoryItem(id) {
    currentHistoryId = id;
    renderHistoryList();
    loadCurrentChat();
    closeSidebarMobile();
  }

  // Delete History Item
  function deleteHistoryItem(id) {
    historyData = historyData.filter(h => h.id !== id);
    if (currentHistoryId === id) {
      if (historyData.length > 0) {
        selectHistoryItem(historyData[0].id);
      } else {
        startNewChat();
      }
    } else {
      renderHistoryList();
    }
  }

  // Start New Chat
  function startNewChat() {
    const newId = Date.now().toString();
    const newItem = {
      id: newId,
      title: 'การสนทนาใหม่',
      messages: [{ ...WELCOME_MESSAGE }]
    };
    historyData.unshift(newItem);
    currentHistoryId = newId;

    renderHistoryList();
    renderTranscript(newItem.messages);
    closeSidebarMobile();
  }

  // Render Full Transcript
  function renderTranscript(messages) {
    if (!chatMessages) return;
    chatMessages.innerHTML = '';
    messages.forEach(msg => appendMessageUI(msg.sender, msg.text));
    scrollToBottom();
  }

  // Append Single Message Row to UI
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
  }

  // Typing Indicator
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

  // User Message Sending
  async function sendMessage(text) {
    if (!text || text.trim() === '') return;

    const userMsg = text.trim();
    if (userInput) userInput.value = '';
    toggleSendButtonState();

    const currentChat = getCurrentChat();
    if (!currentChat) return;

    // 1. Append User Message
    currentChat.messages.push({ sender: 'user', text: userMsg });
    appendMessageUI('user', userMsg);
    scrollToBottom();

    // Update title if default
    if (currentChat.title === 'การสนทนาใหม่') {
      currentChat.title = userMsg.length > 22 ? userMsg.substring(0, 22) + '...' : userMsg;
      renderHistoryList();
    }

    // 2. Show Typing Indicator
    showTypingIndicator();

    // 3. Get response from API or Fallback
    try {
      let botReply = '';
      try {
        const apiUrl = (window.location.origin && window.location.origin.startsWith('http'))
          ? '/api/chat'
          : 'http://localhost:3000/api/chat';

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg })
        });
        if (res.ok) {
          const data = await res.json();
          botReply = data.reply;
        }
      } catch (apiErr) {
        // Fetch failed (e.g. running statically without server), fallback to local logic
      }

      if (!botReply) {
        botReply = generateResponse(userMsg);
      }

      setTimeout(() => {
        hideTypingIndicator();
        currentChat.messages.push({ sender: 'bot', text: botReply });
        appendMessageUI('bot', botReply);
        scrollToBottom();
      }, 500);
    } catch (err) {
      hideTypingIndicator();
      const fallbackReply = generateResponse(userMsg);
      currentChat.messages.push({ sender: 'bot', text: fallbackReply });
      appendMessageUI('bot', fallbackReply);
      scrollToBottom();
    }
  }

  // Local Response Generator Logic
  function generateResponse(msg) {
    const lower = msg.toLowerCase();
    for (const item of SSRU_RESPONSES) {
      if (item.keywords.some(kw => lower.includes(kw))) {
        return item.response;
      }
    }

    if (lower.includes('สวัสดี') || lower.includes('หวัดดี') || lower.includes('hi') || lower.includes('hello')) {
      return 'สวัสดีค่ะ มีอะไรให้ SSRU Chatbot ช่วยเหลือเกี่ยวกับการเรียนการสอนหรือเรื่องในมหาวิทยาลัยวันนี้ไหมคะ?';
    }

    if (lower.includes('ขอบคุณ') || lower.includes('ขอบใจ') || lower.includes('thanks')) {
      return 'ยินดีให้บริการค่ะ มีเรื่องอื่นต้องการสอบถามเพิ่มเติมบอกได้เสมอเลยนะคะ';
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
          currentChat.messages = [{ ...WELCOME_MESSAGE }];
          renderTranscript(currentChat.messages);
        }
      });
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
        if (e.target === logoutModal) {
          closeLogoutModal();
        }
      });
    }

    if (btnConfirmLogout) {
      btnConfirmLogout.addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'login.html';
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLogoutModal();
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
});
