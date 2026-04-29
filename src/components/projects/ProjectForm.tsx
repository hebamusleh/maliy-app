"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { CreateProjectForm } from "@/types/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  icon: z.string().min(1, "الأيقونة مطلوبة"),
  type: z.enum(["personal", "business", "freelance"]),
  budget_limit: z.number().positive().optional(),
});

interface ProjectFormProps {
  onSubmit: (data: CreateProjectForm) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const selectedType = watch("type");

  const onFormSubmit = async (data: CreateProjectForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const icons = ["💼", "🏠", "💻", "📊", "🎯", "💰"];

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-heading font-bold mb-4">إنشاء مشروع جديد</h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="اسم المشروع"
          {...register("name")}
          error={errors.name?.message}
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            الأيقونة
          </label>
          <div className="grid grid-cols-6 gap-2" role="list">
            {icons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue("icon", icon)}
                aria-pressed={watch("icon") === icon}
                aria-label={`اختر الأيقونة ${icon}`}
                className={`p-2 border rounded-md hover:bg-gray-100 ${
                  watch("icon") === icon
                    ? "border-amber bg-amber/10"
                    : "border-gray-300"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {errors.icon && (
            <p className="mt-1 text-sm text-red-600">{errors.icon.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            نوع المشروع
          </label>
          <div className="space-y-2" role="radiogroup" aria-label="نوع المشروع">
            {[
              { value: "personal", label: "شخصي" },
              { value: "business", label: "تجاري" },
              { value: "freelance", label: "فريلانس" },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  value={value}
                  {...register("type")}
                  className="ml-2"
                  aria-checked={selectedType === value}
                />
                {label}
              </label>
            ))}
          </div>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <Input
          label="حد الميزانية (اختياري)"
          type="number"
          {...register("budget_limit", { valueAsNumber: true })}
          error={errors.budget_limit?.message}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإنشاء..." : "إنشاء"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}
