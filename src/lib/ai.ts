/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OpenRouter AI Client
 * Handles communication with OpenRouter API for AI-powered features
 */

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  text: string;
  tokens_used: number;
  model: string;
}

export interface TransactionClassification {
  category: string;
  subcategory: string;
  confidence: number;
  merchant: string;
  description: string;
}

export class OpenRouterAI {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private model = "meta-llama/llama-3-8b-instruct";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      console.warn(
        "OpenRouter API key not configured. AI features will be disabled.",
      );
    }
  }

  private async makeRequest(
    endpoint: string,
    body: Record<string, any>,
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://maliy-app.example.com",
          "X-Title": "ماليّ Financial Management",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("OpenRouter API request failed:", error);
      throw error;
    }
  }

  /**
   * Classify a financial transaction
   */
  async classifyTransaction(
    amount: number,
    merchant: string | null,
    description: string,
  ): Promise<TransactionClassification> {
    if (!this.apiKey) {
      // Fallback classification without AI
      return this.fallbackClassifyTransaction(amount, merchant, description);
    }

    const prompt = `تصنيف المعاملة المالية التالية:
    
المبلغ: ${amount} ريال
التاجر/المتجر: ${merchant || "غير محدد"}
الوصف: ${description}

يرجى تصنيف هذه المعاملة وإرجاع النتيجة بصيغة JSON:
{
  "category": "فئة المعاملة الرئيسية",
  "subcategory": "الفئة الفرعية",
  "confidence": 0.0-1.0,
  "merchant": "اسم التاجر المصحح",
  "description": "وصف المعاملة"
}`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد مالي متخصص في تصنيف المعاملات المالية. رد دائماً بصيغة JSON صحيحة.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices?.[0]?.message?.content || "{}";

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.fallbackClassifyTransaction(amount, merchant, description);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || "أخرى",
        subcategory: parsed.subcategory || "متنوعة",
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        merchant: parsed.merchant || merchant || "غير محدد",
        description: parsed.description || description,
      };
    } catch (error) {
      console.error("Failed to classify transaction with AI:", error);
      return this.fallbackClassifyTransaction(amount, merchant, description);
    }
  }

  /**
   * Generate financial insights for a project
   */
  async generateInsights(
    totalIncome: number,
    totalExpenses: number,
    transactionCount: number,
    topCategories: Array<{ category: string; amount: number }>,
  ): Promise<string[]> {
    if (!this.apiKey) {
      return this.fallbackGenerateInsights(
        totalIncome,
        totalExpenses,
        transactionCount,
        topCategories,
      );
    }

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const topCategoriesText = topCategories
      .map((c) => `${c.category}: ${c.amount} ريال`)
      .join("\n");

    const prompt = `تحليل الأداء المالي التالي وتقديم 3-4 رؤى ذكية:

إجمالي الدخل: ${totalIncome} ريال
إجمالي المصروفات: ${totalExpenses} ريال
صافي الربح: ${netProfit} ريال
هامش الربح: ${profitMargin.toFixed(2)}%
عدد المعاملات: ${transactionCount}

أعلى الفئات:
${topCategoriesText}

يرجى تقديم رؤى عملية وقابلة للتطبيق باللغة العربية، كل رؤية في سطر واحد:`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: this.model,
        messages: [
          {
            role: "system",
            content: "أنت محلل مالي متخصص. قدم رؤى عملية وقابلة للتطبيق.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      const content = response.choices?.[0]?.message?.content || "";
      const insights = content
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0 && !line.startsWith("-"))
        .slice(0, 4);

      return insights.length > 0
        ? insights
        : this.fallbackGenerateInsights(
            totalIncome,
            totalExpenses,
            transactionCount,
            topCategories,
          );
    } catch (error) {
      console.error("Failed to generate insights with AI:", error);
      return this.fallbackGenerateInsights(
        totalIncome,
        totalExpenses,
        transactionCount,
        topCategories,
      );
    }
  }

  /**
   * Fallback classification when AI is not available
   */
  private fallbackClassifyTransaction(
    amount: number,
    merchant: string | null,
    description: string,
  ): TransactionClassification {
    let category = "أخرى";
    let subcategory = "متنوعة";

    const text = `${description} ${merchant || ""}`.toLowerCase();

    if (amount > 0) {
      category = "دخل";
      if (text.includes("راتب") || text.includes("salary")) {
        subcategory = "راتب";
      } else if (text.includes("بيع") || text.includes("sale")) {
        subcategory = "مبيعات";
      } else {
        subcategory = "دخل آخر";
      }
    } else {
      if (
        text.includes("طعام") ||
        text.includes("food") ||
        text.includes("مطعم")
      ) {
        category = "الطعام والشراب";
        subcategory = "مطاعم";
      } else if (
        text.includes("نقل") ||
        text.includes("fuel") ||
        text.includes("وقود")
      ) {
        category = "المواصلات";
        subcategory = "الوقود";
      } else if (text.includes("رواتب") || text.includes("salaries")) {
        category = "الرواتب";
        subcategory = "رواتب الموظفين";
      } else if (text.includes("إيجار") || text.includes("rent")) {
        category = "المسكن";
        subcategory = "الإيجار";
      } else {
        category = "مصروفات";
        subcategory = "مصروفات عامة";
      }
    }

    return {
      category,
      subcategory,
      confidence: 0.6,
      merchant: merchant || "غير محدد",
      description,
    };
  }

  /**
   * Fallback insight generation when AI is not available
   */
  private fallbackGenerateInsights(
    totalIncome: number,
    totalExpenses: number,
    transactionCount: number,
    topCategories: Array<{ category: string; amount: number }>,
  ): string[] {
    const insights: string[] = [];
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    if (profitMargin > 50) {
      insights.push("✅ هامش ربحك جيد جداً. استمر في هذا المسار!");
    } else if (profitMargin > 20) {
      insights.push("✅ هامش ربحك معقول. فكر في تقليل المصروفات.");
    } else if (profitMargin > 0) {
      insights.push("⚠️ هامش ربحك منخفض. قد تحتاج لمراجعة نفقاتك.");
    } else {
      insights.push("❌ المصروفات تتجاوز الدخل. اتخذ إجراءات فورية!");
    }

    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      insights.push(
        `📊 أكبر نفقة: ${topCategory.category} بمبلغ ${topCategory.amount} ريال`,
      );
    }

    if (totalExpenses > 0) {
      insights.push(
        `📈 متوسط المعاملة: ${(totalExpenses / transactionCount).toFixed(2)} ريال`,
      );
    }

    return insights;
  }
}

// Export singleton instance
let instance: OpenRouterAI | null = null;

export function getAIClient(): OpenRouterAI {
  if (!instance) {
    instance = new OpenRouterAI();
  }
  return instance;
}
