import { type User, type Job, type File, type InsertUser, type InsertJob, type InsertFile } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Job methods
  getJobs(filters?: { status?: string; bench?: string; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // File methods
  getJobFiles(jobId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

// In-memory storage for demo purposes
let users: User[] = [
  { id: 1, username: "admin", passwordHash: "admin" },
  { id: 2, username: "engineer", passwordHash: "engineer123" }
];

let jobs: Job[] = [
  {
    id: 1,
    project: "XC-Elite-2024",
    bench: "symmetric-bending",
    type: "static",
    dateRequest: "2024-01-20",
    dateDue: "2024-01-25",
    priority: 5,
    status: "running",
    components: ["crown", "stanchion_left", "stanchion_right"],
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z"
  },
  {
    id: 2,
    project: "Trail-Master-V3",
    bench: "brake-load",
    type: "fatigue",
    dateRequest: "2024-01-22",
    dateDue: "2024-01-28",
    priority: 3,
    status: "queued",
    components: ["lower_monolith"],
    createdAt: "2024-01-22T10:00:00Z",
    updatedAt: "2024-01-22T10:00:00Z"
  },
  {
    id: 3,
    project: "Enduro-Pro-2024",
    bench: "unknown",
    type: "static",
    dateRequest: "2024-01-18",
    dateDue: "2024-02-02",
    priority: 1,
    status: "done",
    components: ["crown", "steerer"],
    createdAt: "2024-01-18T10:00:00Z",
    updatedAt: "2024-01-18T10:00:00Z"
  }
];

let files: File[] = [];
let nextUserId = 3;
let nextJobId = 4;
let nextFileId = 1;

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: nextUserId++,
      ...user
    };
    users.push(newUser);
    return newUser;
  }

  async getJobs(filters?: { 
    status?: string; 
    bench?: string; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: "asc" | "desc" 
  }): Promise<Job[]> {
    let result = [...jobs];
    
    if (filters) {
      if (filters.status) {
        result = result.filter(job => job.status === filters.status);
      }
      
      if (filters.bench) {
        result = result.filter(job => job.bench === filters.bench);
      }
      
      if (filters.search) {
        result = result.filter(job => 
          job.project.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      
      if (filters.sortBy) {
        result.sort((a, b) => {
          const aVal = a[filters.sortBy as keyof Job];
          const bVal = b[filters.sortBy as keyof Job];
          const order = filters.sortOrder === "desc" ? -1 : 1;
          
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1 * order;
          if (bVal == null) return -1 * order;
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
          return 0;
        });
      }
    }
    
    return result;
  }

  async getJob(id: number): Promise<Job | undefined> {
    return jobs.find(j => j.id === id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob: Job = {
      id: nextJobId++,
      project: job.project,
      bench: job.bench,
      type: job.type,
      dateRequest: job.dateRequest,
      dateDue: job.dateDue || null,
      priority: job.priority,
      status: job.status,
      components: job.components as string[] || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    jobs.push(newJob);
    return newJob;
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const jobIndex = jobs.findIndex(j => j.id === id);
    if (jobIndex === -1) return undefined;
    
    const updatedJob = {
      ...jobs[jobIndex],
      ...updates,
      components: (updates.components as string[]) || jobs[jobIndex].components,
      updatedAt: new Date().toISOString()
    };
    jobs[jobIndex] = updatedJob;
    return jobs[jobIndex];
  }

  async deleteJob(id: number): Promise<boolean> {
    const jobIndex = jobs.findIndex(j => j.id === id);
    if (jobIndex === -1) return false;
    
    jobs.splice(jobIndex, 1);
    files = files.filter(f => f.jobId !== id);
    return true;
  }

  async getJobFiles(jobId: number): Promise<File[]> {
    return files.filter(f => f.jobId === jobId);
  }

  async createFile(file: InsertFile): Promise<File> {
    const newFile: File = {
      id: nextFileId++,
      ...file,
      uploadedAt: new Date().toISOString()
    };
    files.push(newFile);
    return newFile;
  }

  async getFile(id: number): Promise<File | undefined> {
    return files.find(f => f.id === id);
  }

  async deleteFile(id: number): Promise<boolean> {
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex === -1) return false;
    
    files.splice(fileIndex, 1);
    return true;
  }
}

export const storage = new DatabaseStorage();
