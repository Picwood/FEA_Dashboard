import path from "path";
import fs from "fs";

// Initialize database with schema and seed data
export async function initializeDatabase() {
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
}
