import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database setup
  const db = new Database("marketflow.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      role TEXT DEFAULT 'client'
    );
    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      userId TEXT,
      url TEXT,
      name TEXT,
      ownerName TEXT,
      email TEXT,
      location TEXT,
      sector TEXT,
      linkedin TEXT,
      instagram TEXT,
      analysis TEXT, -- JSON
      visualHook TEXT,
      moment TEXT,
      qualityScore REAL,
      trackReport TEXT, -- JSON
      newsletter TEXT,
      sentiment TEXT, -- JSON
      logoConcepts TEXT,
      videoPitch TEXT,
      images TEXT, -- JSON array of URLs
      socialPosts TEXT,
      seoStrategy TEXT, -- JSON
      translation TEXT,
      competitors TEXT, -- JSON array of { name, url, notes }
      status TEXT DEFAULT 'pending', -- pending, analyzed, validated, sent
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT,
      status TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS potential_leads (
      id TEXT PRIMARY KEY,
      prospectId TEXT,
      name TEXT,
      url TEXT,
      sector TEXT,
      location TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(prospectId) REFERENCES prospects(id)
    );
  `);

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/scrape-images", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Simple regex to find image src
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const images: string[] = [];
      let match;
      
      while ((match = imgRegex.exec(html)) !== null) {
        let src = match[1];
        if (src.startsWith("//")) src = "https:" + src;
        else if (src.startsWith("/")) {
          const urlObj = new URL(url);
          src = `${urlObj.protocol}//${urlObj.host}${src}`;
        } else if (!src.startsWith("http")) {
           const urlObj = new URL(url);
           src = `${urlObj.protocol}//${urlObj.host}/${src}`;
        }
        
        // Filter out tiny icons or data types if needed, but let's keep it simple
        if (!src.includes("data:") && !src.includes(".svg")) {
            images.push(src);
        }
      }

      res.json({ images: images.slice(0, 10) }); // Limit to 10 images
    } catch (e) {
      console.error("Scraping error:", e);
      res.json({ images: [] });
    }
  });

  app.post("/api/generate-heygen-video", async (req, res) => {
    const { script, test_mode } = req.body;
    const apiKey = process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "HEYGEN_API_KEY no está configurada en el servidor." });
    }

    try {
      const response = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: "avatar",
                avatar_id: "Daisy-waist-20220518", // Default professional avatar
                avatar_style: "normal"
              },
              voice: {
                type: "text",
                input_text: script,
                voice_id: "es-ES-ElviraNeural" // Spanish professional voice
              }
            }
          ],
          test_mode: test_mode || false,
          dimension: {
            width: 1280,
            height: 720
          }
        }),
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("HeyGen API Error:", error);
      res.status(500).json({ error: "Error al llamar a la API de HeyGen" });
    }
  });

  app.post("/api/potential-leads", (req, res) => {
    const { id, prospectId, name, url, sector, location, notes } = req.body;
    db.run(
      "INSERT INTO potential_leads (id, prospectId, name, url, sector, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, prospectId, name, url, sector, location, notes],
      (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ id });
      }
    );
  });

  app.get("/api/potential-leads/:prospectId", (req, res) => {
    db.all("SELECT * FROM potential_leads WHERE prospectId = ?", [req.params.prospectId], (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    });
  });

  // User endpoints
  app.post("/api/users", (req, res) => {
    const { id, email, name, role } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)");
      stmt.run(id, email, name, role);
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Prospect endpoints
  app.get("/api/prospects", (req, res) => {
    const prospects = db.prepare("SELECT * FROM prospects ORDER BY createdAt DESC").all();
    res.json(prospects);
  });

  app.post("/api/prospects", (req, res) => {
    const { id, userId, url, name, ownerName, email, location, sector, linkedin, instagram, moment } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO prospects (id, userId, url, name, ownerName, email, location, sector, linkedin, instagram, moment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, userId, url, name, ownerName, email, location, sector, linkedin, instagram, moment);
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

    app.patch("/api/prospects/:id", (req, res) => {
    const { id } = req.params;
    const { status, analysis, visualHook, moment, qualityScore, trackReport, images } = req.body;
    try {
      let query = "UPDATE prospects SET ";
      const params = [];
      if (status) { query += "status = ?, "; params.push(status); }
      if (analysis) { query += "analysis = ?, "; params.push(analysis); }
      if (visualHook) { query += "visualHook = ?, "; params.push(visualHook); }
      if (moment) { query += "moment = ?, "; params.push(moment); }
      if (qualityScore) { query += "qualityScore = ?, "; params.push(qualityScore); }
      if (trackReport) { query += "trackReport = ?, "; params.push(trackReport); }
      if (req.body.newsletter) { query += "newsletter = ?, "; params.push(req.body.newsletter); }
      if (req.body.sentiment) { query += "sentiment = ?, "; params.push(JSON.stringify(req.body.sentiment)); }
      if (req.body.logoConcepts) { query += "logoConcepts = ?, "; params.push(req.body.logoConcepts); }
      if (req.body.videoPitch) { query += "videoPitch = ?, "; params.push(req.body.videoPitch); }
      if (images) { query += "images = ?, "; params.push(JSON.stringify(images)); }
      if (req.body.socialPosts) { query += "socialPosts = ?, "; params.push(req.body.socialPosts); }
      if (req.body.seoStrategy) { query += "seoStrategy = ?, "; params.push(JSON.stringify(req.body.seoStrategy)); }
      if (req.body.translation) { query += "translation = ?, "; params.push(req.body.translation); }
      if (req.body.competitors) { query += "competitors = ?, "; params.push(JSON.stringify(req.body.competitors)); }
      query = query.slice(0, -2) + " WHERE id = ?";
      params.push(id);
      
      const stmt = db.prepare(query);
      stmt.run(...params);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
