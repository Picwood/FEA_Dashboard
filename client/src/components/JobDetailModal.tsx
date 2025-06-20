import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Trash2, Copy } from "lucide-react";
import { useJob, useJobFiles, useUploadFiles, useDeleteJob } from "../hooks/useJobs";
import { api } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";

interface JobDetailModalProps {
  jobId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JobDetailModal({ jobId, open, onOpenChange }: JobDetailModalProps) {
  const [uploadLabel, setUploadLabel] = useState("mesh");
  const { toast } = useToast();
  
  const { data: job, isLoading: jobLoading } = useJob(jobId!);
  const { data: files = [], isLoading: filesLoading } = useJobFiles(jobId!);
  const uploadFilesMutation = useUploadFiles();
  const deleteJobMutation = useDeleteJob();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !jobId) return;

    try {
      await uploadFilesMutation.mutateAsync({ jobId, files, label: uploadLabel });
      event.target.value = ""; // Reset input
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    }
  };

  const handleFileDownload = async (fileId: number, filename: string) => {
    try {
      const blob = await api.files.download(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async () => {
    if (!jobId) return;
    
    try {
      await deleteJobMutation.mutateAsync(jobId);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return "High";
    if (priority >= 3) return "Medium";
    return "Low";
  };

  if (!jobId || jobLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!job) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <p className="text-gray-500">Job not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Job Details - {job.project}</span>
            <Badge variant="outline">FEA-{job.id.toString().padStart(3, "0")}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Project</label>
                    <p className="font-medium">{job.project}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Bench Type</label>
                    <p className="font-medium">{job.bench}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Analysis Type</label>
                    <p className="font-medium">{job.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Priority</label>
                    <p className="font-medium">{getPriorityLabel(job.priority)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Request Date</label>
                    <p className="font-medium">{job.dateRequest}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Due Date</label>
                    <p className="font-medium">{job.dateDue || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <Badge className={`status-${job.status}`}>{job.status}</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Components</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(job.components || []).map((component) => (
                        <Badge key={component} variant="outline" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {job.status === "running" && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Simulation Progress</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="w-full" />
                    <p className="text-sm text-gray-600">Estimated completion: 2 hours remaining</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <select
                      value={uploadLabel}
                      onChange={(e) => setUploadLabel(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="mesh">Mesh File</option>
                      <option value="inp_file">Input File (.inp)</option>
                      <option value="result_log">Result Log</option>
                      <option value="general">General</option>
                    </select>
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadFilesMutation.isPending}
                      />
                      <Button disabled={uploadFilesMutation.isPending}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadFilesMutation.isPending ? "Uploading..." : "Upload Files"}
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="flex items-center justify-center h-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No files uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">
                              {file.label.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDownload(file.id, file.filename)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => api.files.delete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Job Created</p>
                      <p className="text-xs text-gray-500">{job.createdAt}</p>
                    </div>
                  </div>
                  
                  {job.status !== "queued" && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Simulation Started</p>
                        <p className="text-xs text-gray-500">{job.updatedAt}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.status === "done" && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Simulation Completed</p>
                        <p className="text-xs text-gray-500">{job.updatedAt}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="destructive"
            onClick={handleDeleteJob}
            disabled={deleteJobMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Job
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
