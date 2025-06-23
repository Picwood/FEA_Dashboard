import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import path from "path";
import fs from "fs";
import multer from "multer";
import { storage } from "./storage";
import { authenticateUser, requireAuth } from "./auth";
import { insertJobSchema, insertProjectSchema } from "@shared/schema";
import { initializeDatabase } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initializeDatabase();

  // Configure multer for file uploads
  const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const jobId = req.params.id;
      const uploadPath = path.join("./data/files", jobId);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const jobId = req.params.id;
      const label = req.body.label || "file";
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `${label}_${timestamp}${ext}`);
    }
  });

  const upload = multer({ 
    storage: uploadStorage,
    fileFilter: (req, file, cb) => {
      // For reports, only allow HTML files
      if (req.body.label === "report" && file.mimetype !== "text/html") {
        cb(new Error("Only HTML files are allowed for reports"));
        return;
      }
      cb(null, true);
    }
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "fea-dashboard-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).user = user;
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if ((req.session as any)?.user) {
      res.json({ user: (req.session as any).user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const { archived } = req.query;
      const projects = await storage.getProjects(
        archived === "true" ? true : archived === "false" ? false : undefined
      );
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id/archive", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.archiveProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project archived successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to archive project" });
    }
  });

  // Job routes
  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const { status, bench, search, sortBy, sortOrder, projectId, includeArchived } = req.query;
      const jobs = await storage.getJobs({
        status: status as string,
        bench: bench as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        projectId: projectId ? parseInt(projectId as string) : undefined,
        includeArchived: includeArchived === "true",
      });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.get("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.put("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(id, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJob(id);
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Clean up job files
      const jobDir = path.join("./data/files", id.toString());
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true });
      }
      
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // File routes (simplified for demo)
  app.get("/api/jobs/:id/files", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const files = await storage.getJobFiles(jobId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/jobs/:id/files", requireAuth, upload.single('file'), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { label } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      if (label === "report") {
        // Update the job with the actual file path
        const relativePath = path.relative("./data/files", file.path);
        await storage.updateJob(jobId, { reportPath: relativePath });
        
        res.status(201).json({ 
          id: Date.now(),
          jobId,
          label,
          filename: file.originalname,
          path: relativePath,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      } else {
        // Create file record in storage for other file types
        const fileRecord = await storage.createFile({
          jobId,
          label,
          filename: file.originalname,
          path: path.relative("./data/files", file.path),
          mimetype: file.mimetype,
          size: file.size,
        });
        
        res.status(201).json(fileRecord);
      }
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "File upload failed" });
    }
  });

  // Route to serve uploaded files
  app.get("/api/files/:path(*)", requireAuth, async (req, res) => {
    try {
      const filePath = req.params.path;
      const fullPath = path.join("./data/files", filePath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Get file stats for proper headers
      const stats = fs.statSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      
      // Set appropriate content type based on file extension
      let contentType = "application/octet-stream";
      if (ext === ".html" || ext === ".htm") {
        contentType = "text/html";
      } else if (ext === ".pdf") {
        contentType = "application/pdf";
      } else if (ext === ".txt") {
        contentType = "text/plain";
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      
      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("File serving error:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Route to update simulation analysis results
  app.put("/api/jobs/:id/analysis", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { confidence, conclusion } = req.body;
      
      const updates: any = {};
      if (confidence !== undefined) updates.confidence = confidence;
      if (conclusion !== undefined) updates.conclusion = conclusion;
      
      const job = await storage.updateJob(id, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update analysis results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
