"use client";

import CardLinkForm from "@/components/projects/CardLinkForm";
import { DashboardSkeleton } from "@/components/loading/SkeletonLoaders";
import { InlineLoading } from "@/components/loading/LoadingSpinner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CardLink, LinkCardForm, Project, Transaction } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

// T031: Lazy-load the dashboard (contains heavy Recharts bundle)
const ProjectDashboard = dynamic(
  () => import("@/components/projects/ProjectDashboard"),
  { loading: () => <DashboardSkeleton /> },
);

const PROJECT_TYPE_LABELS: Record<string, string> = {
  personal: "شخصي",
  business: "تجاري",
  freelance: "فريلانس",
};

interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const projectId = params.id;

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("فشل في تحميل المشروع");
      const data = await response.json();
      return data.project as Project;
    },
  });

  const {
    data: cardLinks,
    isLoading: cardsLoading,
    refetch: refetchCards,
  } = useQuery({
    queryKey: ["cardLinks", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/cards`);
      if (!response.ok) throw new Error("فشل في تحميل البطاقات");
      const data = await response.json();
      return data.cardLinks as CardLink[];
    },
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["dashboard", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/dashboard`);
      if (!response.ok) throw new Error("فشل في تحميل بيانات اللوحة");
      return await response.json();
    },
  });

  const handleLinkCard = async (data: LinkCardForm) => {
    const response = await fetch(`/api/projects/${projectId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "فشل في ربط البطاقة");
    }

    setShowLinkForm(false);
    refetchCards();
  };

  if (projectLoading) return <DashboardSkeleton />;

  if (projectError || !project) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700"
      >
        <p className="font-medium">
          {projectError instanceof Error
            ? projectError.message
            : "المشروع غير موجود"}
        </p>
        <Link href="/projects">
          <Button variant="secondary" className="mt-3">
            العودة للمشاريع
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            {project.icon}
          </span>
          <div>
            <h1 className="text-3xl font-heading font-bold">{project.name}</h1>
            <p className="text-gray-600">
              {PROJECT_TYPE_LABELS[project.type] ?? project.type}
            </p>
            {project.budget_limit && (
              <p className="text-sm text-gray-500">
                حد الميزانية:{" "}
                <span className="font-numbers">{project.budget_limit}</span> ريال
              </p>
            )}
          </div>
        </div>
        <Link href="/projects">
          <Button variant="secondary">العودة للمشاريع</Button>
        </Link>
      </div>

      {/* Dashboard */}
      {dashboardLoading && <DashboardSkeleton />}
      {dashboardError && (
        <div
          role="alert"
          className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm"
        >
          تعذّر تحميل بيانات اللوحة. يرجى تحديث الصفحة.
        </div>
      )}
      {dashboardData && (
        <div className="mb-8">
          <ProjectDashboard
            stats={dashboardData.stats}
            transactions={dashboardData.recent_transactions}
            insights={dashboardData.insights}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-heading font-bold mb-4">
            البطاقات المربوطة
          </h2>

          {cardsLoading ? (
            <InlineLoading message="جاري تحميل البطاقات..." />
          ) : (
            <div
              className="space-y-2"
              role="list"
              aria-label="قائمة البطاقات المربوطة"
            >
              {cardLinks?.map((link) => (
                <div
                  key={link.id}
                  role="listitem"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <span className="font-mono" aria-label={`بطاقة تنتهي بـ ${link.last4}`}>
                    **** **** **** {link.last4}
                  </span>
                  <span className="text-sm text-gray-500">مربوطة</span>
                </div>
              ))}
              {cardLinks?.length === 0 && (
                <p className="text-gray-500" role="status">
                  لا توجد بطاقات مربوطة
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button
              onClick={() => setShowLinkForm(true)}
              aria-label="ربط بطاقة بنكية جديدة بهذا المشروع"
            >
              ربط بطاقة جديدة
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-heading font-bold mb-4">
            المعاملات الأخيرة
          </h2>
          <div
            className="space-y-2"
            role="list"
            aria-label="المعاملات الأخيرة"
          >
            {dashboardData?.recent_transactions
              .slice(0, 5)
              .map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  role="listitem"
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                >
                  <div>
                    <div className="font-medium">
                      {transaction.merchant || "معاملة"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <div
                    className={`font-bold font-numbers ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                    aria-label={`${transaction.amount > 0 ? "دخل" : "مصروف"}: ${Math.abs(transaction.amount).toFixed(2)} ${transaction.currency}`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toFixed(2)} {transaction.currency}
                  </div>
                </div>
              ))}
            {(!dashboardData?.recent_transactions ||
              dashboardData.recent_transactions.length === 0) && (
              <p className="text-gray-500 text-center py-4" role="status">
                لا توجد معاملات بعد
              </p>
            )}
          </div>
        </Card>
      </div>

      {showLinkForm && (
        <div
          className="mt-6"
          role="dialog"
          aria-modal="true"
          aria-label="نموذج ربط بطاقة"
        >
          <CardLinkForm
            projectId={projectId}
            onSubmit={handleLinkCard}
            onCancel={() => setShowLinkForm(false)}
          />
        </div>
      )}
    </div>
  );
}
