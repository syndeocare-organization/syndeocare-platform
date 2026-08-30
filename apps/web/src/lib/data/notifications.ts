import "server-only";

import { createClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return error ? 0 : count ?? 0;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    body: item.body,
    readAt: item.read_at,
    createdAt: item.created_at,
  }));
}
