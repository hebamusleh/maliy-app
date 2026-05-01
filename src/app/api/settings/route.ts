export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { getUserSettings, saveUserSettings } from "@/lib/user-settings";
import { SUPPORTED_CURRENCIES } from "@/lib/exchange";

export async function GET() {
  const user = await getRequestUser();
  const settings = await getUserSettings(user.id);
  return Response.json({ settings, supported_currencies: SUPPORTED_CURRENCIES });
}

export async function PATCH(request: Request) {
  const user = await getRequestUser();
  const body = await request.json() as { base_currency?: string };

  if (body.base_currency !== undefined) {
    if (!SUPPORTED_CURRENCIES.includes(body.base_currency)) {
      return Response.json({ error: "عملة غير مدعومة" }, { status: 400 });
    }
  }

  try {
    const updated = await saveUserSettings(user.id, {
      base_currency: body.base_currency,
    });
    return Response.json({ settings: updated });
  } catch (err) {
    return Response.json(
      { error: "فشل حفظ الإعدادات", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
