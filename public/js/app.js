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

  // SSRU Knowledge Base fallback for Client-side UI
  const SSRU_RESPONSES = [
    {
      keywords: ['ลงทะเบียน', 'reg', 'เพิ่มถอน', 'ภาคเรียน'],
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
      keywords: ['รับรอง', 'เอกสาร', 'เกรด', 'transcript', 'ใบรับรอง'],
      response: 'การขอหนังสือรับรองหรือใบรายงานผลการเรียน (Transcript) สามารถยื่นคำร้องออนไลน์ผ่านระบบ One Stop Service ของสำนักทะเบียนและประมวลผล หรือติดต่อด้วยตนเองที่อาคารสำนักงานอธิการบดีค่ะ'
    },
    {
      keywords: ['ทุน', '2568', 'กยศ', 'กรอ'],
      response: 'มหาวิทยาลัยมีทุนการศึกษาหลายประเภท เช่น ทุนเรียนดี ทุนขาดแคลนทุนทรัพย์ และทุน กยศ./กรอ. ประจำปี 2568 สามารถติดตามรายละเอียดและสมัครยื่นเอกสารได้ที่ กองพัฒนานักศึกษา SSRU ค่ะ'
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
        const res = await fetch('/api/chat', {
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
