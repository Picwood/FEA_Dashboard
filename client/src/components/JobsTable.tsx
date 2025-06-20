import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, List, Grid, Eye, Download, Trash2, ArrowUpDown } from "lucide-react";
import { useJobs } from "../hooks/useJobs";
import type { Job } from "@shared/schema";
import { useLocation } from "wouter";

interface JobsTableProps {
  onJobSelect?: (job: Job) => void;
}

export default function JobsTable({ onJobSelect }: JobsTableProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    if (priority >= 4) return <Badge className="priority-high">High</Badge>;
    if (priority >= 3) return <Badge className="priority-medium">Medium</Badge>;
    return <Badge className="priority-low">Low</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: "status-running",
      queued: "status-queued", 
      done: "status-done",
      failed: "status-failed",
    };
    
    return <Badge className={variants[status as keyof typeof variants] || ""}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Simulation Jobs</h3>
          <div className="flex items-center space-x-3">
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
              <Button variant="ghost" size="sm" className="text-gray-500 rounded-l-none">
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "project", label: "Project" },
                  { key: "bench", label: "Bench" },
                  { key: "type", label: "Type" },
                  { key: "priority", label: "Priority" },
                  { key: "dateDue", label: "Due Date" },
                  { key: "status", label: "Status" },
                  { key: "actions", label: "Actions" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.key !== "actions" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.key)}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700"
                      >
                        <span>{column.label}</span>
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setLocation(`/job/${job.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Grid className="text-blue-600 h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.project}</div>
                        <div className="text-xs text-gray-500">ID: FEA-{job.id.toString().padStart(3, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{job.bench}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{job.type}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(job.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.dateDue || "Not set"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setLocation(`/job/${job.id}`); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
