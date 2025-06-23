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

  app.post("/api/jobs/:id/files", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { label } = req.body;
      
      // For now, just simulate saving a report file
      if (label === "report") {
        // Update the job with a dummy report path
        const reportPath = `reports/job_${jobId}_report.html`;
        await storage.updateJob(jobId, { reportPath });
        
        res.status(201).json({ 
          id: Date.now(),
          jobId,
          label,
          filename: "report.html",
          path: reportPath,
          mimetype: "text/html",
          size: 1024,
          uploadedAt: new Date().toISOString()
        });
      } else {
        res.status(201).json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "File upload failed" });
    }
  });

  // Route to serve report files
  app.get("/api/files/:path(*)", requireAuth, async (req, res) => {
    try {
      const filePath = req.params.path;
      // For demo purposes, return a simple HTML report
      if (filePath.includes("report.html")) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>FEA Simulation Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              .section { margin: 20px 0; }
              .result { background: #f0f9ff; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>FEA Simulation Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h2>Analysis Summary</h2>
              <div class="result">
                <p><strong>Status:</strong> Completed Successfully</p>
                <p><strong>Convergence:</strong> Achieved</p>
                <p><strong>Maximum Stress:</strong> 185.2 MPa</p>
                <p><strong>Maximum Displacement:</strong> 2.34 mm</p>
              </div>
            </div>
            
            <div class="section">
              <h2>Conclusion</h2>
              <p>The analysis shows that the design meets all safety requirements with acceptable stress levels and deformation.</p>
            </div>
          </body>
          </html>
        `;
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
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
