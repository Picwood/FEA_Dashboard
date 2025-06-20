import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { authenticateUser, requireAuth } from "./auth";
import { insertJobSchema, insertProjectSchema } from "@shared/schema";
import { initializeDatabase } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initializeDatabase();

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
      const { status, bench, search, sortBy, sortOrder, projectId } = req.query;
      const jobs = await storage.getJobs({
        status: status as string,
        bench: bench as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        projectId: projectId ? parseInt(projectId as string) : undefined,
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
      const updates = req.body;
      const job = await storage.updateJob(id, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
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

  app.post("/api/jobs/:id/files", requireAuth, async (req, res) => {
    try {
      // Simplified file upload endpoint (no actual file handling for demo)
      res.status(201).json([]);
    } catch (error) {
      res.status(500).json({ message: "File upload failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
