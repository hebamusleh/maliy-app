"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ReviewQueue from "@/components/review/ReviewQueue";

async function classifyBulk(): Promise<{
  classified_count: number;
  still_pending_count: number;
}> {
  const res = await fetch("/api/transactions/classify-bulk", { method: "POST" });
  if (!res.ok) throw new Error("Bulk classification failed");
  return res.json();
}

export default function ReviewPage() {
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: classifyBulk,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (data.classified_count > 0) {
        toast.success(`صُنِّف تلقائياً ${data.classified_count} معاملة`);
      } else {
        toast("لم توجد معاملات بثقة كافية للتصنيف التلقائي", { icon: "ℹ️" });
      }
    },
    onError: () => {
      toast.error("فشل التصنيف الذكي");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold" style={{ color: "var(--ink)" }}>
            مراجعة المعاملات
          </h1>
          <p className="text-[13px] opacity-60 mt-0.5" style={{ color: "var(--ink)" }}>
            صنّف معاملاتك غير المصنّفة للحصول على تقارير دقيقة
          </p>
        </div>

        <button
          onClick={() => bulkMutation.mutate()}
          disabled={bulkMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-heading font-semibold transition-all active:scale-95 disabled:opacity-60"
          style={{ background: "var(--ink)", color: "var(--amber-2)" }}
        >
          {bulkMutation.isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              جارٍ التصنيف...
            </>
          ) : (
            <>
              <span>✨</span>
              تصنيف ذكي للكل
            </>
          )}
        </button>
      </div>

      {/* Review queue */}
      <ReviewQueue />
    </div>
  );
}
