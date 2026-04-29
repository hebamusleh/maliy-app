/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Error Handling Utilities
 * Centralized error handling for the application
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Handle API errors consistently
 */
export async function handleApiError(
  response: Response,
): Promise<ErrorResponse> {
  try {
    const data = await response.json();
    return {
      error: data.error || `خطأ ${response.status}`,
      code: data.code,
      details: data,
    };
  } catch {
    return {
      error: `خطأ في الخادم (${response.status})`,
      code: `HTTP_${response.status}`,
    };
  }
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Hide technical details in production
    if (process.env.NODE_ENV === "production") {
      return "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "حدث خطأ غير متوقع";
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        // Exponential backoff
        const backoff = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Network error detection
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed")
    );
  }
  return false;
}

/**
 * Supabase auth error handler
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return "خطأ في المصادقة";

  const message = error.message || error.error_description || error.error || "";

  // Map common auth errors to user-friendly messages
  const errorMap: Record<string, string> = {
    "invalid credentials": "بيانات الدخول غير صحيحة",
    "email not confirmed": "البريد الإلكتروني لم يتم تأكيده بعد",
    "user already exists": "المستخدم موجود بالفعل",
    "password too short": "كلمة المرور قصيرة جداً",
    "over request rate limit": "عدد محاولات كبير جداً. حاول لاحقاً.",
    "invalid email": "البريد الإلكتروني غير صحيح",
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key)) {
      return value;
    }
  }

  return "حدث خطأ في المصادقة. حاول لاحقاً.";
}

/**
 * Validation error handler
 */
export function getValidationErrorMessage(error: any): string {
  if (!error) return "خطأ في التحقق";

  if (error.issues && Array.isArray(error.issues)) {
    const firstIssue = error.issues[0];
    const fieldName = firstIssue.path?.[0] || "حقل";
    return `${fieldName}: ${firstIssue.message}`;
  }

  if (error.message) {
    return error.message;
  }

  return "البيانات المدخلة غير صحيحة";
}

/**
 * Global error logger
 */
export function logError(
  error: unknown,
  context?: string,
  severity: "info" | "warning" | "error" = "error",
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = formatErrorMessage(error);

  const logEntry = {
    timestamp,
    severity,
    context,
    message: errorMessage,
    details: error instanceof Error ? error.stack : error,
  };

  // Log to console
  const consoleMethod =
    severity === "error"
      ? console.error
      : severity === "warning"
        ? console.warn
        : console.log;
  consoleMethod("[ماليّ]", logEntry);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: sendToErrorTracker(logEntry);
  }
}
