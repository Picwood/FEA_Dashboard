import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUpdateJob, useJob } from "../hooks/useJobs";
import { useToast } from "@/hooks/use-toast";

const editJobSchema = z.object({
  project: z.string().min(1, "Project name is required"),
  bench: z.enum(["symmetric-bending", "brake-load", "unknown"]),
  type: z.enum(["static", "fatigue"]),
  dateRequest: z.string().min(1, "Request date is required"),
  dateDue: z.string().optional(),
  priority: z.number().min(1).max(5),
  status: z.enum(["queued", "running", "done", "failed"]),
});

type EditJobForm = z.infer<typeof editJobSchema>;

interface JobEditModalProps {
  jobId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JobEditModal({ jobId, open, onOpenChange }: JobEditModalProps) {
  const { data: job } = useJob(jobId!);
  const updateJobMutation = useUpdateJob();
  const { toast } = useToast();

  const form = useForm<EditJobForm>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      project: "",
      bench: "unknown",
      type: "static",
      dateRequest: "",
      dateDue: "",
      priority: 3,
      status: "queued",
    },
  });

  useEffect(() => {
    if (job) {
      form.reset({
        project: job.project,
        bench: job.bench as "symmetric-bending" | "brake-load" | "unknown",
        type: job.type as "static" | "fatigue",
        dateRequest: job.dateRequest,
        dateDue: job.dateDue || "",
        priority: job.priority,
        status: job.status as "queued" | "running" | "done" | "failed",
      });
    }
  }, [job, form]);

  const onSubmit = async (data: EditJobForm) => {
    if (!jobId) return;
    
    try {
      await updateJobMutation.mutateAsync({
        id: jobId,
        updates: data,
      });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Job #{job.id}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
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
                name="bench"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bench Configuration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateJobMutation.isPending}>
                {updateJobMutation.isPending ? "Updating..." : "Update Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}