import { apiRequest } from "./queryClient";
import type { InsertJob, Job, File } from "@shared/schema";

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    logout: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    me: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return res.json();
    },
  },
  
  jobs: {
    list: async (filters?: { status?: string; bench?: string; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.bench) params.append("bench", filters.bench);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
      
      const res = await apiRequest("GET", `/api/jobs?${params.toString()}`);
      return res.json() as Promise<Job[]>;
    },
    
    get: async (id: number) => {
      const res = await apiRequest("GET", `/api/jobs/${id}`);
      return res.json() as Promise<Job>;
    },
    
    create: async (job: InsertJob) => {
      const res = await apiRequest("POST", "/api/jobs", job);
      return res.json() as Promise<Job>;
    },
    
    update: async (id: number, updates: Partial<InsertJob>) => {
      const res = await apiRequest("PUT", `/api/jobs/${id}`, updates);
      return res.json() as Promise<Job>;
    },
    
    delete: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/jobs/${id}`);
      return res.json();
    },
  },
  
  files: {
    list: async (jobId: number) => {
      const res = await apiRequest("GET", `/api/jobs/${jobId}/files`);
      return res.json() as Promise<File[]>;
    },
    
    upload: async (jobId: number, files: FileList, label: string) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.append("label", label);
      
      const res = await fetch(`/api/jobs/${jobId}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("File upload failed");
      }
      
      return res.json() as Promise<File[]>;
    },
    
    download: async (fileId: number) => {
      const res = await fetch(`/api/files/${fileId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("File download failed");
      }
      
      return res.blob();
    },
    
    delete: async (fileId: number) => {
      const res = await apiRequest("DELETE", `/api/files/${fileId}`);
      return res.json();
    },
  },
};
