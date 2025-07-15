import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { users, projects, jobs, files } from "@shared/schema";
import * as bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.resolve("./data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure files directory exists
const filesDir = path.resolve("./data/files");
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

const databasePath = path.join(dataDir, "database.sqlite");
const sqlite = new Database(databasePath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Initialize database with tables and seed data
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        archived INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        simulation_name TEXT NOT NULL,
        bench TEXT NOT NULL,
        type TEXT NOT NULL,
        date_request TEXT NOT NULL,
        date_due TEXT,
        priority INTEGER NOT NULL,
        status TEXT NOT NULL,
        components TEXT DEFAULT '[]',
        confidence INTEGER,
        conclusion TEXT,
        report_path TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_project ON jobs(project_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
      CREATE INDEX IF NOT EXISTS idx_files_job_id ON files(job_id);
    `);

    // Check if we need to seed data
    const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    
    if (userCount.count === 0) {
      // Hash passwords for security
      const adminHash = await bcrypt.hash("admin", 10);
      const engineerHash = await bcrypt.hash("engineer123", 10);

      // Insert seed users
      sqlite.prepare(`
        INSERT INTO users (username, password_hash) VALUES (?, ?)
      `).run("admin", adminHash);
      
      sqlite.prepare(`
        INSERT INTO users (username, password_hash) VALUES (?, ?)
      `).run("engineer", engineerHash);

      // Insert seed projects
      sqlite.prepare(`
        INSERT INTO projects (name, archived, created_at) VALUES (?, ?, ?)
      `).run("AION36", 0, "2024-01-15T10:00:00Z");
      
      sqlite.prepare(`
        INSERT INTO projects (name, archived, created_at) VALUES (?, ?, ?)
      `).run("NRX32-IL", 0, "2024-01-10T09:00:00Z");
      
      sqlite.prepare(`
        INSERT INTO projects (name, archived, created_at) VALUES (?, ?, ?)
      `).run("Legacy-OldProject", 1, "2023-12-01T10:00:00Z");

      // Insert seed jobs
      sqlite.prepare(`
        INSERT INTO jobs (project_id, simulation_name, bench, type, date_request, date_due, priority, status, components, confidence, conclusion, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        1, "Static Analysis - Main Fork", "symmetric-bending", "static", "2024-01-15", "2024-02-15", 
        4, "running", JSON.stringify(["lower_monolith", "crown"]), null, null, 
        "2024-01-15T10:00:00Z", "2024-01-16T14:30:00Z"
      );

      sqlite.prepare(`
        INSERT INTO jobs (project_id, simulation_name, bench, type, date_request, date_due, priority, status, components, confidence, conclusion, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        2, "Fatigue Analysis - Brake Load", "brake-load", "fatigue", "2024-01-10", "2024-01-30",
        3, "queued", JSON.stringify(["stanchion_left", "stanchion_right", "steerer"]), null, null,
        "2024-01-10T09:00:00Z", "2024-01-10T09:00:00Z"
      );

      sqlite.prepare(`
        INSERT INTO jobs (project_id, simulation_name, bench, type, date_request, date_due, priority, status, components, confidence, conclusion, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        3, "Old Legacy Test", "unknown", "static", "2023-12-01", null,
        2, "done", JSON.stringify(["lower_monolith"]), 85, "Valid Design",
        "2023-12-01T10:00:00Z", "2023-12-01T15:00:00Z"
      );

      console.log("Database initialized with seed data");
    }

    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
} 