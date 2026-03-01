import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import { Filter } from 'bad-words';
import bcrypt from 'bcryptjs';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ARCHITECT_TOKEN: string;
  GEMINI_API_KEY: string;
  VITE_GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const filter = new Filter();

app.use('/api/*', cors());

// Middleware: Admin Auth
const authenticateAdmin = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const secret = c.env.JWT_SECRET || 'guardian-vault-secret-key';
    await verify(token, secret, 'HS256');
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Middleware: Architect Auth
const authenticateArchitect = async (c: any, next: any) => {
  const token = c.req.header('x-divine-signature');
  const expectedToken = c.env.ARCHITECT_TOKEN || 'divine-architect-praveen-20';
  if (token === expectedToken) {
    await next();
  } else {
    return c.json({ error: 'Divine Signature Mismatch. Access Denied.' }, 403);
  }
};

// Helper: Log Activity
const logActivity = async (db: D1Database, userId: string, userName: string, action: string, details: string) => {
  await db.prepare("INSERT INTO activity_logs (userId, userName, action, details, timestamp) VALUES (?, ?, ?, ?, ?)")
    .bind(userId, userName, action, details, Date.now())
    .run();
};

// Initialization route (call this once to set up tables)
app.get('/api/init', async (c) => {
  const db = c.env.DB;
  await db.exec(`
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
      type TEXT,
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
    CREATE TABLE IF NOT EXISTS banned_users (
      userId TEXT PRIMARY KEY,
      reason TEXT,
      timestamp INTEGER
    );
  `);

  // Setup default guardian
  const { results } = await db.prepare("SELECT * FROM guardian_config WHERE key = 'master_password'").all();
  if (results.length === 0) {
    const hashed = bcrypt.hashSync("guardian123", 10);
    await db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").bind("master_password", hashed).run();
    await db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").bind("community_enabled", "true").run();
    await db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").bind("games_enabled", "true").run();
    await db.prepare("INSERT INTO guardian_config (key, value) VALUES (?, ?)").bind("study_goal_minutes", "30").run();
  }

  return c.json({ success: true, message: "Database initialized" });
});

// Architect API
app.get("/api/architect/omniscience", authenticateArchitect, async (c) => {
  const db = c.env.DB;
  const logs = await db.prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100").all();
  const intelligence = await db.prepare("SELECT * FROM vigil_intelligence ORDER BY timestamp DESC LIMIT 50").all();
  const streaks = await db.prepare("SELECT * FROM user_streaks").all();
  const messages = await db.prepare("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50").all();
  
  return c.json({ 
    logs: logs.results, 
    intelligence: intelligence.results, 
    streaks: streaks.results, 
    messages: messages.results 
  });
});

app.post("/api/architect/snap", authenticateArchitect, async (c) => {
  const db = c.env.DB;
  const { action, target, value } = await c.req.json();
  
  if (action === 'RESET_STREAKS') {
    await db.prepare("UPDATE user_streaks SET count = 0").run();
  } else if (action === 'MAX_STREAKS') {
    await db.prepare("UPDATE user_streaks SET count = 999").run();
  } else if (action === 'FREEZE_ALL') {
    await db.prepare("UPDATE user_streaks SET frozen = 1").run();
  } else if (action === 'UNFREEZE_ALL') {
    await db.prepare("UPDATE user_streaks SET frozen = 0").run();
  } else if (action === 'REALITY_WARP') {
    await db.prepare("UPDATE guardian_config SET value = ? WHERE key = ?").bind(value, target).run();
  }

  await db.prepare("INSERT INTO architect_logs (command, result, timestamp) VALUES (?, ?, ?)")
    .bind(`SNAP: ${action} on ${target || 'ALL'}`, 'SUCCESS', Date.now())
    .run();
  
  return c.json({ success: true });
});

app.post("/api/architect/vigil-direct", authenticateArchitect, async (c) => {
  const { prompt } = await c.req.json();
  const db = c.env.DB;
  
  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: c.env.VITE_GEMINI_API_KEY || c.env.GEMINI_API_KEY });
    
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

    const result = JSON.parse(response.text || "{}");
    
    if (result.action === 'STREAK_BONUS') {
      await db.prepare("UPDATE user_streaks SET count = count + ?").bind(result.value || 1).run();
      return c.json({ response: `Vigil: Executed. Granted ${result.value} bonus to ${result.target}.` });
    } else if (result.action === 'FREEZE_ALL') {
      await db.prepare("UPDATE user_streaks SET frozen = 1").run();
      return c.json({ response: "Vigil: All streaks frozen." });
    } else if (result.action === 'ANNOUNCE') {
      return c.json({ response: `Vigil: Announcement broadcast: ${result.message}` });
    } else {
      return c.json({ response: `Vigil: Action ${result.action} interpreted but not yet implemented.` });
    }
  } catch (err) {
    console.error(err);
    return c.json({ response: "Vigil: Failed to process command via Neural Link. Falling back to basic logic." });
  }
});

