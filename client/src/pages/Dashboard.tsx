import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import JobsTable from "../components/JobsTable";
import JobDetailModal from "../components/JobDetailModal";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Simulation Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">Monitor and manage FEA simulation jobs</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              
              <Button onClick={() => setLocation("/new")} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <StatsCards />
          <JobsTable onJobSelect={(job) => setSelectedJobId(job.id)} />
        </main>
      </div>

      <JobDetailModal
        jobId={selectedJobId}
        open={selectedJobId !== null}
        onOpenChange={(open) => !open && setSelectedJobId(null)}
      />
    </div>
  );
}
