import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "../components/Sidebar";
import ThreeDViewer from "../components/ThreeDViewer";
import { useCreateJob } from "../hooks/useJobs";
import { useProjects, useCreateProject } from "../hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

const newJobSchema = z.object({
  projectId: z.number().min(1, "Project is required"),
  projectName: z.string().optional(), // For creating new projects
  simulationName: z.string().min(1, "Simulation name is required"),
  bench: z.enum(["symmetric-bending", "brake-load", "unknown"]),
  type: z.enum(["static", "fatigue"]),
  dateRequest: z.string().min(1, "Request date is required"),
  dateDue: z.string().optional(),
  priority: z.number().min(1).max(5),
  components: z.array(z.string()).min(1, "At least one component must be selected"),
});

type NewJobForm = z.infer<typeof newJobSchema>;

const steps = [
  { title: "Project", description: "Choose existing project or create new one" },
  { title: "Simulation", description: "Name this simulation" },
  { title: "Bench", description: "Select bench configuration" },
  { title: "Type", description: "Choose analysis type" },
  { title: "Components", description: "Select fork components" },
  { title: "Details", description: "Set dates and priority" },
];

export default function NewRequest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [isNewProject, setIsNewProject] = useState(false);
  const [, setLocation] = useLocation();
  const { data: projects = [] } = useProjects(false);
  const createJobMutation = useCreateJob();
  const createProjectMutation = useCreateProject();
  const { toast } = useToast();

  const form = useForm<NewJobForm>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      projectId: 0,
      projectName: "",
      simulationName: "",
      bench: "unknown",
      type: "static",
      dateRequest: new Date().toISOString().split("T")[0],
      dateDue: "",
      priority: 3,
      components: [],
    },
  });

  const handleNext = () => {
    if (currentStep === 4) {
      // Validate components before proceeding
      if (selectedComponents.length === 0) {
        form.setError("components", { message: "At least one component must be selected" });
        return;
      }
      form.setValue("components", selectedComponents);
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComponentSelect = (componentId: string) => {
    if (!selectedComponents.includes(componentId)) {
      const newComponents = [...selectedComponents, componentId];
      setSelectedComponents(newComponents);
      form.setValue("components", newComponents);
    }
  };

  const handleComponentDeselect = (componentId: string) => {
    const newComponents = selectedComponents.filter(id => id !== componentId);
    setSelectedComponents(newComponents);
    form.setValue("components", newComponents);
  };

  const onSubmit = async (data: NewJobForm) => {
    try {
      let projectId = data.projectId;

      // Create new project if needed
      if (isNewProject && data.projectName) {
        const newProject = await createProjectMutation.mutateAsync({
          name: data.projectName,
          archived: false,
        });
        projectId = newProject.id;
      }

      await createJobMutation.mutateAsync({
        projectId,
        simulationName: data.simulationName,
        bench: data.bench,
        type: data.type,
        dateRequest: data.dateRequest,
        dateDue: data.dateDue,
        priority: data.priority,
        components: data.components,
        status: "queued",
      });
      
      toast({
        title: "Success",
        description: "Simulation job created successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create simulation job",
        variant: "destructive",
      });
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">New Request Wizard</h2>
              <p className="text-sm text-gray-500 mt-1">Create a new FEA simulation job</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Cancel
            </Button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{steps[currentStep].title}</h3>
                <span className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    {/* Step 0: Project */}
                    {currentStep === 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 mb-4">
                          <Button
                            type="button"
                            variant={!isNewProject ? "default" : "outline"}
                            onClick={() => setIsNewProject(false)}
                          >
                            Existing Project
                          </Button>
                          <Button
                            type="button"
                            variant={isNewProject ? "default" : "outline"}
                            onClick={() => setIsNewProject(true)}
                          >
                            New Project
                          </Button>
                        </div>

                        {!isNewProject ? (
                          <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Project</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose an existing project" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {projects.map((project) => (
                                      <SelectItem key={project.id} value={project.id.toString()}>
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name="projectName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Project Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter project name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Project Organization</h4>
                          <p className="text-sm text-blue-800">
                            {!isNewProject 
                              ? "Select an existing project to add this simulation to. All simulations will be grouped under the project."
                              : "Create a new project to organize your simulations. Multiple simulations can be added to the same project."
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 1: Simulation Name */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="simulationName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Simulation Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter simulation name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-2">Simulation Naming</h4>
                          <p className="text-sm text-green-800">
                            Give this specific simulation a descriptive name. Examples: "Static Analysis - Main Fork", "Fatigue Test - High Load", "Design Iteration #3".
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Bench */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="bench"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bench Configuration</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select bench type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="symmetric-bending">Symmetric Bending</SelectItem>
                                  <SelectItem value="brake-load">Brake Load</SelectItem>
                                  <SelectItem value="unknown">Unknown/TBD</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Bench Types</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p><strong>Symmetric Bending:</strong> Standard vertical load testing</p>
                            <p><strong>Brake Load:</strong> Forward braking force simulation</p>
                            <p><strong>Unknown:</strong> Configuration to be determined later</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Type */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Analysis Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select analysis type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="static">Static Analysis</SelectItem>
                                  <SelectItem value="fatigue">Fatigue Analysis</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-2">Static Analysis</h4>
                            <p className="text-sm text-green-800">
                              Single load condition analysis for stress and deformation under peak loads.
                            </p>
                          </div>
                          
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h4 className="font-medium text-purple-900 mb-2">Fatigue Analysis</h4>
                            <p className="text-sm text-purple-800">
                              Life prediction under cyclic loading conditions and material fatigue.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Components */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Select Components</label>
                          <p className="text-sm text-gray-600 mb-4">
                            Click on the 3D model to select the components for analysis
                          </p>
                        </div>
                        
                        <ThreeDViewer
                          selectedComponents={selectedComponents}
                          onComponentSelect={handleComponentSelect}
                          onComponentDeselect={handleComponentDeselect}
                        />
                        
                        {form.formState.errors.components && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.components.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step 5: Details */}
                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="dateRequest"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Request Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="dateDue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority (1-5)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1 - Low</SelectItem>
                                  <SelectItem value="2">2 - Below Normal</SelectItem>
                                  <SelectItem value="3">3 - Normal</SelectItem>
                                  <SelectItem value="4">4 - High</SelectItem>
                                  <SelectItem value="5">5 - Critical</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-3">Job Summary</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Project:</span>
                              <span className="ml-2 font-medium">
                                {isNewProject ? form.watch("projectName") : projects.find(p => p.id === form.watch("projectId"))?.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Simulation:</span>
                              <span className="ml-2 font-medium">{form.watch("simulationName")}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Bench:</span>
                              <span className="ml-2 font-medium">{form.watch("bench")}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <span className="ml-2 font-medium">{form.watch("type")}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Components:</span>
                              <span className="ml-2 font-medium">{selectedComponents.length} selected</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  
                  {currentStep === steps.length - 1 ? (
                    <Button 
                      type="submit" 
                      disabled={createJobMutation.isPending}
                    >
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </div>
  );
}
