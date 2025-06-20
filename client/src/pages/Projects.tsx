import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, Archive, Calendar, FolderOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "../components/Sidebar";
import { useProjects, useCreateProject, useArchiveProject } from "../hooks/useProjects";
import { useJobs } from "../hooks/useJobs";
import { useToast } from "@/hooks/use-toast";

const newProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

type NewProjectForm = z.infer<typeof newProjectSchema>;

export default function Projects() {
  const [search, setSearch] = useState("");
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  
  const { data: activeProjects = [] } = useProjects(false);
  const { data: archivedProjects = [] } = useProjects(true);
  const { data: allJobs = [] } = useJobs();
  const createProjectMutation = useCreateProject();
  const archiveProjectMutation = useArchiveProject();
  const { toast } = useToast();

  const form = useForm<NewProjectForm>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: NewProjectForm) => {
    try {
      await createProjectMutation.mutateAsync({
        name: data.name,
        archived: false,
      });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setIsNewProjectModalOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleArchiveProject = async (projectId: number) => {
    try {
      await archiveProjectMutation.mutateAsync(projectId);
      toast({
        title: "Success",
        description: "Project archived successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive project",
        variant: "destructive",
      });
    }
  };

  const getProjectStats = (projectId: number) => {
    const projectJobs = allJobs.filter(job => job.projectId === projectId);
    return {
      total: projectJobs.length,
      running: projectJobs.filter(job => job.status === "running").length,
      done: projectJobs.filter(job => job.status === "done").length,
      queued: projectJobs.filter(job => job.status === "queued").length,
      failed: projectJobs.filter(job => job.status === "failed").length,
    };
  };

  const filteredActiveProjects = activeProjects.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArchivedProjects = archivedProjects.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Project Management</h2>
              <p className="text-sm text-gray-500 mt-1">Organize and manage your simulation projects</p>
            </div>
            <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsNewProjectModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProjectMutation.isPending}>
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Active Projects ({filteredActiveProjects.length})
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived Projects ({filteredArchivedProjects.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Simulations</TableHead>
                          <TableHead>Status Overview</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActiveProjects.map((project) => {
                          const stats = getProjectStats(project.id);
                          return (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">{stats.total} simulations</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {stats.running > 0 && <Badge variant="default">{stats.running} Running</Badge>}
                                  {stats.queued > 0 && <Badge variant="secondary">{stats.queued} Queued</Badge>}
                                  {stats.done > 0 && <Badge variant="outline" className="border-green-500 text-green-700">{stats.done} Done</Badge>}
                                  {stats.failed > 0 && <Badge variant="destructive">{stats.failed} Failed</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchiveProject(project.id)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {filteredActiveProjects.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No active projects found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="archived">
                <Card>
                  <CardHeader>
                    <CardTitle>Archived Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Simulations</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArchivedProjects.map((project) => {
                          const stats = getProjectStats(project.id);
                          return (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium text-gray-500">{project.name}</TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">{stats.total} simulations</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {filteredArchivedProjects.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No archived projects found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}