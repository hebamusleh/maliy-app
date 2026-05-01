import { supabase } from "./supabase";

export interface UserSettings {
  base_currency: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  base_currency: "SAR",
};

/** Fetch user settings. Falls back to defaults if the row doesn't exist. */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data } = await supabase
    .from("user_settings")
    .select("base_currency")
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? DEFAULT_SETTINGS;
}

/** Upsert user settings (creates the row if missing). */
export async function saveUserSettings(
  userId: string,
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("base_currency")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save settings");
  return data;
}
