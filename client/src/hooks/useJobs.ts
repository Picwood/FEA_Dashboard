import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertJob } from "@shared/schema";

export function useJobs(filters?: { 
  status?: string; 
  bench?: string; 
  search?: string; 
  sortBy?: string; 
  sortOrder?: "asc" | "desc" 
}) {
  return useQuery({
    queryKey: ["/api/jobs", filters],
    queryFn: () => api.jobs.list(filters),
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: ["/api/jobs", id],
    queryFn: () => api.jobs.get(id),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (job: InsertJob) => api.jobs.create(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertJob> }) => 
      api.jobs.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: number) => api.jobs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    },
  });
}

export function useJobFiles(jobId: number) {
  return useQuery({
    queryKey: ["/api/jobs", jobId, "files"],
    queryFn: () => api.files.list(jobId),
    enabled: !!jobId,
  });
}

export function useUploadFiles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ jobId, files, label }: { jobId: number; files: FileList; label: string }) =>
      api.files.upload(jobId, files, label),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "files"] });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });
}
