"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import type { CardNetwork, CardType, CreateProjectForm } from "@/types/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CARD_NETWORKS: CardNetwork[] = ["Visa", "Mastercard", "Mada", "Amex", "Other"];
const CURRENT_YEAR = new Date().getFullYear();

const projectSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  icon: z.string().min(1, "الأيقونة مطلوبة"),
  type: z.enum(["personal", "business", "freelance"]),
  card_last4: z
    .union([z.string().regex(/^\d{4}$/, "أدخل آخر 4 أرقام من البطاقة"), z.literal(""), z.undefined()])
    .optional(),
  card_cardholder_name: z.string().optional(),
  card_expiry_month: z
    .union([z.number().int().min(1).max(12), z.nan(), z.undefined()])
    .optional(),
  card_expiry_year: z
    .union([z.number().int().min(CURRENT_YEAR), z.nan(), z.undefined()])
    .optional(),
  card_bank_name: z.string().optional(),
  card_network: z.enum(["Visa", "Mastercard", "Mada", "Amex", "Other"]).optional(),
  card_type: z.enum(["credit", "debit"]).optional(),
});

interface ProjectFormProps {
  onSubmit: (data: CreateProjectForm) => Promise<void>;
  onCancel: () => void;
  initialValues?: Partial<CreateProjectForm>;
}

export default function ProjectForm({ onSubmit, onCancel, initialValues }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCardSection, setShowCardSection] = useState(
    !!(initialValues?.card_last4)
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { card_type: "credit", ...initialValues },
  });

  const selectedType = watch("type");
  const selectedNetwork = watch("card_network");
  const selectedCardType = watch("card_type");

  const onFormSubmit = async (data: CreateProjectForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Clear card fields if section is hidden
      if (!showCardSection) {
        data.card_last4 = undefined;
        data.card_cardholder_name = undefined;
        data.card_expiry_month = undefined;
        data.card_expiry_year = undefined;
        data.card_bank_name = undefined;
        data.card_network = undefined;
        data.card_type = undefined;
      }
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const icons = ["💼", "🏠", "💻", "📊", "🎯", "💰"];

  const inputStyle = {
    background: "var(--paper-3)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
  } as const;

  const labelStyle = {
    fontSize: 11,
    fontFamily: "var(--font-heading)",
    color: "var(--ink)",
    opacity: 0.55,
    display: "block",
    marginBottom: 5,
  } as const;

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-heading font-bold mb-4">
        {initialValues ? "تعديل المشروع" : "إنشاء مشروع جديد"}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Project name */}
        <Input
          label="اسم المشروع"
          {...register("name")}
          error={errors.name?.message}
        />

        {/* Icon picker */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">الأيقونة</label>
          <div className="grid grid-cols-6 gap-2" role="list">
            {icons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue("icon", icon)}
                aria-pressed={watch("icon") === icon}
                aria-label={`اختر الأيقونة ${icon}`}
                className={`p-2 border rounded-md hover:bg-gray-100 ${
                  watch("icon") === icon ? "border-amber bg-amber/10" : "border-gray-300"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {errors.icon && <p className="mt-1 text-sm text-red-600">{errors.icon.message}</p>}
        </div>

        {/* Project type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">نوع المشروع</label>
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
                  className="me-2"
                  aria-checked={selectedType === value}
                />
                {label}
              </label>
            ))}
          </div>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>

        {/* Card section toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowCardSection((v) => !v)}
            className="flex items-center gap-2 text-[13px] font-heading font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--ink)" }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
              style={{
                background: showCardSection ? "var(--ink)" : "var(--paper-3)",
                color: showCardSection ? "var(--amber-2)" : "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              {showCardSection ? "−" : "+"}
            </span>
            ربط بطاقة مصرفية {showCardSection ? "" : "(اختياري)"}
          </button>
        </div>

        {/* Card fields */}
        {showCardSection && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "var(--paper-3)", border: "1px solid var(--line)" }}
          >
            {/* Card type toggle */}
            <div>
              <label style={labelStyle}>نوع البطاقة</label>
              <div className="flex gap-2">
                {(["credit", "debit"] as CardType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("card_type", t)}
                    className="flex-1 py-1.5 rounded-xl text-[12px] font-heading font-semibold transition-all"
                    style={{
                      background: selectedCardType === t ? "var(--ink)" : "var(--paper)",
                      color: selectedCardType === t ? "var(--amber-2)" : "var(--ink)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {t === "credit" ? "ائتماني" : "مدين"}
                  </button>
                ))}
              </div>
            </div>

            {/* Network picker */}
            <div>
              <label style={labelStyle}>شبكة البطاقة</label>
              <div className="flex gap-2 flex-wrap">
                {CARD_NETWORKS.map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() =>
                      setValue("card_network", selectedNetwork === net ? undefined : net)
                    }
                    className="px-2.5 py-1 rounded-lg text-[12px] font-heading transition-all"
                    style={{
                      background: selectedNetwork === net ? "var(--ink)" : "var(--paper)",
                      color: selectedNetwork === net ? "var(--amber-2)" : "var(--ink)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            {/* Last 4 digits */}
            <div>
              <label style={labelStyle}>آخر 4 أرقام *</label>
              <input
                {...register("card_last4")}
                style={inputStyle}
                placeholder="1234"
                inputMode="numeric"
                maxLength={4}
                dir="ltr"
              />
              {errors.card_last4 && (
                <p className="mt-1 text-xs text-red-600">{errors.card_last4.message}</p>
              )}
            </div>

            {/* Cardholder name */}
            <div>
              <label style={labelStyle}>اسم حامل البطاقة</label>
              <input
                {...register("card_cardholder_name")}
                style={inputStyle}
                placeholder="محمد عبدالله"
                dir="auto"
              />
            </div>

            {/* Expiry */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label style={labelStyle}>شهر الانتهاء</label>
                <input
                  type="number"
                  {...register("card_expiry_month", { valueAsNumber: true })}
                  style={inputStyle}
                  placeholder="MM"
                  min={1}
                  max={12}
                  dir="ltr"
                />
              </div>
              <div>
                <label style={labelStyle}>سنة الانتهاء</label>
                <input
                  type="number"
                  {...register("card_expiry_year", { valueAsNumber: true })}
                  style={inputStyle}
                  placeholder="YYYY"
                  min={CURRENT_YEAR}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Bank name */}
            <div>
              <label style={labelStyle}>اسم البنك</label>
              <input
                {...register("card_bank_name")}
                style={inputStyle}
                placeholder="الراجحي، الأهلي، رياض..."
                dir="rtl"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الحفظ..." : initialValues ? "حفظ التعديلات" : "إنشاء"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}
