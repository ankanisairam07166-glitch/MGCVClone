import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import multer from "multer";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hr.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    resume_path TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );
`);

// Seed initial data if empty
const jobCount = db.prepare("SELECT COUNT(*) as count FROM jobs").get() as { count: number };
if (jobCount.count === 0) {
  const insertJob = db.prepare("INSERT INTO jobs (title, department, location, type, description) VALUES (?, ?, ?, ?, ?)");
  insertJob.run("Senior Software Engineer", "Engineering", "Remote", "Full-time", "We are looking for a Senior Software Engineer to join our core team...");
  insertJob.run("Product Manager", "Product", "New York, NY", "Full-time", "Lead the vision for our next generation of HR tools...");
  insertJob.run("UX Designer", "Design", "San Francisco, CA", "Contract", "Help us craft beautiful and intuitive user experiences...");
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

app.use(express.json());

// Configure Multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// API Routes
app.get("/api/jobs", (req, res) => {
  const jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
  res.json(jobs);
});

app.get("/api/jobs/:id", (req, res) => {
  const job = db.prepare("SELECT * FROM job WHERE id = ?").get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.post("/api/jobs", (req, res) => {
  const { title, department, location, type, description } = req.body;
  const result = db.prepare("INSERT INTO jobs (title, department, location, type, description) VALUES (?, ?, ?, ?, ?)")
    .run(title, department, location, type, description || "");
  const newJob = { id: result.lastInsertRowid, title, department, location, type, description, created_at: new Date().toISOString() };
  
  // Broadcast new job
  io.emit("job:created", newJob);
  
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/apply", upload.single("resume"), (req, res) => {
  const { job_id, name, email } = req.body;
  const resume_path = req.file ? req.file.filename : "";
  
  if (!resume_path) {
    return res.status(400).json({ error: "Resume is required" });
  }

  const result = db.prepare("INSERT INTO candidates (job_id, name, email, resume_path) VALUES (?, ?, ?, ?)")
    .run(job_id, name, email, resume_path);
  
  const job = db.prepare("SELECT title FROM jobs WHERE id = ?").get(job_id) as { title: string };
  const newCandidate = { 
    id: result.lastInsertRowid, 
    job_id, 
    name, 
    email, 
    resume_path, 
    status: 'New', 
    job_title: job.title,
    created_at: new Date().toISOString() 
  };

  // Broadcast new application
  io.emit("candidate:applied", newCandidate);
  
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/candidates", (req, res) => {
  const candidates = db.prepare(`
    SELECT c.*, j.title as job_title 
    FROM candidates c 
    JOIN jobs j ON c.job_id = j.id 
    ORDER BY c.created_at DESC
  `).all();
  res.json(candidates);
});

app.get("/api/candidates/:jobId", (req, res) => {
  const candidates = db.prepare("SELECT * FROM candidates WHERE job_id = ? ORDER BY created_at DESC").all(req.params.jobId);
  res.json(candidates);
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
