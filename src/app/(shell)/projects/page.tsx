"use client";

import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import Button from "@/components/ui/Button";
import { CreateProjectForm, Project } from "@/types/project";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";


export default function ProjectsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("فشل في تحميل المشاريع");
      const json = await res.json();
      return json.projects as (Project & { spend?: number; budget_used_pct?: number | null })[];
    },
  });

  const handleCreate = async (formData: CreateProjectForm) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "فشل في إنشاء المشروع");
    }
    setShowCreateForm(false);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleEdit = async (formData: CreateProjectForm) => {
    if (!editingProject) return;
    const res = await fetch(`/api/projects/${editingProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "فشل في تعديل المشروع");
    }
    setEditingProject(null);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "فشل في حذف المشروع");
    }
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } finally {
      setSeedLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: "var(--paper-3)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "var(--paper-3)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-3"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <p className="font-heading font-semibold" style={{ color: "var(--ink)" }}>
          {error instanceof Error ? error.message : "فشل في تحميل المشاريع"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm underline"
          style={{ color: "var(--amber)" }}
        >
          حاول مرة أخرى
        </button>
      </div>
    );
  }

  const projects = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold" style={{ color: "var(--ink)" }}>
          المشاريع
        </h1>
        <Button onClick={() => setShowCreateForm(true)}>
          إنشاء مشروع جديد
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit form */}
      {editingProject && (
        <ProjectForm
          initialValues={editingProject}
          onSubmit={handleEdit}
          onCancel={() => setEditingProject(null)}
        />
      )}

      {/* Empty state */}
      {projects.length === 0 && !showCreateForm && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center gap-4"
          style={{ background: "var(--paper-2)", border: "1px dashed var(--line)" }}
        >
          <span className="text-5xl">📂</span>
          <p className="font-heading font-semibold text-lg" style={{ color: "var(--ink)", opacity: 0.6 }}>
            لا توجد مشاريع بعد
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowCreateForm(true)}>
              إنشاء مشروعك الأول
            </Button>
            <button
              onClick={handleSeed}
              disabled={seedLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-opacity disabled:opacity-50"
              style={{
                border: "1px solid var(--line)",
                color: "var(--ink)",
                background: "var(--paper)",
              }}
            >
              {seedLoading ? "جاري التحميل..." : "إضافة بيانات تجريبية"}
            </button>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(p) => {
                setShowCreateForm(false);
                setEditingProject(p);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Seed button when projects exist */}
      {projects.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSeed}
            disabled={seedLoading}
            className="text-xs underline disabled:opacity-50"
            style={{ color: "var(--ink)", opacity: 0.4 }}
          >
            {seedLoading ? "جاري التحميل..." : "إعادة تحميل البيانات التجريبية"}
          </button>
        </div>
      )}
    </div>
  );
}
