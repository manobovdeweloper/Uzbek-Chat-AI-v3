// Kirish funksiyasi
function enterChat() {
    const username = document.getElementById('username').value.trim();
    if (username !== "") {
        document.getElementById('display-name').innerText = username;
        document.getElementById('avatar-circle').innerText = username.substring(0, 2).toUpperCase();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('chat-section').classList.remove('hidden');
    } else {
        alert("Iltimos, ismingizni kiriting!");
    }
}

// Botning kengaytirilgan bilimlar bazasi
const botDatabase = {
    // Salomlashish
    "salom": "Assalomu alaykum! Xush kelibsiz. Bugun sizga qanday yordam bera olaman? 😊",
    "assalom": "Va alaykum assalom! Kuningiz xayrli o'tsin. ✨",
    "alik": "Alik olganingiz uchun rahmat! Kayfiyatlar qalay?",

    // Hol-ahvol
    "qalesiz": "Zo'r, rahmat! O'zingizda nima gaplar? 🚀",
    "yaxshimisiz": "Allohga shukur, juda yaxshiman. Sizda hammasi joyidami?",
    "tinchmi": "Ha, hammasi tinch. Sizda-chi?",
    "yomon": "Xafa bo'lmang, hamma narsa yaxshi bo'ladi! Men siz bilanman. 💪",

    // Ma'lumot
    "isming nima": "Men Manopov tomonidan yaratilgan aqlli yordamchi - 'CyberBot'man! 🤖",
    "nima qila olasan": "Men siz bilan suhbatlashaman, savollarga javob beraman va kayfiyatingizni ko'taraman! ⚡",
    "kim yaratgan": "Meni dasturchi Manopov yaratgan. 💻",
    "vaqt": "Hozir soat: " + new Date().getHours() + ":" + new Date().getMinutes().toString().padStart(2, '0'),
    "bugun": "Bugun: " + new Date().toLocaleDateString('uz-UZ'),

    // Motivatsiya va hazil
    "zerikdim": "Zerikishga vaqt yo'q! Keling, biror qiziqarli narsa haqida gaplashamiz yoki kod yozamiz! ⌨️",
    "hazil": "Dasturchining xotini: 'Non olib kel, agar tuxum bo'lsa 10 ta ol'. Dasturchi 10 ta non olib kelibdi. Chunki tuxum bor ekan! 😂",
    "motivatsiya": "To'xtamang! Bugungi kichik qadam ertangi katta g'alabadir. 🏆",
    "rahmat": "Arziydi, har doim xizmatingizdaman! ✨",
    "nimalarni bilasan": "hozircha cheklangan miqdorda narsalarni bilaman",

    // Xayrlashuv
    "hayr": "Sog' bo'ling! Yana suhbatlashamiz degan umiddaman. 👋",
    "charchadim": "Biroz dam oling, sog'lik hamma narsadan muhim! ☕"
};

// Xabar yuborish funksiyasi
function sendMessage() {
    const input = document.getElementById('msg-input');
    const chatBox = document.getElementById('chat-box');
    const typingStatus = document.getElementById('typing-status');
    const userText = input.value.trim();

    if (userText !== "") {
        createMessage(userText, 'user');
        input.value = "";
        
        // Bot "o'ylayotganini" ko'rsatish
        typingStatus.classList.remove('hidden');
        chatBox.scrollTop = chatBox.scrollHeight;

        setTimeout(() => {
            typingStatus.classList.add('hidden');
            const lowerText = userText.toLowerCase();
            let botReply = "Kechirasiz, buni tushunmadim. Savolingizni boshqacha yozib ko'ring yoki 'hazil' deb yozing! 🧐";

            // Kalit so'zlarni qidirish
            for (let key in botDatabase) {
                if (lowerText.includes(key)) {
                    botReply = botDatabase[key];
                    break;
                }
            }

            createMessage(botReply, 'bot');
        }, 1000);
    }
}

function createMessage(text, sender) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    msgDiv.innerHTML = `
        <div class="msg-text">${text}</div>
        <span style="font-size: 10px; opacity: 0.6; display: block; text-align: right; margin-top: 5px;">${time}</span>
    `;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Enter tugmasi
document.getElementById('msg-input').addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});