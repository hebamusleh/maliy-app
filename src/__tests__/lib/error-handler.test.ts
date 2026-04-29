import {
  AppError,
  formatErrorMessage,
  isNetworkError,
  getAuthErrorMessage,
} from "@/lib/error-handler";

describe("AppError", () => {
  it("creates an error with message and code", () => {
    const error = new AppError("خطأ في الشبكة", "NETWORK_ERROR", 500);
    expect(error.message).toBe("خطأ في الشبكة");
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("AppError");
  });
});

describe("formatErrorMessage", () => {
  it("returns AppError message directly", () => {
    const error = new AppError("رسالة مخصصة");
    expect(formatErrorMessage(error)).toBe("رسالة مخصصة");
  });

  it("returns Error message in development", () => {
    const error = new Error("خطأ عام");
    expect(formatErrorMessage(error)).toBe("خطأ عام");
  });

  it("returns string error as-is", () => {
    expect(formatErrorMessage("خطأ نصي")).toBe("خطأ نصي");
  });

  it("returns fallback for unknown error", () => {
    expect(formatErrorMessage(null)).toBe("حدث خطأ غير متوقع");
    expect(formatErrorMessage(undefined)).toBe("حدث خطأ غير متوقع");
    expect(formatErrorMessage(42)).toBe("حدث خطأ غير متوقع");
  });
});

describe("isNetworkError", () => {
  it("detects Failed to fetch errors", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("detects Network request failed errors", () => {
    expect(isNetworkError(new TypeError("Network request failed"))).toBe(true);
  });

  it("returns false for non-network errors", () => {
    expect(isNetworkError(new Error("some other error"))).toBe(false);
    expect(isNetworkError("string error")).toBe(false);
  });
});

describe("getAuthErrorMessage", () => {
  it("returns fallback for null error", () => {
    expect(getAuthErrorMessage(null)).toBe("خطأ في المصادقة");
  });

  it("maps invalid credentials error", () => {
    expect(getAuthErrorMessage({ message: "invalid credentials" })).toBe(
      "بيانات الدخول غير صحيحة",
    );
  });

  it("maps invalid email error", () => {
    expect(getAuthErrorMessage({ message: "invalid email" })).toBe(
      "البريد الإلكتروني غير صحيح",
    );
  });

  it("returns generic message for unknown auth error", () => {
    expect(getAuthErrorMessage({ message: "unknown_error_code" })).toBe(
      "حدث خطأ في المصادقة. حاول لاحقاً.",
    );
  });
});
