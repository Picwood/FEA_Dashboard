import { type User, type Job, type File, type Project, type InsertUser, type InsertJob, type InsertFile, type InsertProject } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project methods
  getProjects(archived?: boolean): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectByName(name: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  archiveProject(id: number): Promise<boolean>;

  // Job methods
  getJobs(filters?: { status?: string; bench?: string; search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; projectId?: number }): Promise<(Job & { projectName: string })[]>;
  getJob(id: number): Promise<(Job & { projectName: string }) | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // File methods
  getJobFiles(jobId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

// In-memory storage
const users: User[] = [
  { id: 1, username: "admin", passwordHash: "admin" },
  { id: 2, username: "engineer", passwordHash: "engineer123" },
];

const projects: Project[] = [
  { id: 1, name: "AION36", archived: false, createdAt: "2024-01-15T10:00:00Z" },
  { id: 2, name: "NRX32-IL", archived: false, createdAt: "2024-01-10T09:00:00Z" },
  { id: 3, name: "Legacy-OldProject", archived: true, createdAt: "2023-12-01T10:00:00Z" },
];

const jobs: Job[] = [
  {
    id: 1,
    projectId: 1,
    simulationName: "Static Analysis - Main Fork",
    bench: "symmetric-bending",
    type: "static",
    dateRequest: "2024-01-15",
    dateDue: "2024-02-15",
    priority: 4,
    status: "running",
    components: ["lower_monolith", "crown"],
    confidence: null,
    conclusion: null,
    reportPath: null,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-16T14:30:00Z"
  },
  {
    id: 2,
    projectId: 2,
    simulationName: "Fatigue Analysis - Brake Load",
    bench: "brake-load",
    type: "fatigue",
    dateRequest: "2024-01-10",
    dateDue: "2024-01-30",
    priority: 3,
    status: "queued",
    components: ["stanchion_left", "stanchion_right", "steerer"],
    confidence: null,
    conclusion: null,
    reportPath: null,
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-10T09:00:00Z"
  },
  {
    id: 3,
    projectId: 3,
    simulationName: "Old Legacy Test",
    bench: "unknown",
    type: "static",
    dateRequest: "2023-12-01",
    dateDue: null,
    priority: 2,
    status: "done",
    components: ["lower_monolith"],
    confidence: 85,
    conclusion: "Valid Design",
    reportPath: null,
    createdAt: "2023-12-01T10:00:00Z",
    updatedAt: "2023-12-01T15:00:00Z"
  }
];

const files: File[] = [];

let nextUserId = 3;
let nextProjectId = 4;
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
      username: user.username,
      passwordHash: user.passwordHash,
    };
    users.push(newUser);
    return newUser;
  }

  // Project methods
  async getProjects(archived?: boolean): Promise<Project[]> {
    if (archived !== undefined) {
      return projects.filter(p => p.archived === archived);
    }
    return projects;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return projects.find(p => p.id === id);
  }

  async getProjectByName(name: string): Promise<Project | undefined> {
    return projects.find(p => p.name === name);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: nextProjectId++,
      name: project.name,
      archived: project.archived || false,
      createdAt: new Date().toISOString(),
    };
    projects.push(newProject);
    return newProject;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) return undefined;
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
    };
    return projects[projectIndex];
  }

  async archiveProject(id: number): Promise<boolean> {
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) return false;
    
    projects[projectIndex].archived = true;
    return true;
  }

  async getJobs(filters?: { 
    status?: string; 
    bench?: string; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: "asc" | "desc";
    projectId?: number;
    includeArchived?: boolean;
  }): Promise<(Job & { projectName: string })[]> {
    let result: (Job & { projectName: string })[] = [];
    
    for (const job of jobs) {
      const project = projects.find(p => p.id === job.projectId);
      
      // Skip jobs from archived projects unless explicitly requested
      if (!filters?.includeArchived && project?.archived) {
        continue;
      }
      
      result.push({
        ...job,
        projectName: project?.name || "Unknown Project"
      });
    }
    
    if (filters) {
      if (filters.projectId) {
        result = result.filter(job => job.projectId === filters.projectId);
      }
      
      if (filters.status) {
        result = result.filter(job => job.status === filters.status);
      }
      
      if (filters.bench) {
        result = result.filter(job => job.bench === filters.bench);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(job => 
          job.projectName.toLowerCase().includes(searchLower) ||
          job.simulationName.toLowerCase().includes(searchLower) ||
          job.type.toLowerCase().includes(searchLower) ||
          job.bench.toLowerCase().includes(searchLower) ||
          job.status.toLowerCase().includes(searchLower)
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

  async getJob(id: number): Promise<(Job & { projectName: string }) | undefined> {
    const job = jobs.find(j => j.id === id);
    if (!job) return undefined;
    
    const project = projects.find(p => p.id === job.projectId);
    return {
      ...job,
      projectName: project?.name || "Unknown Project"
    };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob: Job = {
      id: nextJobId++,
      projectId: job.projectId,
      simulationName: job.simulationName,
      bench: job.bench,
      type: job.type,
      dateRequest: job.dateRequest,
      dateDue: job.dateDue || null,
      priority: job.priority,
      status: job.status,
      components: (job.components as string[]) || [],
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
    return true;
  }

  async getJobFiles(jobId: number): Promise<File[]> {
    return files.filter(f => f.jobId === jobId);
  }

  async createFile(file: InsertFile): Promise<File> {
    const newFile: File = {
      id: nextFileId++,
      jobId: file.jobId,
      label: file.label,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
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