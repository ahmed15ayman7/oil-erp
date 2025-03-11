// import { NextRequest } from "next/server";
import { NextRequest } from "next/server";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  console.log("✅ WebSocket Connected");

  ws.on("message", (message) => {
    console.log("📩 Received:", message.toString());
    ws.send(JSON.stringify({ message: "📨 تم استقبال رسالتك!" }));
  });

  ws.on("close", () => console.log("❌ WebSocket Closed"));
});

export async function GET(req: NextRequest) {
  return new Response("WebSocket endpoint", { status: 200 });
}

// import { WebSocketServer } from "ws";

// const wss = new WebSocketServer({ noServer: true });

// wss.on("connection", (ws) => {
//   console.log("✅ New WebSocket Connection");

//   ws.send(JSON.stringify({ message: "مرحبًا بك في WebSocket!" }));

//   ws.on("message", (message) => {
//     console.log("📩 Received:", message.toString());
//     ws.send(JSON.stringify({ message: "تم استلام الرسالة بنجاح!" }));
//   });

//   setInterval(() => {
//     ws.send(
//       JSON.stringify({ type: "stats", data: { users: Math.floor(Math.random() * 100) } })
//     );
//   }, 5000);

//   ws.on("close", () => console.log("⚠️ WebSocket Closed"));
// });

// export async function GET(req: NextRequest) {
//   if (!req) return new Response("Invalid request", { status: 400 });

//   const upgradeHeader = req.headers.get("upgrade");
//   if (upgradeHeader !== "websocket") {
//     return new Response("Expected WebSocket", { status: 426 });
//   }

//   const { socket } = (req as any).raw;
//   wss.handleUpgrade(req as any, socket, Buffer.alloc(0), (ws) => {
//     wss.emit("connection", ws, req);
//   });

//   return new Response(null, { status: 101 });
// }
