const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const leoProfanity = require("leo-profanity");
const useragent = require("useragent"); // Библиотека для определения устройства

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    const indexPath = path.join(__dirname, "public", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Ошибка отправки index.html:", err);
            res.status(500).send("Файл не найден");
        }
    });
});

const users = {};

leoProfanity.add(leoProfanity.getDictionary("ru"));
leoProfanity.add(leoProfanity.getDictionary("en"));

io.on("connection", (socket) => {
    const agent = useragent.parse(socket.handshake.headers["user-agent"]); // Определяем устройство
    let deviceInfo = `${agent.family} (${agent.os})`; // Например: Chrome (Windows 10)

    console.log(`📲 Новый пользователь подключился с устройства: ${deviceInfo}`);

    socket.on("setUsername", (username) => {
        users[socket.id] = username;
        console.log(`✅ Пользователь вошел: ${username} | Устройство: ${deviceInfo}`);
        io.emit("userConnected", username);
    });

    socket.on("chatMessage", (data) => {
        data.message = leoProfanity.clean(data.message);
        io.emit("chatMessage", data);
    });

    socket.on("typing", () => {
        if (users[socket.id]) {
            socket.broadcast.emit("typing", users[socket.id]);
        }
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log(`❌ Пользователь отключился: ${users[socket.id]} | Устройство: ${deviceInfo}`);
            io.emit("userDisconnected", users[socket.id]);
            delete users[socket.id];
        } else {
            console.log(`❌ Анонимный пользователь отключился | Устройство: ${deviceInfo}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
