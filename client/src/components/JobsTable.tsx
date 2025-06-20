import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, List, Grid, Eye, Download, Trash2, ArrowUpDown, Edit } from "lucide-react";
import { useJobs } from "../hooks/useJobs";
import type { Job } from "@shared/schema";
import { useLocation } from "wouter";
import JobDetailModal from "./JobDetailModal";
import JobEditModal from "./JobEditModal";
import AddIterationModal from "./AddIterationModal";
import { apiRequest } from "@/lib/queryClient";
import { Copy } from "lucide-react";

interface JobsTableProps {
  onJobSelect?: (job: Job) => void;
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

  // Get current user info
  useEffect(() => {
    apiRequest("/api/auth/me")
      .then(data => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null));
  }, []);

  const { data: jobs = [], isLoading } = useJobs({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter || undefined,
    sortBy,
    sortOrder,
  });

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("id")} className="p-0 h-auto font-medium">
                      ID <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("project")} className="p-0 h-auto font-medium">
                      Project <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("dateRequest")} className="p-0 h-auto font-medium">
                      Requested <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">#{job.id}</TableCell>
                    <TableCell className="font-medium">{job.project}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                    <TableCell>{new Date(job.dateRequest).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {job.dateDue ? new Date(job.dateDue).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}

          {jobs.length === 0 && !isLoading && (
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