import { useJobs } from "../hooks/useJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

export default function GanttChart() {
  const { data: jobs = [], isLoading } = useJobs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading timeline...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group jobs by project and get project timeline data
  const projectTimelines = jobs.reduce((acc, job) => {
    const projectName = job.projectName;
    if (!acc[projectName]) {
      acc[projectName] = {
        projectName,
        jobs: [],
        firstRequest: job.dateRequest,
        lastDue: job.dateDue || job.dateRequest,
      };
    }
    
    acc[projectName].jobs.push(job);
    
    // Update project timeline bounds
    if (new Date(job.dateRequest) < new Date(acc[projectName].firstRequest)) {
      acc[projectName].firstRequest = job.dateRequest;
    }
    if (job.dateDue && new Date(job.dateDue) > new Date(acc[projectName].lastDue)) {
      acc[projectName].lastDue = job.dateDue;
    }
    
    return acc;
  }, {} as Record<string, { 
    projectName: string; 
    jobs: typeof jobs; 
    firstRequest: string; 
    lastDue: string; 
  }>);

  const sortedProjects = Object.values(projectTimelines).sort((a, b) => 
    new Date(a.firstRequest).getTime() - new Date(b.firstRequest).getTime()
  );

  // Get date range from project timelines
  const today = new Date();
  const dates = sortedProjects.flatMap(project => [
    new Date(project.firstRequest),
    new Date(project.lastDue)
  ]);
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Add some padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 14);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-500';
      case 'running': return 'bg-blue-500';
      case 'done': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'border-red-500';
    if (priority === 3) return 'border-yellow-500';
    return 'border-green-500';
  };

  const getDatePosition = (date: Date) => {
    const days = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline View
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Project timeline and scheduling overview
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline header */}
          <div className="relative h-8 border-b border-gray-200">
            <div className="absolute left-0 right-0 flex justify-between text-xs text-gray-500 pt-1">
              <span>{formatDate(minDate.toISOString())}</span>
              <span>Today</span>
              <span>{formatDate(maxDate.toISOString())}</span>
            </div>
            {/* Today marker */}
            <div 
              className="absolute top-0 w-0.5 h-full bg-red-500"
              style={{ left: `${getDatePosition(today)}%` }}
            />
          </div>

          {/* Project timeline bars */}
          <div className="space-y-4">
            {sortedProjects.map((project) => {
              const startDate = new Date(project.firstRequest);
              const endDate = new Date(project.lastDue);
              
              const startPos = getDatePosition(startDate);
              const endPos = getDatePosition(endDate);
              const width = Math.max(2, endPos - startPos);

              // Get priority from highest priority job in project
              const highestPriority = Math.max(...project.jobs.map(j => j.priority));
              
              // Get overall project status
              const hasRunning = project.jobs.some(j => j.status === "running");
              const hasQueued = project.jobs.some(j => j.status === "queued");
              const allDone = project.jobs.every(j => j.status === "done");
              const hasFailed = project.jobs.some(j => j.status === "failed");
              
              const projectStatus = hasFailed ? "failed" : 
                                 hasRunning ? "running" : 
                                 hasQueued ? "queued" : 
                                 allDone ? "done" : "queued";

              return (
                <div key={project.projectName} className="relative">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-40 text-sm font-medium truncate">
                      {project.projectName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(highestPriority)}>
                        P{highestPriority}
                      </Badge>
                      <Badge variant="secondary">
                        {project.jobs.length} simulations
                      </Badge>
                      <Badge variant="secondary">
                        {projectStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Timeline bar */}
                  <div className="relative h-8 bg-gray-100 rounded">
                    <div
                      className={`absolute top-1 bottom-1 rounded ${getStatusColor(projectStatus)} opacity-60`}
                      style={{
                        left: `${startPos}%`,
                        width: `${width}%`,
                      }}
                    />
                    
                    {/* Project start marker */}
                    <div
                      className="absolute top-0 w-2 h-full bg-gray-600 rounded-l"
                      style={{ left: `${startPos}%` }}
                    />
                    
                    {/* Project end marker */}
                    <div
                      className="absolute top-0 w-2 h-full bg-gray-800 rounded-r"
                      style={{ left: `${endPos - 2}%` }}
                    />
                    
                    {/* Individual simulation due dates as dots */}
                    {project.jobs
                      .filter(job => job.dateDue && job.dateDue !== project.lastDue)
                      .map((job, index) => {
                        const dueDatePos = getDatePosition(new Date(job.dateDue!));
                        return (
                          <div
                            key={`${job.id}-${index}`}
                            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"
                            style={{ left: `${dueDatePos}%` }}
                            title={`${job.simulationName} - Due: ${formatDate(job.dateDue!)}`}
                          />
                        );
                      })
                    }
                  </div>
                  
                  {/* Date labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.firstRequest)}
                    </span>
                    <span>Due: {formatDate(project.lastDue)}</span>
                  </div>
                  
                  {/* Simulation list */}
                  <div className="mt-2 ml-4 text-xs text-gray-600">
                    {project.jobs.map((job, index) => (
                      <span key={job.id}>
                        {job.simulationName}
                        {index < project.jobs.length - 1 ? " • " : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedProjects.length === 0 && (
            <div className="h-32 flex items-center justify-center text-gray-500">
              No projects to display in timeline
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}