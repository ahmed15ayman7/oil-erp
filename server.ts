import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // إنشاء WebSocket Server
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        console.log("✅ WebSocket Connected");

        ws.on("message", (message) => {
            console.log("📩 Received:", message.toString());
            ws.send(JSON.stringify({ message: "📨 تم استقبال رسالتك!" }));
        });

        ws.on("close", () => console.log("❌ WebSocket Closed"));
    });

    server.listen(3000, () => {
        console.log("🚀 Server ready on http://localhost:3000");
    });
});