// Admin API
app.post("/api/admin/login", async (c) => {
  const db = c.env.DB;
  const { password } = await c.req.json();
  const row = await db.prepare("SELECT value FROM guardian_config WHERE key = 'master_password'").first<{ value: string }>();
  
  if (row && bcrypt.compareSync(password, row.value)) {
    const secret = c.env.JWT_SECRET || 'guardian-vault-secret-key';
    const token = await sign({ role: "admin", exp: Math.floor(Date.now() / 1000) + 60 * 60 }, secret);
    return c.json({ token });
  } else {
    return c.json({ error: "Invalid password" }, 401);
  }
});

app.get("/api/admin/dashboard", authenticateAdmin, async (c) => {
  const db = c.env.DB;
  const logs = await db.prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50").all();
  const config = await db.prepare("SELECT * FROM guardian_config").all();
  const streaks = await db.prepare("SELECT * FROM user_streaks").all();
  const flaggedMessages = await db.prepare("SELECT * FROM messages WHERE flagged = 1").all();
  
  return c.json({ 
    logs: logs.results, 
    config: config.results, 
    streaks: streaks.results, 
    flaggedMessages: flaggedMessages.results,
    activeUsers: [] // WebSocket active users not easily available globally in stateless workers
  });
});

app.post("/api/admin/toggle-feature", authenticateAdmin, async (c) => {
  const db = c.env.DB;
  const { key, value } = await c.req.json();
  await db.prepare("UPDATE guardian_config SET value = ? WHERE key = ?").bind(value.toString(), key).run();
  return c.json({ success: true });
});

app.post("/api/admin/override-streak", authenticateAdmin, async (c) => {
  const db = c.env.DB;
  const { userId, count } = await c.req.json();
  await db.prepare("INSERT OR REPLACE INTO user_streaks (userId, count, lastTimestamp) VALUES (?, ?, ?)").bind(userId, count, Date.now()).run();
  return c.json({ success: true });
});

// User API
app.get("/api/user/streak/:userId", async (c) => {
  const db = c.env.DB;
  const userId = c.req.param('userId');
  const streak = await db.prepare("SELECT * FROM user_streaks WHERE userId = ?").bind(userId).first();
  return c.json(streak || { userId, count: 0, lastTimestamp: 0 });
});

app.post("/api/user/streak/check-in", async (c) => {
  const db = c.env.DB;
  const { userId, count, timestamp } = await c.req.json();
  await db.prepare("INSERT OR REPLACE INTO user_streaks (userId, count, lastTimestamp) VALUES (?, ?, ?)").bind(userId, count, timestamp).run();
  return c.json({ success: true });
});

app.post("/api/messages/:id/flag", async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  await db.prepare("UPDATE messages SET flagged = 1 WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

app.get("/api/messages/:channelId", async (c) => {
  const db = c.env.DB;
  const channelId = c.req.param('channelId');
  const messages = await db.prepare("SELECT * FROM messages WHERE channelId = ? ORDER BY timestamp ASC LIMIT 100").bind(channelId).all();
  
  const formatted = messages.results.map((m: any) => ({
    ...m,
    reactions: JSON.parse(m.reactions || "[]")
  }));
  return c.json(formatted);
});

app.get("/api/config", async (c) => {
  const db = c.env.DB;
  const config = await db.prepare("SELECT * FROM guardian_config").all();
  return c.json(config.results);
});

app.get('/', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader && upgradeHeader === 'websocket') {
    const webSocketPair = new WebSocketPair();
    const client = webSocketPair[0];
    const server = webSocketPair[1];

    server.accept();

    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        const db = c.env.DB;
        
        if (message.type === 'join') {
          await logActivity(db, message.userId, message.userName, "JOIN", "Connected to platform");
          server.send(JSON.stringify({ type: "presence", userId: message.userId, status: "online" }));
        }

        if (message.type === 'chat') {
          const isBanned = await db.prepare("SELECT * FROM banned_users WHERE userId = ?").bind(message.userId).first();
          if (isBanned) {
            server.send(JSON.stringify({ type: "banned", reason: (isBanned as any).reason }));
            return;
          }

          let content = message.content;
          try {
            content = filter.clean(content);
          } catch {}

          const chatMsg = {
            id: Math.random().toString(36).substr(2, 9),
            channelId: message.channelId,
            userId: message.userId,
            userName: message.userName,
            userRole: message.userRole || "Student",
            streakCount: message.streakCount || 0,
            content: content,
            timestamp: Date.now(),
            reactions: "[]"
          };

          await db.prepare(`
            INSERT INTO messages (id, channelId, userId, userName, userRole, streakCount, content, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(chatMsg.id, chatMsg.channelId, chatMsg.userId, chatMsg.userName, chatMsg.userRole, chatMsg.streakCount, chatMsg.content, chatMsg.timestamp).run();

          await logActivity(db, message.userId, message.userName, "CHAT", `Sent message in #${message.channelId}`);
          
          server.send(JSON.stringify({ type: "chat", ...chatMsg, reactions: [] }));
        }
      } catch (e) {
        console.error(e);
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  // If not websocket, return 404 or serve static assets if using Pages
  return c.notFound();
});

import { handle } from 'hono/cloudflare-pages';

export const onRequest = handle(app);
