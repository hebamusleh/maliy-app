"use client";

import ProjectForm from "@/components/projects/ProjectForm";
import { ProjectListSkeleton } from "@/components/loading/SkeletonLoaders";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CreateProjectForm, Project } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  personal: "شخصي",
  business: "تجاري",
  freelance: "فريلانس",
};

export default function ProjectsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("فشل في تحميل المشاريع");
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
      const err = await response.json();
      throw new Error(err.error || "فشل في إنشاء المشروع");
    }

    setShowCreateForm(false);
    refetch();
  };

  if (isLoading) return <ProjectListSkeleton />;

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700"
      >
        <p className="font-medium">حدث خطأ</p>
        <p className="text-sm mt-1">
          {error instanceof Error ? error.message : "فشل في تحميل المشاريع"}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-sm underline hover:no-underline"
        >
          حاول مرة أخرى
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">مشاريعي</h1>
        <Button onClick={() => setShowCreateForm(true)} aria-label="إنشاء مشروع جديد">
          إنشاء مشروع جديد
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6" role="dialog" aria-modal="true" aria-label="نموذج إنشاء مشروع">
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label="قائمة المشاريع"
      >
        {data?.map((project) => (
          <div key={project.id} role="listitem">
            <Link href={`/projects/${project.id}`} aria-label={`فتح مشروع ${project.name}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-amber">
                <div className="flex items-center mb-2">
                  <span className="text-2xl ms-2" aria-hidden="true">
                    {project.icon}
                  </span>
                  <h3 className="text-lg font-heading font-semibold">
                    {project.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {PROJECT_TYPE_LABELS[project.type] ?? project.type}
                </p>
                {project.budget_limit && (
                  <p className="text-sm text-gray-600">
                    حد الميزانية:{" "}
                    <span className="font-numbers">{project.budget_limit}</span>{" "}
                    ريال
                  </p>
                )}
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {data?.length === 0 && (
        <div className="text-center py-12" role="status" aria-live="polite">
          <p className="text-gray-500 mb-4">لا توجد مشاريع بعد</p>
          <Button onClick={() => setShowCreateForm(true)}>
            إنشاء مشروعك الأول
          </Button>
        </div>
      )}
    </div>
  );
}
