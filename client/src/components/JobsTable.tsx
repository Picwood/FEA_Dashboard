import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, List, Grid, Eye, Download, Trash2, ArrowUpDown, Edit, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { useJobs } from "../hooks/useJobs";
import type { Job } from "@shared/schema";

type JobWithProject = Job & { projectName: string };
import { useLocation } from "wouter";
import JobDetailModal from "./JobDetailModal";
import JobEditModal from "./JobEditModal";
import AddIterationModal from "./AddIterationModal";
import { apiRequest } from "@/lib/queryClient";
import { Copy } from "lucide-react";

interface JobsTableProps {
  onJobSelect?: (job: JobWithProject) => void;
}

export default function JobsTable({ onJobSelect }: JobsTableProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isIterationModalOpen, setIsIterationModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Get current user info
  useEffect(() => {
    apiRequest("GET", "/api/auth/me")
      .then(res => res.json())
      .then(data => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null));
  }, []);

  const { data: jobs = [], isLoading } = useJobs({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter || undefined,
    sortBy,
    sortOrder,
  });

  // Group jobs by project
  const projectGroups = jobs.reduce((acc, job) => {
    const projectName = job.projectName;
    if (!acc[projectName]) {
      acc[projectName] = {
        projectName,
        jobs: [],
        totalJobs: 0,
        statuses: {
          queued: 0,
          running: 0,
          done: 0,
          failed: 0,
        },
      };
    }
    acc[projectName].jobs.push(job);
    acc[projectName].totalJobs++;
    acc[projectName].statuses[job.status as keyof typeof acc[string]['statuses']]++;
    return acc;
  }, {} as Record<string, {
    projectName: string;
    jobs: typeof jobs;
    totalJobs: number;
    statuses: { queued: number; running: number; done: number; failed: number };
  }>);

  // Expand all projects by default
  useEffect(() => {
    if (Object.keys(projectGroups).length > 0 && expandedProjects.size === 0) {
      setExpandedProjects(new Set(Object.keys(projectGroups)));
    }
  }, [projectGroups]);

  const toggleProject = (projectName: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

  const expandAllProjects = () => {
    setExpandedProjects(new Set(Object.keys(projectGroups)));
  };

  const collapseAllProjects = () => {
    setExpandedProjects(new Set());
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 4) return <Badge variant="destructive">High</Badge>;
    if (priority >= 3) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued': return <Badge variant="secondary">Queued</Badge>;
      case 'running': return <Badge variant="default">Running</Badge>;
      case 'done': return <Badge variant="outline" className="border-green-500 text-green-700">Done</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProjectStatusSummary = (statuses: { queued: number; running: number; done: number; failed: number }) => {
    const { queued, running, done, failed } = statuses;
    const total = queued + running + done + failed;
    
    if (total === 0) return null;
    
    return (
      <div className="flex items-center gap-1 text-xs">
        {running > 0 && <Badge variant="default" className="text-xs px-1 py-0">{running}</Badge>}
        {queued > 0 && <Badge variant="secondary" className="text-xs px-1 py-0">{queued}</Badge>}
        {done > 0 && <Badge variant="outline" className="border-green-500 text-green-700 text-xs px-1 py-0">{done}</Badge>}
        {failed > 0 && <Badge variant="destructive" className="text-xs px-1 py-0">{failed}</Badge>}
      </div>
    );
  };

  const handleJobView = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsDetailModalOpen(true);
  };

  const handleJobEdit = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsEditModalOpen(true);
  };

  const handleAddIteration = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsIterationModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Simulation Jobs</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={expandAllProjects}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllProjects}>
                Collapse All
              </Button>

              <div className="flex rounded-lg border border-gray-300">
                <Button variant="ghost" size="sm" className="text-primary bg-primary/10 rounded-r-none">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-l-none">
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-20">
                      <Button variant="ghost" onClick={() => handleSort("id")} className="p-0 h-auto font-medium">
                        ID <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[200px]">
                      <Button variant="ghost" onClick={() => handleSort("projectName")} className="p-0 h-auto font-medium">
                        Project / Simulation <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead className="w-20">Priority</TableHead>
                    <TableHead className="w-24">
                      <Button variant="ghost" onClick={() => handleSort("dateRequest")} className="p-0 h-auto font-medium">
                        Requested <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-24">Due Date</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(projectGroups).map((project) => (
                    <React.Fragment key={project.projectName}>
                      <TableRow
                        key={`project-${project.projectName}`}
                        className="hover:bg-blue-50 cursor-pointer border-b-2 border-blue-100"
                        onClick={() => toggleProject(project.projectName)}
                      >
                        <TableCell className="w-8">
                          {expandedProjects.has(project.projectName) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="w-20 font-medium text-blue-600">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Project
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="font-semibold text-blue-700">
                            {project.projectName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.totalJobs} simulation{project.totalJobs !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell className="w-24">
                          {getProjectStatusSummary(project.statuses)}
                        </TableCell>
                        <TableCell className="w-20 text-gray-400">—</TableCell>
                        <TableCell className="w-20 text-gray-400">—</TableCell>
                        <TableCell className="w-24 text-gray-400">—</TableCell>
                        <TableCell className="w-24 text-gray-400">—</TableCell>
                        <TableCell className="w-32 text-gray-400">—</TableCell>
                      </TableRow>
                      {expandedProjects.has(project.projectName) && 
                        project.jobs.map((job) => (
                          <TableRow key={`sim-${job.id}`} className="hover:bg-gray-50 bg-gray-25">
                            <TableCell className="w-8 pl-6">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </TableCell>
                            <TableCell className="w-20 font-medium">#{job.id}</TableCell>
                            <TableCell className="min-w-[200px]">
                              <div className="pl-4">
                                <div className="text-sm font-medium">{job.simulationName}</div>
                                <div className="text-xs text-gray-500">Simulation</div>
                              </div>
                            </TableCell>
                            <TableCell className="w-24">{getStatusBadge(job.status)}</TableCell>
                            <TableCell className="w-20">
                              <Badge variant="outline" className="text-xs">
                                {job.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-20">{getPriorityBadge(job.priority)}</TableCell>
                            <TableCell className="w-24 text-sm">
                              {new Date(job.dateRequest).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="w-24 text-sm">
                              {job.dateDue ? new Date(job.dateDue).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell className="w-32">
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleJobView(job.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {(currentUser?.role === "admin" || currentUser?.username === "engineer") && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleJobEdit(job.id)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleAddIteration(job.id)}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {currentUser?.role === "admin" && (
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {Object.keys(projectGroups).length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No jobs found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <JobDetailModal
        jobId={selectedJobId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
      
      <JobEditModal
        jobId={selectedJobId}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
      
      <AddIterationModal
        baseJobId={selectedJobId}
        open={isIterationModalOpen}
        onOpenChange={setIsIterationModalOpen}
      />
    </>
  );
}