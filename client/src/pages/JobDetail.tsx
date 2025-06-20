import { useParams } from "wouter";
import { useJob } from "../hooks/useJobs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "../components/Sidebar";
import JobDetailModal from "../components/JobDetailModal";

export default function JobDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const jobId = params.id ? parseInt(params.id) : null;

  const { data: job, isLoading } = useJob(jobId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{job.project}</h2>
                <p className="text-sm text-gray-500">FEA-{job.id.toString().padStart(3, "0")}</p>
              </div>
            </div>
          </div>
        </header>

        <JobDetailModal
          jobId={jobId}
          open={true}
          onOpenChange={(open) => !open && setLocation("/")}
        />
      </div>
    </div>
  );
}
