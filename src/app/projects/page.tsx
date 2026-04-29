"use client";

import ProjectForm from "@/components/projects/ProjectForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CreateProjectForm, Project } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

export default function ProjectsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      return data.projects as Project[];
    },
  });

  const handleCreateProject = async (formData: CreateProjectForm) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create project");
    }

    setShowCreateForm(false);
    refetch();
  };

  if (isLoading) return <div>جاري التحميل...</div>;
  if (error) return <div>خطأ: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">مشاريعي</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          إنشاء مشروع جديد
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{project.icon}</span>
                <h3 className="text-lg font-heading font-semibold">
                  {project.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 capitalize">{project.type}</p>
              {project.budget_limit && (
                <p className="text-sm text-gray-600">
                  حد الميزانية: {project.budget_limit} ريال
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {data?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">لا توجد مشاريع بعد</p>
          <Button onClick={() => setShowCreateForm(true)}>
            إنشاء مشروعك الأول
          </Button>
        </div>
      )}
    </div>
  );
}
