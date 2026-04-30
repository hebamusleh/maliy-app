import { supabase } from "./supabase";

export async function getRequestUser(): Promise<{ id: string }> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch {
    // Auth unavailable — fall through to anonymous user
  }
  return { id: "anon-user" };
}
