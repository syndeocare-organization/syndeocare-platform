import "server-only";

import type { Viewer } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ConversationSummary = {
  id: string;
  shiftTitle: string;
  updatedAt: string;
  participantNames: string[];
  latestMessage: string | null;
  latestMessageAt: string | null;
  unread: boolean;
};

export type ConversationMessage = {
  id: string;
  authorId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
};

export type MessagingData = {
  conversations: ConversationSummary[];
  selectedId: string | null;
  messages: ConversationMessage[];
};

export async function getMessagingData(viewer: Viewer, requestedId?: string): Promise<MessagingData> {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("user_id", viewer.id);
  if (error || !memberships?.length) return { conversations: [], selectedId: null, messages: [] };

  const ids = memberships.map((membership) => membership.conversation_id);
  const [conversationResult, memberResult, latestResult] = await Promise.all([
    supabase.from("conversations").select("id, updated_at, shifts(title)").in("id", ids).order("updated_at", { ascending: false }),
    supabase.from("conversation_members").select("conversation_id, user_id, profiles(full_name)").in("conversation_id", ids),
    supabase.from("messages").select("id, conversation_id, body, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(250),
  ]);

  const latestByConversation = new Map<string, { body: string; createdAt: string }>();
  for (const message of latestResult.data ?? []) {
    if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, { body: message.body, createdAt: message.created_at });
  }
  const readByConversation = new Map(memberships.map((membership) => [membership.conversation_id, membership.last_read_at]));
  const namesByConversation = new Map<string, string[]>();
  for (const member of memberResult.data ?? []) {
    if (member.user_id === viewer.id) continue;
    const relation = member.profiles as { full_name: string | null } | Array<{ full_name: string | null }> | null;
    const profile = Array.isArray(relation) ? relation[0] : relation;
    const names = namesByConversation.get(member.conversation_id) ?? [];
    names.push(profile?.full_name ?? "SyndeoCare");
    namesByConversation.set(member.conversation_id, names);
  }

  const orderedConversations = conversationResult.data ?? [];
  const selectedId = requestedId && ids.includes(requestedId) ? requestedId : orderedConversations[0]?.id ?? null;
  const conversations: ConversationSummary[] = orderedConversations.map((conversation) => {
    const shiftRelation = conversation.shifts as { title: string } | Array<{ title: string }> | null;
    const shift = Array.isArray(shiftRelation) ? shiftRelation[0] : shiftRelation;
    const latest = latestByConversation.get(conversation.id);
    const lastRead = readByConversation.get(conversation.id);
    return {
      id: conversation.id,
      shiftTitle: shift?.title ?? "SyndeoCare conversation",
      updatedAt: conversation.updated_at,
      participantNames: namesByConversation.get(conversation.id) ?? [],
      latestMessage: latest?.body ?? null,
      latestMessageAt: latest?.createdAt ?? null,
      unread: conversation.id !== selectedId && Boolean(latest?.createdAt && (!lastRead || latest.createdAt > lastRead)),
    };
  });

  if (!selectedId) return { conversations, selectedId: null, messages: [] };
  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, author_id, body, created_at, profiles(full_name)")
    .eq("conversation_id", selectedId)
    .order("created_at", { ascending: true })
    .limit(250);
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", selectedId)
    .eq("user_id", viewer.id);

  const messages: ConversationMessage[] = (rawMessages ?? []).map((message) => {
    const relation = message.profiles as { full_name: string | null } | Array<{ full_name: string | null }> | null;
    const profile = Array.isArray(relation) ? relation[0] : relation;
    return { id: message.id, authorId: message.author_id, authorName: profile?.full_name ?? "SyndeoCare", body: message.body, createdAt: message.created_at };
  });
  return { conversations, selectedId, messages };
}
