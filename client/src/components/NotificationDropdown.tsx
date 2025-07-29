import React, { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { useJobs } from '../hooks/useJobs';
import { useProjects } from '../hooks/useProjects';
import type { Job } from '@shared/schema';

const statusIcons = {
  queued: Clock,
  running: TrendingUp,
  done: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  queued: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800", 
  done: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const { data: jobs = [] } = useJobs();
  const { data: projects = [] } = useProjects();
  const [unreadCount, setUnreadCount] = useState(0);

  // Get recent simulation requests (last 10, sorted by date)
  const recentRequests = React.useMemo(() => {
    return jobs
      .slice() // Create copy to avoid mutation
      .sort((a, b) => new Date(b.dateRequest).getTime() - new Date(a.dateRequest).getTime())
      .slice(0, 10)
      .map(job => {
        const project = projects.find(p => p.id === job.projectId);
        return {
          ...job,
          projectName: project?.name || 'Unknown Project'
        };
      });
  }, [jobs, projects]);

  // Calculate unread notifications (could be based on new requests in last 24h)
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const newRequests = recentRequests.filter(request => 
      new Date(request.dateRequest) > yesterday
    );
    
    setUnreadCount(newRequests.length);
  }, [recentRequests]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className="h-3 w-3" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Recent Simulation Requests</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {recentRequests.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <div>No simulation requests yet</div>
              <div className="text-xs mt-1">Requests will appear here when created</div>
            </div>
          </DropdownMenuItem>
        ) : (
          recentRequests.map((request) => (
            <DropdownMenuItem key={request.id} className="p-0" asChild>
              <a 
                href={`/projects/${request.projectId}`} 
                className="w-full p-3 hover:bg-gray-50 cursor-pointer block no-underline text-inherit"
              >
                <div className="flex items-start justify-between space-x-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {request.simulationName}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(request.status)}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${statusColors[request.status as keyof typeof statusColors]}`}
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>📁 {request.projectName}</div>
                      <div>🔧 {request.bench} • {request.type}</div>
                      <div className="flex items-center justify-between">
                        <span>👤 System User</span> {/* Placeholder for owner */}
                        <div className="flex items-center space-x-2">
                          <span>🚨 P{request.priority}</span>
                          <span>{formatDate(request.dateRequest)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        💡 Click to view project details
                      </div>
                    </div>
                    
                    {request.dateDue && (
                      <div className="text-xs text-orange-600 mt-1">
                        📅 Due: {new Date(request.dateDue).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a 
            href="/dashboard" 
            className="text-center text-sm text-blue-600 hover:text-blue-800 w-full block py-2"
          >
            📊 View All Requests
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 