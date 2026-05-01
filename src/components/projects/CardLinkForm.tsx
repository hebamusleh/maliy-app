"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import type { CardNetwork, CardType, LinkCardForm } from "@/types/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CARD_NETWORKS: CardNetwork[] = ["Visa", "Mastercard", "Mada", "Amex", "Other"];
const NETWORK_ICONS: Record<CardNetwork, string> = {
  Visa: "💳",
  Mastercard: "🔴",
  Mada: "🟢",
  Amex: "🔵",
  Other: "💳",
};

const CURRENT_YEAR = new Date().getFullYear();

const cardLinkSchema = z.object({
  last4: z.string().regex(/^\d{4}$/, "يجب أن تكون 4 أرقام"),
  project_id: z.string(),
  cardholder_name: z.string().optional(),
  expiry_month: z
    .union([z.number().int().min(1).max(12), z.nan(), z.undefined()])
    .optional(),
  expiry_year: z
    .union([z.number().int().min(CURRENT_YEAR), z.nan(), z.undefined()])
    .optional(),
  bank_name: z.string().optional(),
  card_network: z.enum(["Visa", "Mastercard", "Mada", "Amex", "Other"]).optional(),
  card_type: z.enum(["credit", "debit"]).optional(),
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
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<LinkCardForm>({
    resolver: zodResolver(cardLinkSchema),
    defaultValues: { card_type: "credit" },
  });

  const selectedNetwork = watch("card_network");
  const selectedType = watch("card_type");

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
      <h3 className="text-lg font-heading font-bold mb-5">ربط بطاقة مصرفية</h3>

      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
        aria-label="نموذج ربط بطاقة"
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
                className="flex-1 py-2 rounded-xl text-[13px] font-heading font-semibold transition-all"
                style={{
                  background: selectedType === t ? "var(--ink)" : "var(--paper-3)",
                  color: selectedType === t ? "var(--amber-2)" : "var(--ink)",
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
                onClick={() => setValue("card_network", net)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-heading transition-all"
                style={{
                  background: selectedNetwork === net ? "var(--ink)" : "var(--paper-3)",
                  color: selectedNetwork === net ? "var(--amber-2)" : "var(--ink)",
                  border: "1px solid var(--line)",
                }}
              >
                <span>{NETWORK_ICONS[net]}</span>
                {net}
              </button>
            ))}
          </div>
        </div>

        {/* Last 4 digits */}
        <Input
          label="آخر 4 أرقام من البطاقة *"
          {...register("last4")}
          placeholder="1234"
          error={errors.last4?.message}
          inputMode="numeric"
          maxLength={4}
        />

        {/* Cardholder name */}
        <div>
          <label style={labelStyle}>اسم حامل البطاقة</label>
          <input
            {...register("cardholder_name")}
            style={inputStyle}
            placeholder="محمد عبدالله"
            dir="auto"
          />
        </div>

        {/* Expiry */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>شهر الانتهاء</label>
            <input
              type="number"
              {...register("expiry_month", { valueAsNumber: true })}
              style={inputStyle}
              placeholder="MM"
              min={1}
              max={12}
              dir="ltr"
            />
            {errors.expiry_month && (
              <p className="mt-1 text-xs text-red-600">{errors.expiry_month.message as string}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>سنة الانتهاء</label>
            <input
              type="number"
              {...register("expiry_year", { valueAsNumber: true })}
              style={inputStyle}
              placeholder="YYYY"
              min={CURRENT_YEAR}
              dir="ltr"
            />
            {errors.expiry_year && (
              <p className="mt-1 text-xs text-red-600">{errors.expiry_year.message as string}</p>
            )}
          </div>
        </div>

        {/* Bank name */}
        <div>
          <label style={labelStyle}>اسم البنك</label>
          <input
            {...register("bank_name")}
            style={inputStyle}
            placeholder="مثال: الراجحي، الأهلي، رياض..."
            dir="rtl"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
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
