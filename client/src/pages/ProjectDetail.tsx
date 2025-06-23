import { useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ExternalLink, Calendar, User, FileText, TrendingUp, CheckCircle, AlertCircle, XCircle, Clock, Edit } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "../components/Sidebar";
import { useJobs } from "../hooks/useJobs";
import { useProjects } from "../hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  queued: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800", 
  done: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const statusIcons = {
  queued: Clock,
  running: TrendingUp,
  done: CheckCircle,
  failed: XCircle,
};

const conclusionColors = {
  "Valid Design": "bg-green-100 text-green-800",
  "Revise Design": "bg-orange-100 text-orange-800",
  "no convergence": "bg-red-100 text-red-800",
  "other": "bg-gray-100 text-gray-800",
};

const conclusionIcons = {
  "Valid Design": CheckCircle,
  "Revise Design": AlertCircle,
  "no convergence": XCircle,
  "other": FileText,
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [, setLocation] = useLocation();
  const { data: projects = [] } = useProjects(false);
  const { data: jobs = [] } = useJobs({ includeArchived: true });
  const { toast } = useToast();
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; jobId?: number }>({ open: false });
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; jobId?: number; confidence?: number; conclusion?: string }>({ open: false });
  const [editConfidence, setEditConfidence] = useState<number>(0);
  const [editConclusion, setEditConclusion] = useState<string>("");

  // Find the project
  const project = projects.find(p => p.id === parseInt(projectId || "0"));
  
  // Filter jobs for this project
  const projectJobs = jobs.filter(job => job.projectId === parseInt(projectId || "0"));

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <Button onClick={() => setLocation("/projects")}>
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleReportUpload = async (jobId: number) => {
    if (!reportFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", reportFile);
      formData.append("label", "report");

      const response = await fetch(`/api/jobs/${jobId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast({
        title: "Success",
        description: "Report uploaded successfully",
      });
      
      setUploadDialog({ open: false });
      setReportFile(null);
      // TODO: Refresh data
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload report",
        variant: "destructive",
      });
    }
  };

  const handleViewReport = (reportPath: any) => {
    if (!reportPath) return;
    // Open report in new tab
    window.open(`/api/files/${reportPath}`, '_blank');
  };

  const handleEditAnalysis = (job: any) => {
    setEditConfidence(job.confidence || 0);
    setEditConclusion(job.conclusion || "");
    setEditDialog({ 
      open: true, 
      jobId: job.id, 
      confidence: job.confidence, 
      conclusion: job.conclusion 
    });
  };

  const handleSaveAnalysis = async () => {
    if (!editDialog.jobId) return;

    try {
      const response = await fetch(`/api/jobs/${editDialog.jobId}/analysis`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confidence: editConfidence,
          conclusion: editConclusion,
        }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      toast({
        title: "Success",
        description: "Analysis results updated successfully",
      });
      
      setEditDialog({ open: false });
      // TODO: Refresh data
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update analysis results",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getConclusionIcon = (conclusion?: string) => {
    if (!conclusion) return <FileText className="h-4 w-4" />;
    const Icon = conclusionIcons[conclusion as keyof typeof conclusionIcons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "text-gray-500";
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setLocation("/projects")}>
                ← Back to Projects
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {projectJobs.length} simulation{projectJobs.length !== 1 ? 's' : ''}
                  {project.archived && <span className="ml-2 text-orange-600">(Archived)</span>}
                </p>
              </div>
            </div>
            <Button onClick={() => setLocation("/new")}>
              + Add Simulation
            </Button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Project Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Project Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created</Label>
                    <p className="text-sm font-medium">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <p className="text-sm font-medium">
                      {project.archived ? "Archived" : "Active"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Simulations</Label>
                    <p className="text-sm font-medium">
                      {projectJobs.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulations Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Simulations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No simulations yet</h3>
                    <p className="text-gray-500 mb-4">Start by creating your first simulation for this project.</p>
                    <Button onClick={() => setLocation("/new")}>
                      Create Simulation
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Simulation Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Bench</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Conclusion</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Report</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectJobs.map((job) => (
                        <TableRow key={job.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {job.simulationName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {job.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {job.bench.replace('-', ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[job.status as keyof typeof statusColors]} flex items-center space-x-1`}>
                              {getStatusIcon(job.status)}
                              <span className="capitalize">{job.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(job as any).confidence ? (
                              <span className={`font-medium ${getConfidenceColor((job as any).confidence)}`}>
                                {(job as any).confidence}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(job as any).conclusion ? (
                              <Badge className={`${conclusionColors[(job as any).conclusion as keyof typeof conclusionColors] || 'bg-gray-100 text-gray-800'} flex items-center space-x-1`}>
                                {getConclusionIcon((job as any).conclusion)}
                                <span>{(job as any).conclusion}</span>
                              </Badge>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(job.dateDue)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              P{job.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {(job as any).reportPath ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReport((job as any).reportPath)}
                                  className="flex items-center space-x-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>View</span>
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">No report</span>
                              )}
                              
                              <Dialog 
                                open={uploadDialog.open && uploadDialog.jobId === job.id} 
                                onOpenChange={(open) => setUploadDialog({ open, jobId: open ? job.id : undefined })}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center space-x-1"
                                  >
                                    <Upload className="h-3 w-3" />
                                    <span>Upload</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Upload Report</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="report-file">HTML Report File</Label>
                                      <Input
                                        id="report-file"
                                        type="file"
                                        accept=".html,.htm"
                                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setUploadDialog({ open: false })}>
                                        Cancel
                                      </Button>
                                      <Button onClick={() => handleReportUpload(job.id)}>
                                        Upload Report
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAnalysis(job)}
                              className="flex items-center space-x-1"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Analysis Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Analysis Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="confidence">Confidence (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="100"
                value={editConfidence}
                onChange={(e) => setEditConfidence(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="conclusion">Conclusion</Label>
              <Select value={editConclusion} onValueChange={setEditConclusion}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select conclusion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid Design">Valid Design</SelectItem>
                  <SelectItem value="Revise Design">Revise Design</SelectItem>
                  <SelectItem value="no convergence">No Convergence</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialog({ open: false })}>
                Cancel
              </Button>
              <Button onClick={handleSaveAnalysis}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 