import { type User, type Job, type File, type Project, type InsertUser, type InsertJob, type InsertFile, type InsertProject } from "@shared/schema";
import { db } from "./database";
import { users, projects, jobs, files } from "@shared/schema";
import { eq, and, like, desc, asc } from "drizzle-orm";

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
  getJobs(filters?: { status?: string; bench?: string; search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; projectId?: number; includeArchived?: boolean }): Promise<(Job & { projectName: string })[]>;
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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Project methods
  async getProjects(archived?: boolean): Promise<Project[]> {
    if (archived !== undefined) {
      return await db.select().from(projects).where(eq(projects.archived, archived));
    }
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectByName(name: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.name, name)).limit(1);
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values({
      ...project,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async archiveProject(id: number): Promise<boolean> {
    const result = await db.update(projects)
      .set({ archived: true })
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0;
  }

  // Job methods
  async getJobs(filters?: { 
    status?: string; 
    bench?: string; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: "asc" | "desc";
    projectId?: number;
    includeArchived?: boolean;
  }): Promise<(Job & { projectName: string })[]> {
    const allJobs = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
        simulationName: jobs.simulationName,
        bench: jobs.bench,
        type: jobs.type,
        dateRequest: jobs.dateRequest,
        dateDue: jobs.dateDue,
        priority: jobs.priority,
        status: jobs.status,
        components: jobs.components,
        confidence: jobs.confidence,
        conclusion: jobs.conclusion,
        reportPath: jobs.reportPath,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        projectName: projects.name,
        projectArchived: projects.archived,
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id));

    // Apply filters in JavaScript for now to avoid TypeScript issues
    let filteredJobs = allJobs.filter(row => {
      // Skip archived projects unless explicitly requested
      if (!filters?.includeArchived && row.projectArchived) {
        return false;
      }
      
      if (filters?.projectId && row.projectId !== filters.projectId) {
        return false;
      }
      
      if (filters?.status && row.status !== filters.status) {
        return false;
      }
      
      if (filters?.bench && row.bench !== filters.bench) {
        return false;
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        const projectName = row.projectName || "";
        if (!projectName.toLowerCase().includes(searchLower) &&
            !row.simulationName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });

    // Apply sorting
    if (filters?.sortBy && filters?.sortOrder) {
      filteredJobs.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof typeof a];
        const bVal = b[filters.sortBy as keyof typeof b];
        const order = filters.sortOrder === "desc" ? -1 : 1;
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1 * order;
        if (bVal == null) return -1 * order;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }
    
    return filteredJobs.map(row => ({
      id: row.id,
      projectId: row.projectId,
      simulationName: row.simulationName,
      bench: row.bench,
      type: row.type,
      dateRequest: row.dateRequest,
      dateDue: row.dateDue,
      priority: row.priority,
      status: row.status,
      components: row.components,
      confidence: row.confidence,
      conclusion: row.conclusion,
      reportPath: row.reportPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      projectName: row.projectName || "Unknown Project",
    }));
  }

  async getJob(id: number): Promise<(Job & { projectName: string }) | undefined> {
    const result = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
        simulationName: jobs.simulationName,
        bench: jobs.bench,
        type: jobs.type,
        dateRequest: jobs.dateRequest,
        dateDue: jobs.dateDue,
        priority: jobs.priority,
        status: jobs.status,
        components: jobs.components,
        confidence: jobs.confidence,
        conclusion: jobs.conclusion,
        reportPath: jobs.reportPath,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        projectName: projects.name,
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .where(eq(jobs.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      projectId: row.projectId,
      simulationName: row.simulationName,
      bench: row.bench,
      type: row.type,
      dateRequest: row.dateRequest,
      dateDue: row.dateDue,
      priority: row.priority,
      status: row.status,
      components: row.components,
      confidence: row.confidence,
      conclusion: row.conclusion,
      reportPath: row.reportPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      projectName: row.projectName || "Unknown Project",
    };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const jobData = {
      projectId: job.projectId,
      simulationName: job.simulationName,
      bench: job.bench,
      type: job.type,
      dateRequest: job.dateRequest,
      dateDue: job.dateDue,
      priority: job.priority,
      status: job.status,
      components: job.components as string[] | null,
      confidence: job.confidence,
      conclusion: job.conclusion,
      reportPath: job.reportPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(jobs).values(jobData).returning();
    return result[0];
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    if (updates.components !== undefined) {
      updateData.components = updates.components as string[] | null;
    }
    
    const result = await db.update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
    return result.length > 0;
  }

  // File methods
  async getJobFiles(jobId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.jobId, jobId));
  }

  async createFile(file: InsertFile): Promise<File> {
    const result = await db.insert(files).values({
      ...file,
      uploadedAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async getFile(id: number): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.id, id)).limit(1);
    return result[0];
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();