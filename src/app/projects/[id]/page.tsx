"use client";

import CardLinkForm from "@/components/projects/CardLinkForm";
import ProjectDashboard from "@/components/projects/ProjectDashboard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CardLink, LinkCardForm, Project, Transaction } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const projectId = params.id;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
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
      if (!response.ok) throw new Error("Failed to fetch card links");
      const data = await response.json();
      return data.cardLinks as CardLink[];
    },
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/dashboard`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
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
      const error = await response.json();
      throw new Error(error.error || "Failed to link card");
    }

    setShowLinkForm(false);
    refetchCards();
  };

  if (projectLoading || dashboardLoading) return <div>جاري التحميل...</div>;
  if (!project) return <div>المشروع غير موجود</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <span className="text-3xl mr-3">{project.icon}</span>
          <div>
            <h1 className="text-3xl font-heading font-bold">{project.name}</h1>
            <p className="text-gray-600 capitalize">{project.type}</p>
            {project.budget_limit && (
              <p className="text-sm text-gray-500">
                حد الميزانية: {project.budget_limit} ريال
              </p>
            )}
          </div>
        </div>
        <Link href="/projects">
          <Button variant="secondary">العودة للمشاريع</Button>
        </Link>
      </div>

      {/* Dashboard */}
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
            <div>جاري التحميل...</div>
          ) : (
            <div className="space-y-2">
              {cardLinks?.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <span className="font-mono">**** **** **** {link.last4}</span>
                  <span className="text-sm text-gray-500">مربوطة</span>
                </div>
              ))}
              {cardLinks?.length === 0 && (
                <p className="text-gray-500">لا توجد بطاقات مربوطة</p>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button onClick={() => setShowLinkForm(true)}>
              ربط بطاقة جديدة
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-heading font-bold mb-4">
            المعاملات الأخيرة
          </h2>
          <div className="space-y-2">
            {dashboardData?.recent_transactions
              .slice(0, 5)
              .map((transaction: Transaction) => (
                <div
                  key={transaction.id}
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
                    className={`font-bold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toFixed(2)} {transaction.currency}
                  </div>
                </div>
              ))}
            {(!dashboardData?.recent_transactions ||
              dashboardData.recent_transactions.length === 0) && (
              <p className="text-gray-500 text-center py-4">
                لا توجد معاملات بعد
              </p>
            )}
          </div>
        </Card>
      </div>

      {showLinkForm && (
        <div className="mt-6">
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
