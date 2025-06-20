import { useState, useEffect } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCreateJob, useJob } from "../hooks/useJobs";
import { useToast } from "@/hooks/use-toast";

const iterationSchema = z.object({
  project: z.string().min(1, "Project name is required"),
  bench: z.enum(["symmetric-bending", "brake-load", "unknown"]),
  type: z.enum(["static", "fatigue"]),
  dateRequest: z.string().min(1, "Request date is required"),
  dateDue: z.string().optional(),
  priority: z.number().min(1).max(5),
  components: z.array(z.string()).min(1, "At least one component must be selected"),
  iterationNotes: z.string().optional(),
});

type IterationForm = z.infer<typeof iterationSchema>;

interface AddIterationModalProps {
  baseJobId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddIterationModal({ baseJobId, open, onOpenChange }: AddIterationModalProps) {
  const { data: baseJob } = useJob(baseJobId!);
  const createJobMutation = useCreateJob();
  const { toast } = useToast();

  const form = useForm<IterationForm>({
    resolver: zodResolver(iterationSchema),
    defaultValues: {
      project: "",
      bench: "unknown",
      type: "static",
      dateRequest: new Date().toISOString().split("T")[0],
      dateDue: "",
      priority: 3,
      components: [],
      iterationNotes: "",
    },
  });

  // Set form defaults based on base job
  useEffect(() => {
    if (baseJob) {
      form.reset({
        project: `${baseJob.project} - Iteration`,
        bench: baseJob.bench as "symmetric-bending" | "brake-load" | "unknown",
        type: baseJob.type as "static" | "fatigue",
        dateRequest: new Date().toISOString().split("T")[0],
        dateDue: "",
        priority: baseJob.priority,
        components: baseJob.components || [],
        iterationNotes: `Iteration based on job #${baseJob.id}`,
      });
    }
  }, [baseJob, form]);

  const onSubmit = async (data: IterationForm) => {
    if (!baseJobId) return;
    
    try {
      await createJobMutation.mutateAsync({
        ...data,
        status: "queued",
      });
      toast({
        title: "Success",
        description: "Iteration created successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create iteration",
        variant: "destructive",
      });
    }
  };

  if (!baseJob) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Iteration to Job #{baseJob.id}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Base Job Details</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Project:</strong> {baseJob.project}</p>
                <p><strong>Type:</strong> {baseJob.type}</p>
                <p><strong>Bench:</strong> {baseJob.bench}</p>
                <p><strong>Components:</strong> {baseJob.components?.join(", ") || "None"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Iteration Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
            </div>

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
              name="iterationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Iteration Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what changes or improvements this iteration includes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createJobMutation.isPending}>
                {createJobMutation.isPending ? "Creating..." : "Create Iteration"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}