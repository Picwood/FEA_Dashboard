import { Card, CardContent } from "@/components/ui/card";
import { useJobs } from "../hooks/useJobs";
import { Play, Clock, Check, AlertTriangle } from "lucide-react";

export default function StatsCards() {
  const { data: allJobs = [] } = useJobs();
  
  const stats = {
    active: allJobs.filter(job => job.status === "running").length,
    queued: allJobs.filter(job => job.status === "queued").length,
    completed: allJobs.filter(job => job.status === "done").length,
    failed: allJobs.filter(job => job.status === "failed").length,
  };

  const cards = [
    {
      title: "Active Jobs",
      value: stats.active,
      icon: Play,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      change: "+8%",
      changeColor: "text-green-600",
    },
    {
      title: "Queued",
      value: stats.queued,
      icon: Clock,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      change: "0%",
      changeColor: "text-orange-600",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: Check,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      change: "+12%",
      changeColor: "text-green-600",
    },
    {
      title: "Failed",
      value: stats.failed,
      icon: AlertTriangle,
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      change: "+2%",
      changeColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-sm border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.iconColor} h-5 w-5`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`${card.changeColor} font-medium`}>{card.change}</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
