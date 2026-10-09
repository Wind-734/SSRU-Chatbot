// Universal Dark Mode & App Settings & Multi-Language Handler

(function () {
    // Translation Dictionary
    const TRANSLATIONS = {
        th: {
            // Common / Header / Navigation
            site_title: "SSRU Chatbot",
            university_name: "มหาวิทยาลัยราชภัฏสวนสุนันทา",
            university_sub: "Suan Sunandha Rajabhat University",
            back_to_main: "กลับหน้าหลัก",
            cancel: "ยกเลิก",
            confirm: "ยืนยัน",
            logout: "ออกจากระบบ",
            view_profile: "ดูโปรไฟล์",
            settings: "ตั้งค่า",

            // Settings Page (settings.html)
            settings_title: "ตั้งค่า",
            settings_subtitle: "ปรับแต่งการใช้งาน SSRU Chatbot ของคุณ",
            section_general: "การตั้งค่าทั่วไป",
            dark_mode_title: "โหมดมืด",
            dark_mode_desc: "เปลี่ยนรูปแบบหน้าจอเป็นโหมดมืด",
            notification_title: "การแจ้งเตือน",
            notification_desc: "เปิดหรือปิดการแจ้งเตือนระบบ",
            language_title: "ภาษา",
            language_desc: "เลือกภาษาที่ใช้แสดงผลในระบบ",
            section_data: "ข้อมูลและการบันทึก",
            chat_history_title: "ประวัติการสนทนา",
            chat_history_desc: "ล้างประวัติข้อความการสนทนาทั้งหมด",
            btn_clear_history: "ล้างประวัติ",
            section_account: "ข้อมูลบัญชี",
            user_account_title: "บัญชีผู้ใช้งาน",
            user_account_desc: "จัดการข้อมูลโปรไฟล์ส่วนตัวของคุณ",
            
            // Settings Modals
            clear_modal_title: "ยืนยันการล้างประวัติแชท",
            clear_modal_desc: "คุณต้องการลบประวัติการสนทนาทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)",
            logout_modal_title: "ยืนยันการออกจากระบบ",
            logout_modal_desc: "คุณต้องการออกจากระบบ SSRU Chatbot ใช่หรือไม่?",

            // Main Chat Page (index.html)
            new_chat: "การสนทนาใหม่",
            chat_history: "ประวัติการสนทนา",
            clear_all: "ล้างทั้งหมด",
            status_online: "ออนไลน์",
            suggested_questions: "คำถามแนะนำ:",
            prompt_reg: "การลงทะเบียนเรียนภาคเรียน",
            prompt_fee: "ขั้นตอนขอผ่อนผันค่าเทอม",
            prompt_exam: "ตารางสอบปลายภาค",
            prompt_scholarship: "ทุนการศึกษา",
            prompt_translate: "แปลภาษา TH ➔ EN",
            input_placeholder: "พิมพ์ข้อความของคุณที่นี่...",
            disclaimer: "SSRU Chatbot อาจแสดงผลข้อมูลคลาดเคลื่อนได้ กรุณาตรวจสอบข้อมูลสำคัญอีกครั้ง",
            btn_send: "ส่ง",
            btn_clear_chat: "ล้างการสนทนา",
            confirm_clear_all_title: "ยืนยันการล้างแชททั้งหมด",
            confirm_clear_all_desc: "คุณต้องการลบประวัติการสนทนาทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)",

            // User Profile Page (user.html)
            profile_title: "โปรไฟล์ผู้ใช้",
            profile_heading: "ชื่อโปรไฟล์",
            profile_role: "นักศึกษา",
            my_profile: "โปรไฟล์ของฉัน",
            profile_desc: "ข้อมูลผู้ใช้งานและรายละเอียดโปรไฟล์",
            first_name: "ชื่อ",
            last_name: "นามสกุล",
            email: "อีเมล",
            position: "ตำแหน่ง / สถานภาพ",
            department: "สาขาวิชา / คณะ",
            phone: "เบอร์โทรศัพท์",
            bio: "เกี่ยวกับฉัน / คำแนะนำตัว",
            placeholder_first_name: "กรอกชื่อ",
            placeholder_last_name: "กรอกนามสกุล",
            placeholder_email: "กรอกอีเมลของท่าน",
            placeholder_position: "กรอกตำแหน่ง",
            placeholder_department: "ข้อมูลสาขา/คณะ",
            placeholder_phone: "กรอกเบอร์โทรศัพท์ของท่าน",
            placeholder_bio: "แนะนำตัวเองสั้นๆ...",
            save_data: "บันทึกข้อมูล",
            additional_settings: "ตั้งค่าเพิ่มเติม",
            old_password: "รหัสผ่านเดิม",
            new_password: "รหัสผ่านใหม่",
            confirm_password: "ยืนยันรหัสผ่านใหม่",
            placeholder_old_password: "กรอกรหัสผ่านเดิม",
            placeholder_new_password: "กรอกรหัสผ่านใหม่",
            placeholder_confirm_password: "กรอกยืนยันรหัสผ่านใหม่",
            save_password: "แก้ไขรหัสผ่าน",

            // Login Page (login.html)
            login_title: "เข้าสู่ระบบ",
            email_or_student_id: "รหัสนักศึกษา หรืออีเมล",
            placeholder_email_id: "กรอกรหัสนักศึกษาหรืออีเมล",
            password: "รหัสผ่าน",
            placeholder_password: "กรอกรหัสผ่าน",
            forgot_password: "ลืมรหัสผ่าน?",
            remember_me: "จดจำการเข้าสู่ระบบ",
            no_account: "ยังไม่มีบัญชี?",
            register_now: "สมัครสมาชิก",

            // Register Page (register.html)
            register_title: "สมัครสมาชิก",
            register_subtitle: "กรอกข้อมูลเพื่อสร้างบัญชีของคุณ",
            full_name: "ชื่อ–นามสกุล",
            student_id: "รหัสนักศึกษา",
            placeholder_fullname: "กรอกชื่อและนามสกุล",
            placeholder_student_id: "กรอกรหัสนักศึกษา",
            placeholder_reg_email: "เช่น student@ssru.ac.th",
            confirm_register_password: "ยืนยันรหัสผ่าน",
            placeholder_confirm_reg_password: "กรอกยืนยันรหัสผ่าน",
            btn_register: "สมัครสมาชิก",
            already_have_account: "มีบัญชีอยู่แล้ว?",
            login_now: "เข้าสู่ระบบ",

            // Toasts & Alerts
            toast_lang_switched: "เปลี่ยนเป็นภาษาไทยเรียบร้อยแล้ว",
            toast_dark_on: "เปิดโหมดมืดเรียบร้อยแล้ว",
            toast_dark_off: "ปิดโหมดมืดเรียบร้อยแล้ว",
            toast_notif_on: "เปิดการแจ้งเตือนแล้ว",
            toast_notif_off: "ปิดการแจ้งเตือนแล้ว",
            toast_cleared: "ล้างประวัติการสนทนาเรียบร้อยแล้ว"
        },
        en: {
            // Common / Header / Navigation
            site_title: "SSRU Chatbot",
            university_name: "Suan Sunandha Rajabhat University",
            university_sub: "Suan Sunandha Rajabhat University",
            back_to_main: "Back to Home",
            cancel: "Cancel",
            confirm: "Confirm",
            logout: "Logout",
            view_profile: "View Profile",
            settings: "Settings",

            // Settings Page (settings.html)
            settings_title: "Settings",
            settings_subtitle: "Customize your SSRU Chatbot experience",
            section_general: "General Settings",
            dark_mode_title: "Dark Mode",
            dark_mode_desc: "Switch display theme to dark mode",
            notification_title: "Notifications",
            notification_desc: "Enable or disable system notifications",
            language_title: "Language",
            language_desc: "Select system display language",
            section_data: "Data & Storage",
            chat_history_title: "Chat History",
            chat_history_desc: "Clear all saved chat logs",
            btn_clear_history: "Clear History",
            section_account: "Account Information",
            user_account_title: "User Account",
            user_account_desc: "Manage your personal profile details",

            // Settings Modals
            clear_modal_title: "Confirm Clear History",
            clear_modal_desc: "Are you sure you want to clear all chat history? (This action cannot be undone)",
            logout_modal_title: "Confirm Logout",
            logout_modal_desc: "Are you sure you want to log out of SSRU Chatbot?",

            // Main Chat Page (index.html)
            new_chat: "New Chat",
            chat_history: "Chat History",
            clear_all: "Clear All",
            status_online: "Online",
            suggested_questions: "Suggested Questions:",
            prompt_reg: "Course Registration",
            prompt_fee: "Tuition Deferment Steps",
            prompt_exam: "Final Exam Schedule",
            prompt_scholarship: "Scholarships",
            prompt_translate: "Translate TH ➔ EN",
            input_placeholder: "Type your message here...",
            disclaimer: "SSRU Chatbot may display inaccurate info. Please verify important details.",
            btn_send: "Send",
            btn_clear_chat: "Clear Chat",
            confirm_clear_all_title: "Confirm Clear All Chats",
            confirm_clear_all_desc: "Are you sure you want to delete all chat history? (This action cannot be undone)",

            // User Profile Page (user.html)
            profile_title: "User Profile",
            profile_heading: "Profile Name",
            profile_role: "Student",
            my_profile: "My Profile",
            profile_desc: "User information and profile details",
            first_name: "First Name",
            last_name: "Last Name",
            email: "Email",
            position: "Position / Status",
            department: "Major / Faculty",
            phone: "Phone Number",
            bio: "About Me / Bio",
            placeholder_first_name: "Enter first name",
            placeholder_last_name: "Enter last name",
            placeholder_email: "Enter your email",
            placeholder_position: "Enter position",
            placeholder_department: "Major/Faculty info",
            placeholder_phone: "Enter phone number",
            placeholder_bio: "Short bio about yourself...",
            save_data: "Save Changes",
            additional_settings: "Additional Settings",
            old_password: "Current Password",
            new_password: "New Password",
            confirm_password: "Confirm New Password",
            placeholder_old_password: "Enter current password",
            placeholder_new_password: "Enter new password",
            placeholder_confirm_password: "Confirm new password",
            save_password: "Change Password",

            // Login Page (login.html)
            login_title: "Log In",
            email_or_student_id: "Student ID or Email",
            placeholder_email_id: "Enter Student ID or Email",
            password: "Password",
            placeholder_password: "Enter password",
            forgot_password: "Forgot password?",
            remember_me: "Remember me",
            no_account: "Don't have an account?",
            register_now: "Register now",

            // Register Page (register.html)
            register_title: "Register",
            register_subtitle: "Fill in your details to create an account",
            full_name: "Full Name",
            student_id: "Student ID",
            placeholder_fullname: "Enter full name",
            placeholder_student_id: "Enter student ID",
            placeholder_reg_email: "e.g. student@ssru.ac.th",
            confirm_register_password: "Confirm Password",
            placeholder_confirm_reg_password: "Confirm your password",
            btn_register: "Sign Up",
            already_have_account: "Already have an account?",
            login_now: "Log In",

            // Toasts & Alerts
            toast_lang_switched: "Switched to English successfully",
            toast_dark_on: "Dark mode enabled",
            toast_dark_off: "Dark mode disabled",
            toast_notif_on: "Notifications enabled",
            toast_notif_off: "Notifications disabled",
            toast_cleared: "Chat history cleared"
        }
    };

    // Global Function to Apply Selected Language
    function applyLanguage(lang) {
        const targetLang = lang === "en" ? "en" : "th";
        const dict = TRANSLATIONS[targetLang];
        document.documentElement.lang = targetLang;

        // 1. Update elements with data-i18n attribute
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) {
                const icon = el.querySelector("i, svg");
                if (icon) {
                    const iconClone = icon.cloneNode(true);
                    el.innerText = "";
                    el.appendChild(iconClone);
                    const spaceNode = document.createTextNode(" " + dict[key]);
                    el.appendChild(spaceNode);
                } else {
                    el.innerText = dict[key];
                }
            }
        });

        // 2. Update placeholders with data-i18n-placeholder
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (dict[key]) {
                el.placeholder = dict[key];
            }
        });

        // 3. Update titles with data-i18n-title
        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            const key = el.getAttribute("data-i18n-title");
            if (dict[key]) {
                el.title = dict[key];
            }
        });

        // 4. Update prompt chips for active language
        document.querySelectorAll(".prompt-chip").forEach(chip => {
            if (targetLang === "en" && chip.getAttribute("data-prompt-en")) {
                chip.setAttribute("data-active-prompt", chip.getAttribute("data-prompt-en"));
            } else if (chip.getAttribute("data-prompt")) {
                chip.setAttribute("data-active-prompt", chip.getAttribute("data-prompt"));
            }
        });

        // Dispatch window event for page specific scripts (e.g. app.js)
        window.dispatchEvent(new CustomEvent("languageChange", { detail: { language: targetLang } }));
    }

    // Expose applyLanguage globally if needed
    window.applyAppLanguage = applyLanguage;

    // Apply Dark Mode class to html & body
    function applyDarkMode(isDark) {
        if (isDark) {
            document.documentElement.classList.add("dark");
            document.body.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
            document.body.classList.remove("dark");
        }
    }

    // Apply immediately on initial script execution
    const isDarkSaved = localStorage.getItem("darkMode") === "true";
    if (document.body) {
        applyDarkMode(isDarkSaved);
    } else {
        document.addEventListener("DOMContentLoaded", () => applyDarkMode(isDarkSaved));
    }

    // Apply initial language as early as possible
    const savedLang = localStorage.getItem("language") || "th";
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => applyLanguage(savedLang));
    } else {
        applyLanguage(savedLang);
    }

    // Listen for storage changes across tabs/windows
    window.addEventListener("storage", (e) => {
        if (e.key === "darkMode") {
            const isDark = e.newValue === "true";
            applyDarkMode(isDark);
            const darkModeToggle = document.getElementById("darkMode");
            if (darkModeToggle) darkModeToggle.checked = isDark;
        }
        if (e.key === "language") {
            const newLang = e.newValue || "th";
            applyLanguage(newLang);
            const languageSelect = document.getElementById("language");
            if (languageSelect) languageSelect.value = newLang;
        }
    });

    // Toast notification helper
    function showToast(message, icon = "fa-circle-check") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 2700);
    }

    // Initialize UI elements when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        const isDark = localStorage.getItem("darkMode") === "true";
        applyDarkMode(isDark);

        const activeLang = localStorage.getItem("language") || "th";
        applyLanguage(activeLang);

        // 1. Dark Mode Toggle
        const darkModeToggle = document.getElementById("darkMode");
        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
            darkModeToggle.addEventListener("change", function () {
                localStorage.setItem("darkMode", this.checked);
                applyDarkMode(this.checked);
                const currentLang = localStorage.getItem("language") || "th";
                const msg = this.checked
                    ? TRANSLATIONS[currentLang].toast_dark_on
                    : TRANSLATIONS[currentLang].toast_dark_off;
                showToast(msg);
            });
        }

        // 2. Notification Toggle
        const notificationToggle = document.getElementById("notification");
        if (notificationToggle) {
            notificationToggle.checked = localStorage.getItem("notification") !== "false";
            notificationToggle.addEventListener("change", function () {
                localStorage.setItem("notification", this.checked);
                const currentLang = localStorage.getItem("language") || "th";
                const msg = this.checked
                    ? TRANSLATIONS[currentLang].toast_notif_on
                    : TRANSLATIONS[currentLang].toast_notif_off;
                showToast(msg);
            });
        }

        // 3. Language Select Control
        const languageSelect = document.getElementById("language");
        if (languageSelect) {
            languageSelect.value = activeLang;

            languageSelect.addEventListener("change", function () {
                const newLang = this.value;
                localStorage.setItem("language", newLang);
                applyLanguage(newLang);
                const msg = TRANSLATIONS[newLang].toast_lang_switched;
                showToast(msg);
            });
        }

        // 4. Clear History Modal Controls
        const btnOpenClearModal = document.getElementById("btn-open-clear-modal");
        const clearModal = document.getElementById("clear-history-modal");
        const btnCancelClear = document.getElementById("btn-cancel-clear");
        const btnConfirmClear = document.getElementById("btn-confirm-clear");

        if (btnOpenClearModal && clearModal) {
            btnOpenClearModal.addEventListener("click", () => clearModal.classList.add("active"));
        }

        if (btnCancelClear && clearModal) {
            btnCancelClear.addEventListener("click", () => clearModal.classList.remove("active"));
        }

        if (clearModal) {
            clearModal.addEventListener("click", (e) => {
                if (e.target === clearModal) clearModal.classList.remove("active");
            });
        }

        if (btnConfirmClear) {
            btnConfirmClear.addEventListener("click", () => {
                localStorage.removeItem("ssru_chat_history");
                localStorage.removeItem("ssru_current_chat_id");
                if (clearModal) clearModal.classList.remove("active");
                const currentLang = localStorage.getItem("language") || "th";
                showToast(TRANSLATIONS[currentLang].toast_cleared);
                // Dispatch event so app.js can reset chat UI if open
                window.dispatchEvent(new CustomEvent("chatHistoryCleared"));
            });
        }

        // 5. Logout Modal Controls
        const btnOpenLogoutModal = document.getElementById("btn-open-logout-modal");
        const logoutModal = document.getElementById("logout-modal");
        const btnCancelLogout = document.getElementById("btn-cancel-logout");
        const btnConfirmLogout = document.getElementById("btn-confirm-logout");

        if (btnOpenLogoutModal && logoutModal) {
            btnOpenLogoutModal.addEventListener("click", (e) => {
                e.preventDefault();
                logoutModal.classList.add("active");
            });
        }

        if (btnCancelLogout && logoutModal) {
            btnCancelLogout.addEventListener("click", () => logoutModal.classList.remove("active"));
        }

        if (logoutModal) {
            logoutModal.addEventListener("click", (e) => {
                if (e.target === logoutModal) logoutModal.classList.remove("active");
            });
        }

        if (btnConfirmLogout) {
            btnConfirmLogout.addEventListener("click", () => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = "login.html";
            });
        }

        // ESC key handler for modals
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (clearModal) clearModal.classList.remove("active");
                if (logoutModal) logoutModal.classList.remove("active");
            }
        });
    });
})();

// Toggle Password Visibility Helper
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(iconId);
    if (!passwordInput || !passwordIcon) return;

    const isPasswordHidden = passwordInput.type === "password";
    passwordInput.type = isPasswordHidden ? "text" : "password";

    passwordIcon.classList.toggle("fa-eye", !isPasswordHidden);
    passwordIcon.classList.toggle("fa-eye-slash", isPasswordHidden);
}

// Global Logout Helper Function
function logout() {
    const logoutModal = document.getElementById("logout-modal");
    if (logoutModal) {
        logoutModal.classList.add("active");
    } else {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "login.html";
    }
}

