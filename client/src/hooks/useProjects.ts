import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import type { Project, InsertProject } from "@shared/schema";

export function useProjects(archived?: boolean) {
  return useQuery({
    queryKey: ["/api/projects", { archived }],
    queryFn: () => apiRequest("GET", `/api/projects${archived !== undefined ? `?archived=${archived}` : ""}`).then(res => res.json()) as Promise<Project[]>,
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: async (project: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", project);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });
}

export function useArchiveProject() {
  return useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}/archive`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });
}