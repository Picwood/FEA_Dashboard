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
import { useToast } from "@/hooks/use-toast";

const newJobSchema = z.object({
  project: z.string().min(1, "Project name is required"),
  bench: z.enum(["symmetric-bending", "brake-load", "unknown"]),
  type: z.enum(["static", "fatigue"]),
  dateRequest: z.string().min(1, "Request date is required"),
  dateDue: z.string().optional(),
  priority: z.number().min(1).max(5),
  components: z.array(z.string()).min(1, "At least one component must be selected"),
});

type NewJobForm = z.infer<typeof newJobSchema>;

const steps = [
  { title: "Project", description: "Choose or enter project name" },
  { title: "Bench", description: "Select bench configuration" },
  { title: "Type", description: "Choose analysis type" },
  { title: "Components", description: "Select fork components" },
  { title: "Details", description: "Set dates and priority" },
];

export default function NewRequest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const createJobMutation = useCreateJob();
  const { toast } = useToast();

  const form = useForm<NewJobForm>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      project: "",
      bench: "unknown",
      type: "static",
      dateRequest: new Date().toISOString().split("T")[0],
      dateDue: "",
      priority: 3,
      components: [],
    },
  });

  const handleNext = () => {
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
    const newComponents = [...selectedComponents, componentId];
    setSelectedComponents(newComponents);
    form.setValue("components", newComponents);
  };

  const handleComponentDeselect = (componentId: string) => {
    const newComponents = selectedComponents.filter(id => id !== componentId);
    setSelectedComponents(newComponents);
    form.setValue("components", newComponents);
  };

  const onSubmit = async (data: NewJobForm) => {
    try {
      await createJobMutation.mutateAsync({
        ...data,
        components: JSON.stringify(data.components),
        status: "queued",
      });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job",
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
                        <FormField
                          control={form.control}
                          name="project"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., XC-Elite-2024" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Recent Projects</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {["XC-Elite-2024", "Trail-Master-V3", "Enduro-Pro-2024", "Cross-Country-X1"].map(project => (
                              <Button
                                key={project}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => form.setValue("project", project)}
                              >
                                {project}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 1: Bench */}
                    {currentStep === 1 && (
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

                    {/* Step 2: Type */}
                    {currentStep === 2 && (
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

                    {/* Step 3: Components */}
                    {currentStep === 3 && (
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

                    {/* Step 4: Details */}
                    {currentStep === 4 && (
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
                              <span className="ml-2 font-medium">{form.watch("project")}</span>
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
