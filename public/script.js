const socket = io();

// Запрос ника перед началом чата
let username = prompt("Введите ваш ник:");
while (!username) {
    username = prompt("Введите ваш ник:");
}

// Отправка ника серверу
socket.emit('setUsername', username);

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.getElementById("messages");

// Отправка сообщений
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message !== "") {
        socket.emit("chatMessage", { username, message });
        messageInput.value = "";
        socket.emit("stopTyping");
    }
});

// Отображение сообщений
socket.on("chatMessage", (data) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Отслеживание набора текста
messageInput.addEventListener("input", () => {
    socket.emit("typing");
});

// Отображение "Пользователь печатает..."
socket.on("typing", (username) => {
    let typingIndicator = document.getElementById("typingIndicator");
    if (!typingIndicator) {
        typingIndicator = document.createElement("div");
        typingIndicator.id = "typingIndicator";
        typingIndicator.style.color = "#666";
        messagesContainer.appendChild(typingIndicator);
    }
    typingIndicator.textContent = `${username} печатает...`;
});

// Скрытие "Пользователь печатает..."
socket.on("stopTyping", () => {
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
        typingIndicator.remove();
    }
});

socket.off("chatMessage"); // Удаляет старые обработчики перед добавлением нового

socket.on("chatMessage", (data) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Проверяем, активна ли вкладка
    if (document.hidden && Notification.permission === "granted") {
        new Notification(`${data.username} написал:`, {
            body: data.message,
            icon: "chat-icon.png" // Можно заменить на свою иконку
        });
    }
});

const filter = new Filter();

function filterBadWords(text) {
    return filter.clean(text);
}

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let message = messageInput.value.trim();
    if (message !== "") {
        message = filterBadWords(message); // Фильтруем перед отправкой
        socket.emit("chatMessage", { username, message });
        messageInput.value = "";
        socket.emit("stopTyping");
    }
});
