"use client";

/**
 * Loading Spinner Component
 */

export function LoadingSpinner({ message = "" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-25 animate-ping" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-75 animate-spin" />
        <div className="absolute inset-2 bg-white rounded-full" />
      </div>
      {message && (
        <p className="mt-4 text-gray-600 font-medium text-center">{message}</p>
      )}
    </div>
  );
}

/**
 * Overlay Loading Spinner
 */
export function LoadingOverlay({
  visible = false,
  message = "",
}: {
  visible?: boolean;
  message?: string;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm">
        <LoadingSpinner message={message} />
      </div>
    </div>
  );
}

/**
 * Page Loading Indicator
 */
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner message="جاري التحميل..." />
    </div>
  );
}

/**
 * Inline Loading State
 */
export function InlineLoading({
  message = "جاري التحميل...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-8 justify-center">
      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
      <div
        className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      />
      <span className="mr-2 text-gray-600">{message}</span>
    </div>
  );
}
