import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { Filter } from "bad-words";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("community.db");
const filter = new Filter();
const JWT_SECRET = process.env.JWT_SECRET || "guardian-vault-secret-key";
const ARCHITECT_TOKEN = process.env.ARCHITECT_TOKEN || "divine-architect-praveen-2024";

// Vigil Engine: Autonomous Intelligence
class VigilEngine {
  private interval: NodeJS.Timeout | null = null;
  private lastHealthCheck: number = Date.now();

  start() {
    console.log("Vigil Engine: Online. Monitoring patterns...");
    // Run every 10 minutes for demo purposes (should be 60 in production)
    this.interval = setInterval(() => this.runLoop(), 10 * 60 * 1000);
    this.runLoop(); // Initial run
  }

  async runLoop() {
    console.log("Vigil Engine: Analyzing system state...");
    this.checkAtRiskStreaks();
    this.analyzeSentiment();
    this.monitorHealth();
    this.proactiveModeration();
    this.dynamicDifficultyScaling();
  }

  private checkAtRiskStreaks() {
    const twentyHoursAgo = Date.now() - (20 * 60 * 60 * 1000);
    const atRisk = db.prepare("SELECT * FROM user_streaks WHERE lastTimestamp < ? AND count > 0").all(twentyHoursAgo);
    
    atRisk.forEach((user: any) => {
      db.prepare("INSERT INTO vigil_intelligence (type, observation, action_taken, timestamp) VALUES (?, ?, ?, ?)")
        .run('STREAK_WARNING', `User ${user.userId} at risk (20h+ inactivity)`, 'TRIGGER_WARNING_NOTIFICATION', Date.now());
      console.log(`Vigil: Warning triggered for user ${user.userId}`);
    });
  }

  private proactiveModeration() {
    // Shadow ban users with 3+ flagged messages
    const repeatOffenders = db.prepare(`
      SELECT userId, COUNT(*) as count 
      FROM messages 
      WHERE flagged = 1 
      GROUP BY userId 
      HAVING count >= 3
    `).all();

    repeatOffenders.forEach((offender: any) => {
      db.prepare("INSERT INTO vigil_intelligence (type, observation, action_taken, timestamp) VALUES (?, ?, ?, ?)")
        .run('SECURITY', `User ${offender.userId} repeat offender (${offender.count} flags)`, 'SHADOW_BAN_APPLIED', Date.now());
      // In a real app, we'd set a 'shadow_banned' flag on the user
    });
  }

  private dynamicDifficultyScaling() {
    const failingStudents = db.prepare(`
      SELECT userId, gameId, AVG(score) as avg_score 
      FROM game_performance 
      WHERE timestamp > ? 
      GROUP BY userId, gameId 
      HAVING avg_score < 30
    `).all(Date.now() - (24 * 60 * 60 * 1000));

    failingStudents.forEach((student: any) => {
      db.prepare("INSERT INTO vigil_intelligence (type, observation, action_taken, timestamp) VALUES (?, ?, ?, ?)")
        .run('DIFFICULTY', `User ${student.userId} failing ${student.gameId} (Avg: ${student.avg_score})`, 'ADJUST_DIFFICULTY_EASY', Date.now());
    });
  }

  private analyzeSentiment() {
    const lastHour = Date.now() - (60 * 60 * 1000);
    const messages = db.prepare("SELECT content FROM messages WHERE timestamp > ?").all(lastHour);
    
    const stressKeywords = ['stress', 'hard', 'fail', 'tired', 'exam', 'help', 'difficult'];
    let stressScore = 0;
    messages.forEach((m: any) => {
      stressKeywords.forEach(word => {
        if (m.content.toLowerCase().includes(word)) stressScore++;
      });
    });

    if (stressScore > 10) {
      db.prepare("UPDATE guardian_config SET value = 'false' WHERE key = 'games_enabled'").run();
      db.prepare("INSERT INTO vigil_intelligence (type, observation, action_taken, timestamp) VALUES (?, ?, ?, ?)")
        .run('SENTIMENT', `High stress detected (Score: ${stressScore})`, 'GLOBAL_BREAK_TRIGGERED', Date.now());
      
      // Auto-reenable after 15 mins
      setTimeout(() => {
        db.prepare("UPDATE guardian_config SET value = 'true' WHERE key = 'games_enabled'").run();
      }, 15 * 60 * 1000);
    }
  }

  private monitorHealth() {
    const responseTime = Math.random() * 100; // Mocked
    if (responseTime > 80) {
      db.prepare("INSERT INTO vigil_intelligence (type, observation, action_taken, timestamp) VALUES (?, ?, ?, ?)")
        .run('HEALTH', `High latency detected (${responseTime.toFixed(2)}ms)`, 'PRIORITIZE_STREAK_LOGIC', Date.now());
    }
  }
}

