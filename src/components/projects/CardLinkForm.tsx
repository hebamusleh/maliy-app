"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { LinkCardForm } from "@/types/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const cardLinkSchema = z.object({
  last4: z.string().regex(/^\d{4}$/, "يجب أن تكون 4 أرقام"),
  project_id: z.string(),
});

interface CardLinkFormProps {
  projectId: string;
  onSubmit: (data: LinkCardForm) => Promise<void>;
  onCancel: () => void;
}

export default function CardLinkFormComponent({
  projectId,
  onSubmit,
  onCancel,
}: CardLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LinkCardForm>({
    resolver: zodResolver(cardLinkSchema),
  });

  const onFormSubmit = async (data: LinkCardForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...data, project_id: projectId });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-heading font-bold mb-4">ربط بطاقة مصرفية</h3>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="آخر 4 أرقام من البطاقة"
          {...register("last4")}
          placeholder="1234"
          error={errors.last4?.message}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الربط..." : "ربط البطاقة"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}
