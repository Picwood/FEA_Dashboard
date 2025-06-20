import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ChartLine, 
  Plus, 
  Box, 
  FolderOpen, 
  Settings, 
  Cog, 
  User, 
  LogOut 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "New Request", href: "/new", icon: Plus },
  { name: "3D Viewer", href: "/viewer", icon: Box },
  { name: "File Manager", href: "/files", icon: FolderOpen },
];

export default function Sidebar() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Cog className="text-primary-foreground w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">FEA Dashboard</h1>
            <p className="text-xs text-muted-foreground">Suspension Analysis</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary rounded-r-none"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
          
          <div className="border-t border-sidebar-border mt-6 pt-6">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="text-muted-foreground w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground">FEA Engineer</p>
            <p className="text-xs text-muted-foreground">engineer@company.com</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