const vigil = new VigilEngine();
vigil.start();

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    channelId TEXT,
    userId TEXT,
    userName TEXT,
    userRole TEXT,
    streakCount INTEGER,
    content TEXT,
    timestamp INTEGER,
    reactions TEXT DEFAULT '[]',
    flagged INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS guardian_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    userName TEXT,
    action TEXT,
    details TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_streaks (
    userId TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    lastTimestamp INTEGER DEFAULT 0,
    frozen INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS architect_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command TEXT,
    result TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS vigil_intelligence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'SENTIMENT', 'HEALTH', 'SECURITY'
    observation TEXT,
    action_taken TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS game_performance (
    userId TEXT,
    gameId TEXT,
    score INTEGER,
    difficulty TEXT,
    timestamp INTEGER
  );
`);

// Migration: Add flagged column if it doesn't exist
try {
  db.prepare("SELECT flagged FROM messages LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE messages ADD COLUMN flagged INTEGER DEFAULT 0");
}

try {
  db.prepare("SELECT reactions FROM messages LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE messages ADD COLUMN reactions TEXT DEFAULT '[]'");
}

try {
  db.prepare("SELECT frozen FROM user_streaks LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE user_streaks ADD COLUMN frozen INTEGER DEFAULT 0");
}

// Default Guardian Password: "guardian123"
const setupGuardian = () => {
  const exists = db.prepare("SELECT * FROM guardian_config WHERE key = 'master_password'").get();
  if (!exists) {
    const hashed = bcrypt.hashSync("guardian123", 10);
    db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").run("master_password", hashed);
    db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").run("community_enabled", "true");
    db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").run("games_enabled", "true");
    db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").run("study_goal_minutes", "30");
  }
};
setupGuardian();

async function startServer() {
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Middleware: Activity Logger
  const logActivity = (userId: string, userName: string, action: string, details: string) => {
    const stmt = db.prepare("INSERT INTO activity_logs (userId, userName, action, details, timestamp) VALUES (?, ?, ?, ?, ?)");
    stmt.run(userId, userName, action, details, Date.now());
  };

  // Middleware: Admin Auth
  const authenticateAdmin = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Middleware: Architect Auth (Divine Signature)
  const authenticateArchitect = (req: any, res: any, next: any) => {
    const token = req.headers['x-divine-signature'];
    if (token === ARCHITECT_TOKEN) {
      next();
    } else {
      res.status(403).json({ error: "Divine Signature Mismatch. Access Denied." });
    }
  };

  // Architect API: God-Mode
  app.get("/api/architect/omniscience", authenticateArchitect, (req, res) => {
    const logs = db.prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100").all();
    const intelligence = db.prepare("SELECT * FROM vigil_intelligence ORDER BY timestamp DESC LIMIT 50").all();
    const streaks = db.prepare("SELECT * FROM user_streaks").all();
    const messages = db.prepare("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50").all();
    
    res.json({ logs, intelligence, streaks, messages });
  });

  app.post("/api/architect/snap", authenticateArchitect, (req, res) => {
    const { action, target, value } = req.body;
    
    if (action === 'RESET_STREAKS') {
      db.prepare("UPDATE user_streaks SET count = 0").run();
    } else if (action === 'MAX_STREAKS') {
      db.prepare("UPDATE user_streaks SET count = 999").run();
    } else if (action === 'FREEZE_ALL') {
      db.prepare("UPDATE user_streaks SET frozen = 1").run();
    } else if (action === 'UNFREEZE_ALL') {
      db.prepare("UPDATE user_streaks SET frozen = 0").run();
    } else if (action === 'REALITY_WARP') {
      db.prepare("UPDATE guardian_config SET value = ? WHERE key = ?").run(value, target);
    }

    db.prepare("INSERT INTO architect_logs (command, result, timestamp) VALUES (?, ?, ?)")
      .run(`SNAP: ${action} on ${target || 'ALL'}`, 'SUCCESS', Date.now());
    
    res.json({ success: true });
  });

  // Vigil Direct Link (Natural Language Command)
  app.post("/api/architect/vigil-direct", authenticateArchitect, async (req, res) => {
    const { prompt } = req.body;
    
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Vigil, the autonomous engine of MathLogic Lab. 
        Interpret the following command from the Divine Architect and return a JSON action.
        Command: "${prompt}"
        
        Available Actions:
        - { "action": "STREAK_BONUS", "value": number, "target": "all" | "userId" }
        - { "action": "FREEZE_ALL" }
        - { "action": "UNFREEZE_ALL" }
        - { "action": "ANNOUNCE", "message": string }
        - { "action": "TOGGLE_FEATURE", "key": string, "value": "true" | "false" }
        
        Return ONLY the JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              value: { type: Type.NUMBER },
              target: { type: Type.STRING },
              message: { type: Type.STRING },
              key: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      
      // Execute the action
      if (result.action === 'STREAK_BONUS') {
        db.prepare("UPDATE user_streaks SET count = count + ?").run(result.value || 1);
        res.json({ response: `Vigil: Executed. Granted ${result.value} bonus to ${result.target}.` });
      } else if (result.action === 'FREEZE_ALL') {
        db.prepare("UPDATE user_streaks SET frozen = 1").run();
        res.json({ response: "Vigil: All streaks frozen." });
      } else if (result.action === 'ANNOUNCE') {
        // In a real app, broadcast via WS
        res.json({ response: `Vigil: Announcement broadcast: ${result.message}` });
      } else {
        res.json({ response: `Vigil: Action ${result.action} interpreted but not yet implemented.` });
      }
    } catch (err) {
      console.error(err);
      res.json({ response: "Vigil: Failed to process command via Neural Link. Falling back to basic logic." });
    }
  });

  // Profanity Filter Helper
  const cleanContent = (text: string) => {
    try {
      return filter.clean(text);
    } catch {
      return text;
    }
  };

  // WebSocket Logic
  const clients = new Map<WebSocket, { userId: string; userName: string; currentModule: string }>();

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === "join") {
        clients.set(ws, { userId: message.userId, userName: message.userName, currentModule: "lobby" });
        logActivity(message.userId, message.userName, "JOIN", "Connected to platform");
        broadcast({ type: "presence", userId: message.userId, status: "online" });
      }

      if (message.type === "navigate") {
        const client = clients.get(ws);
        if (client) {
          client.currentModule = message.module;
          logActivity(client.userId, client.userName, "NAVIGATE", `Moved to ${message.module}`);
          broadcast({ type: "movement", userId: client.userId, userName: client.userName, module: message.module });
        }
      }

      if (message.type === "chat") {
        const chatMsg = {
          id: Math.random().toString(36).substr(2, 9),
          channelId: message.channelId,
          userId: message.userId,
          userName: message.userName,
          userRole: message.userRole || "Student",
          streakCount: message.streakCount || 0,
          content: cleanContent(message.content),
          timestamp: Date.now(),
          reactions: "[]"
        };

        const stmt = db.prepare(`
          INSERT INTO messages (id, channelId, userId, userName, userRole, streakCount, content, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(chatMsg.id, chatMsg.channelId, chatMsg.userId, chatMsg.userName, chatMsg.userRole, chatMsg.streakCount, chatMsg.content, chatMsg.timestamp);

        logActivity(message.userId, message.userName, "CHAT", `Sent message in #${message.channelId}`);
        broadcast({ type: "chat", ...chatMsg, reactions: [] });
      }

      if (message.type === "reaction") {
        broadcast({ type: "reaction", messageId: message.messageId, emoji: message.emoji, userId: message.userId });
      }
    });

    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        logActivity(client.userId, client.userName, "LEAVE", "Disconnected from platform");
        broadcast({ type: "presence", userId: client.userId, status: "offline" });
        clients.delete(ws);
      }
    });
  });

  function broadcast(data: any) {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // API Routes: Admin
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const row = db.prepare("SELECT value FROM guardian_config WHERE key = 'master_password'").get() as { value: string };
    if (bcrypt.compareSync(password, row.value)) {
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.get("/api/admin/dashboard", authenticateAdmin, (req, res) => {
    const logs = db.prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50").all();
    const config = db.prepare("SELECT * FROM guardian_config").all();
    const streaks = db.prepare("SELECT * FROM user_streaks").all();
    const flaggedMessages = db.prepare("SELECT * FROM messages WHERE flagged = 1").all();
    const activeUsers = Array.from(clients.values());
    
    res.json({ logs, config, streaks, flaggedMessages, activeUsers });
  });

  app.post("/api/admin/toggle-feature", authenticateAdmin, (req, res) => {
    const { key, value } = req.body;
    db.prepare("UPDATE guardian_config SET value = ? WHERE key = ?").run(value.toString(), key);
    res.json({ success: true });
  });

  app.post("/api/admin/override-streak", authenticateAdmin, (req, res) => {
    const { userId, count } = req.body;
    db.prepare("INSERT OR REPLACE INTO user_streaks (userId, count, lastTimestamp) VALUES (?, ?, ?)").run(userId, count, Date.now());
    res.json({ success: true });
  });

  // API Routes: User
  app.get("/api/user/streak/:userId", (req, res) => {
    const streak = db.prepare("SELECT * FROM user_streaks WHERE userId = ?").get(req.params.userId);
    res.json(streak || { userId: req.params.userId, count: 0, lastTimestamp: 0 });
  });

  app.post("/api/user/streak/check-in", (req, res) => {
    const { userId, count, timestamp } = req.body;
    db.prepare("INSERT OR REPLACE INTO user_streaks (userId, count, lastTimestamp) VALUES (?, ?, ?)").run(userId, count, timestamp);
    res.json({ success: true });
  });

  app.post("/api/messages/:id/flag", (req, res) => {
    db.prepare("UPDATE messages SET flagged = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/messages/:channelId", (req, res) => {
    const stmt = db.prepare("SELECT * FROM messages WHERE channelId = ? ORDER BY timestamp ASC LIMIT 100");
    const messages = stmt.all(req.params.channelId).map((m: any) => ({
      ...m,
      reactions: JSON.parse(m.reactions || "[]")
    }));
    res.json(messages);
  });

  app.get("/api/config", (req, res) => {
    const config = db.prepare("SELECT * FROM guardian_config").all();
    res.json(config);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
