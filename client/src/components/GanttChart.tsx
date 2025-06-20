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

  // Sort jobs by request date
  const sortedJobs = [...jobs].sort((a, b) => 
    new Date(a.dateRequest).getTime() - new Date(b.dateRequest).getTime()
  );

  // Get date range
  const today = new Date();
  const dates = sortedJobs.flatMap(job => [
    new Date(job.dateRequest),
    job.dateDue ? new Date(job.dateDue) : today
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

          {/* Job bars */}
          <div className="space-y-3">
            {sortedJobs.map((job) => {
              const startDate = new Date(job.dateRequest);
              const endDate = job.dateDue ? new Date(job.dateDue) : new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
              
              const startPos = getDatePosition(startDate);
              const endPos = getDatePosition(endDate);
              const width = Math.max(2, endPos - startPos);

              return (
                <div key={job.id} className="relative">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-40 text-sm font-medium truncate">
                      {job.project}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(job.priority)}>
                        P{job.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Timeline bar */}
                  <div className="relative h-6 bg-gray-100 rounded">
                    <div
                      className={`absolute top-1 bottom-1 rounded ${getStatusColor(job.status)} opacity-80`}
                      style={{
                        left: `${startPos}%`,
                        width: `${width}%`,
                      }}
                    />
                    
                    {/* Start date marker */}
                    <div
                      className="absolute top-0 w-2 h-full bg-gray-600 rounded-l"
                      style={{ left: `${startPos}%` }}
                    />
                    
                    {/* Due date marker */}
                    {job.dateDue && (
                      <div
                        className="absolute top-0 w-2 h-full bg-gray-800 rounded-r"
                        style={{ left: `${endPos - 2}%` }}
                      />
                    )}
                  </div>
                  
                  {/* Date labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(job.dateRequest)}
                    </span>
                    {job.dateDue && (
                      <span>Due: {formatDate(job.dateDue)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedJobs.length === 0 && (
            <div className="h-32 flex items-center justify-center text-gray-500">
              No jobs to display in timeline
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}