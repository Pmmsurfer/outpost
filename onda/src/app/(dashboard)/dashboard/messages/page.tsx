"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  mockConversations,
  mockMessagesByConversation,
  type Conversation,
  type Message,
} from "@/lib/messages";
import {
  mockRetreats,
  mockBookings,
  type Booking,
  type Retreat,
} from "@/lib/bookings";
import { supabase } from "@/lib/supabase";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/__([^_]*)__/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const DEFAULT_TEMPLATES = [
  {
    name: "Welcome to the retreat",
    body: "Hi {{guestName}},\n\nWelcome to {{retreatName}}! We're so glad you're joining us.\n\nCheck-in: 3pm on the first day. Please bring your waiver if you haven't signed it yet.\n\nSee you soon!",
  },
  {
    name: "Waiver reminder",
    body: "Hi {{guestName}},\n\nThis is a friendly reminder to sign your waiver before the retreat. You can do so here: [waiver link]\n\nLet us know if you have any questions!",
  },
  {
    name: "See you soon",
    body: "Hi {{guestName}},\n\nWe're just a few days out from {{retreatName}}! Make sure you've packed and have your travel details ready.\n\nSafe travels and see you soon!",
  },
];

/** Templates for the "Message all guests" modal (with [Placeholder] vars). */
const BROADCAST_MODAL_TEMPLATES = [
  {
    name: "Welcome to the retreat",
    subject: "Welcome to [Retreat Name] 🎉",
    body:
      "Hi everyone,\n\nWe're so excited to have you joining us for [Retreat Name] on [Start Date] in [Location].\n\n" +
      "Check-in is at [Check-in Time]. Please make sure you've signed your waiver before arrival.\n\n" +
      "Looking forward to meeting you all!\n\n[Host Name]",
  },
  {
    name: "Waiver reminder",
    subject: "Action needed: Please sign your waiver",
    body:
      "Hi,\n\nJust a quick reminder to sign your waiver before [Retreat Name] begins on [Start Date].\n\n" +
      "You can sign it here: [Waiver Link]\n\nThanks!\n[Host Name]",
  },
  {
    name: "See you soon",
    subject: "See you soon — [Retreat Name]",
    body:
      "Hi everyone,\n\nJust [X days] until [Retreat Name]! Here's what to know before you arrive:\n\n" +
      "• Meeting point: [Meeting Point]\n• Check-in: [Check-in Time]\n• What to bring: [Accommodation Notes]\n\n" +
      "So excited to see you all.\n\n[Host Name]",
  },
];

function MessagesContent() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>(mockMessagesByConversation);
  const [selectedId, setSelectedId] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [retreatFilter, setRetreatFilter] = useState<string>("all");
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastSelectedRetreatIds, setBroadcastSelectedRetreatIds] = useState<string[]>([]);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastTemplateDropdownOpen, setBroadcastTemplateDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [guestDrawerBookingId, setGuestDrawerBookingId] = useState<string | null>(null);
  const [hostNotesByBookingId, setHostNotesByBookingId] = useState<Record<string, string>>({});
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [composeText, setComposeText] = useState("");

  const selected = conversations.find((c) => c.id === selectedId);
  const messages: Message[] = selectedId ? messagesByConv[selectedId] ?? [] : [];

  const retreats = mockRetreats;

  const filteredConversations = useMemo(() => {
    if (retreatFilter === "all") return conversations;
    return conversations.filter((c) => c.retreatId === retreatFilter);
  }, [conversations, retreatFilter]);

  const broadcastGuests = useMemo(() => {
    const ids = broadcastSelectedRetreatIds.filter((id) => id !== "all");
    const useAll = broadcastSelectedRetreatIds.includes("all");
    return mockBookings.filter(
      (b) =>
        b.status !== "cancelled" &&
        (useAll || ids.includes(b.retreatId))
    );
  }, [broadcastSelectedRetreatIds]);

  const broadcastGuestCount = broadcastGuests.length;

  const broadcastRetreatCount = useMemo(() => {
    if (broadcastSelectedRetreatIds.includes("all")) {
      const retreatIds = new Set(mockBookings.filter((b) => b.status !== "cancelled").map((b) => b.retreatId));
      return retreatIds.size;
    }
    return broadcastSelectedRetreatIds.length;
  }, [broadcastSelectedRetreatIds]);

  const broadcastSummaryCopy = useMemo(() => {
    if (broadcastGuestCount === 0) return null;
    if (broadcastSelectedRetreatIds.includes("all") || broadcastRetreatCount > 1) {
      return `This will send to ${broadcastGuestCount} guest${broadcastGuestCount === 1 ? "" : "s"} across ${broadcastRetreatCount} retreat${broadcastRetreatCount === 1 ? "" : "s"}`;
    }
    const retreatId = broadcastSelectedRetreatIds[0];
    const retreat = retreats.find((r) => r.id === retreatId);
    return `This will send to ${broadcastGuestCount} guest${broadcastGuestCount === 1 ? "" : "s"} in ${retreat?.name ?? "retreat"}`;
  }, [broadcastGuestCount, broadcastRetreatCount, broadcastSelectedRetreatIds, retreats]);

  const isRetreatPast = useCallback((r: Retreat) => new Date(r.endDate) < new Date(), []);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread: false } : c))
    );
  }, []);

  const openConversation = useCallback(
    (id: string) => {
      setSelectedId(id);
      markAsRead(id);
    },
    [markAsRead]
  );

  const toggleBroadcastRetreat = useCallback((id: string) => {
    setBroadcastSelectedRetreatIds((prev) => {
      if (id === "all") {
        return prev.includes("all") ? [] : ["all"];
      }
      const next = prev.filter((x) => x !== "all");
      if (next.includes(id)) {
        const n = next.filter((x) => x !== id);
        return n.length === 0 ? [] : n;
      }
      return [...next, id];
    });
  }, []);

  const fillBroadcastTemplate = useCallback(
    (template: (typeof BROADCAST_MODAL_TEMPLATES)[number]) => {
      const retreatIds = broadcastSelectedRetreatIds.filter((x) => x !== "all");
      const singleRetreat = retreatIds.length === 1 ? retreats.find((r) => r.id === retreatIds[0]) : null;
      const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const replace = (text: string) => {
        let t = text;
        if (singleRetreat) {
          t = t
            .replace(/\[Retreat Name\]/g, singleRetreat.name)
            .replace(/\[Start Date\]/g, formatDate(singleRetreat.startDate))
            .replace(/\[X days\]/g, (() => {
              const days = Math.ceil((new Date(singleRetreat.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return `${days} day${days === 1 ? "" : "s"}`;
            })());
        }
        return t.replace(/\[Host Name\]/g, "The Team");
      };
      setBroadcastSubject(replace(template.subject));
      setBroadcastBody(replace(template.body));
      setBroadcastTemplateDropdownOpen(false);
    },
    [broadcastSelectedRetreatIds, retreats]
  );

  const handleBroadcastSend = useCallback(async () => {
    if (broadcastGuestCount === 0 || broadcastSending) return;
    const subject = broadcastSubject.trim();
    const body = broadcastBody.trim();
    setBroadcastSending(true);

    const guests =
      broadcastSelectedRetreatIds.includes("all")
        ? mockBookings.filter((b) => b.status !== "cancelled")
        : mockBookings.filter(
            (b) =>
              b.status !== "cancelled" &&
              broadcastSelectedRetreatIds.includes(b.retreatId)
          );

    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setToast({ message: "You must be signed in to send messages.", type: "error" });
          setBroadcastSending(false);
          return;
        }
        const retreatIdsToQuery = broadcastSelectedRetreatIds.includes("all")
          ? retreats.map((r) => r.id)
          : broadcastSelectedRetreatIds;
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("id, retreat_id, guest_email, guest_name")
          .in("retreat_id", retreatIdsToQuery)
          .neq("status", "cancelled");

        if (bookingsError) throw new Error(bookingsError.message);
        const bookingsList = (bookingsData ?? []) as { id: string; retreat_id: string; guest_email: string; guest_name: string }[];

        const uniqueEmails = Array.from(new Set(bookingsList.map((b) => b.guest_email)));
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email")
          .in("email", uniqueEmails);

        const emailToProfileId = new Map(
          ((profilesData ?? []) as { id: string; email: string }[]).map((p) => [p.email, p.id])
        );

        const inserts = bookingsList
          .filter((b) => emailToProfileId.has(b.guest_email))
          .map((b) => ({
            sender_id: user.id,
            recipient_id: emailToProfileId.get(b.guest_email)!,
            retreat_id: b.retreat_id,
            subject: subject || null,
            body: body,
          }));

        if (inserts.length > 0) {
          const { error: insertError } = await supabase.from("messages").insert(inserts);
          if (insertError) throw new Error(insertError.message);
        }
      }

      guests.forEach((guest) => {
        const existing = conversations.find(
          (c) => c.guestEmail === guest.guestEmail && c.retreatId === guest.retreatId
        );
        const personalizedBody = body
          .replace(/\{\{guestName\}\}/g, guest.guestName)
          .replace(/\{\{retreatName\}\}/g, guest.retreatName)
          .replace(/\[Retreat Name\]/g, guest.retreatName)
          .replace(/\[Start Date\]/g, guest.retreatStartDate)
          .replace(/\[Host Name\]/g, "The Team");
        const newMsg: Message = {
          id: `m-broadcast-${Date.now()}-${guest.id}`,
          conversationId: existing?.id ?? `c-new-${guest.id}`,
          sender: "host",
          body: (subject ? `${subject}\n\n` : "") + personalizedBody,
          sentAt: new Date().toISOString(),
        };

        if (existing) {
          setMessagesByConv((prev) => ({
            ...prev,
            [existing.id]: [...(prev[existing.id] ?? []), newMsg],
          }));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    lastMessage: newMsg.body.slice(0, 60) + (newMsg.body.length > 60 ? "…" : ""),
                    lastAt: newMsg.sentAt,
                  }
                : c
            )
          );
        } else {
          const newConv: Conversation = {
            id: newMsg.conversationId,
            guestName: guest.guestName,
            guestEmail: guest.guestEmail,
            retreatId: guest.retreatId,
            retreatName: guest.retreatName,
            lastMessage: newMsg.body.slice(0, 60) + (newMsg.body.length > 60 ? "…" : ""),
            lastAt: newMsg.sentAt,
            unread: false,
          };
          setConversations((prev) => [...prev, newConv]);
          setMessagesByConv((prev) => ({ ...prev, [newConv.id]: [newMsg] }));
        }
      });

      setToast({ message: `Message sent to ${broadcastGuestCount} guests`, type: "success" });
      setBroadcastModalOpen(false);
      setBroadcastSubject("");
      setBroadcastBody("");
      setBroadcastSelectedRetreatIds([]);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to send messages",
        type: "error",
      });
    } finally {
      setBroadcastSending(false);
    }
  }, [
    broadcastGuestCount,
    broadcastSubject,
    broadcastBody,
    broadcastSelectedRetreatIds,
    broadcastSending,
    conversations,
    retreats,
  ]);

  const closeBroadcastModal = useCallback(() => {
    setBroadcastModalOpen(false);
    setBroadcastSubject("");
    setBroadcastBody("");
    setBroadcastSelectedRetreatIds([]);
    setBroadcastTemplateDropdownOpen(false);
  }, []);

  const openGuestDrawer = useCallback((conversation: Conversation) => {
    const booking = mockBookings.find(
      (b) => b.guestEmail === conversation.guestEmail && b.retreatId === conversation.retreatId
    );
    if (booking) setGuestDrawerBookingId(booking.id);
  }, []);

  const sendComposeMessage = useCallback(() => {
    if (!selectedId || !composeText.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId: selectedId,
      sender: "host",
      body: composeText.trim(),
      sentAt: new Date().toISOString(),
    };
    setMessagesByConv((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newMsg],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: newMsg.body.slice(0, 60) + (newMsg.body.length > 60 ? "…" : ""),
              lastAt: newMsg.sentAt,
              unread: false,
            }
          : c
      )
    );
    setComposeText("");
  }, [selectedId, composeText]);

  const drawerBooking: Booking | null = guestDrawerBookingId
    ? mockBookings.find((b) => b.id === guestDrawerBookingId) ?? null
    : null;
  const drawerNotes = drawerBooking
    ? hostNotesByBookingId[drawerBooking.id] ?? drawerBooking.host_notes ?? ""
    : "";

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const retreat = searchParams.get("retreat");
    const email = searchParams.get("email");
    if (retreat && email) {
      setRetreatFilter(retreat);
      const conv = conversations.find((c) => c.retreatId === retreat && c.guestEmail === email);
      if (conv) setSelectedId(conv.id);
    }
  }, [searchParams, conversations]);

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col p-0 md:flex-row">
      {/* Left panel */}
      <aside className="flex w-full flex-col border-r border-onda-border bg-card-bg md:w-[340px] md:flex-shrink-0">
        <div className="border-b border-onda-border p-4">
          <h1 className="font-serif text-[28px] tracking-tight text-ink">Messages</h1>
          <p className="mt-2 text-sm text-warm-gray">Guest conversations</p>
          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="mt-4 w-full rounded-lg bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
          >
            Message all guests →
          </button>
        </div>

        {/* Retreat filter tabs */}
        <div className="flex border-b border-onda-border px-4">
          <button
            type="button"
            onClick={() => setRetreatFilter("all")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              retreatFilter === "all"
                ? "border-b-2 border-sage text-sage"
                : "text-warm-gray hover:text-ink"
            }`}
          >
            All
          </button>
          {retreats.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRetreatFilter(r.id)}
              className={`whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors ${
                retreatFilter === r.id
                  ? "border-b-2 border-sage text-sage"
                  : "text-warm-gray hover:text-ink"
              }`}
            >
              {r.name.length > 18 ? r.name.slice(0, 18) + "…" : r.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {filteredConversations.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isSelected={selectedId === c.id}
              onClick={() => openConversation(c.id)}
              onOpenGuest={() => openGuestDrawer(c)}
            />
          ))}
        </div>
      </aside>

      {/* Thread view */}
      <main className="flex flex-1 flex-col min-w-0 bg-cream">
        {selected ? (
          <>
            <div className="border-b border-onda-border bg-card-bg px-4 py-3">
              <button
                type="button"
                onClick={() => openGuestDrawer(selected)}
                className="text-left hover:opacity-80"
              >
                <p className="font-semibold text-ink">{selected.guestName}</p>
                <p className="text-sm text-warm-gray">
                  {selected.guestEmail} · {selected.retreatName}
                </p>
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-warm-gray">No messages yet.</p>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}
            </div>
            <div className="border-t border-onda-border bg-card-bg p-4">
              <div className="relative flex w-full gap-2">
                <textarea
                  placeholder="Type a message..."
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendComposeMessage();
                    }
                  }}
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTemplateDropdownOpen((o) => !o)}
                      className="rounded-lg border border-onda-border bg-white px-3 py-2 text-sm font-medium text-warm-gray hover:bg-cream"
                    >
                      Templates
                    </button>
                    {templateDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          aria-hidden
                          onClick={() => setTemplateDropdownOpen(false)}
                        />
                        <div className="absolute right-0 bottom-full z-20 mb-1 w-56 rounded-lg border border-onda-border bg-white py-1 shadow-lg">
                          {DEFAULT_TEMPLATES.map((t) => (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => {
                                const body = selected
                                  ? t.body
                                      .replace(/\{\{guestName\}\}/g, selected.guestName)
                                      .replace(/\{\{retreatName\}\}/g, selected.retreatName)
                                  : t.body;
                                setComposeText(body);
                                setTemplateDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-cream"
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={sendComposeMessage}
                    className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-light"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-warm-gray">
            <p>Select a conversation</p>
          </div>
        )}
      </main>

      {/* Broadcast modal */}
      {broadcastModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-onda-border bg-card-bg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-onda-border p-4">
              <h2 id="broadcast-title" className="font-serif text-xl text-ink">
                Message all guests
              </h2>
              <button
                type="button"
                onClick={closeBroadcastModal}
                className="rounded p-1.5 text-warm-gray hover:bg-cream hover:text-ink"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Step 1 — Who to message */}
              <div>
                <label className="block text-sm font-semibold text-ink">Send to</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBroadcastRetreat("all")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      broadcastSelectedRetreatIds.includes("all")
                        ? "bg-[#4A6741] text-white"
                        : "border-2 border-ink bg-transparent text-ink hover:bg-cream"
                    }`}
                  >
                    All retreats
                  </button>
                  {retreats.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleBroadcastRetreat(r.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        broadcastSelectedRetreatIds.includes(r.id)
                          ? "bg-[#4A6741] text-white"
                          : "border-2 border-ink bg-transparent text-ink hover:bg-cream"
                      }`}
                    >
                      {r.name}
                      {isRetreatPast(r) && (
                        <span className="ml-1.5 text-xs opacity-70">(completed)</span>
                      )}
                    </button>
                  ))}
                </div>
                {broadcastSummaryCopy && (
                  <p className="mt-3 text-sm text-warm-gray">{broadcastSummaryCopy}</p>
                )}
              </div>

              {/* Step 2 — The message */}
              <div>
                <label className="block text-sm font-semibold text-ink">Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Welcome to the retreat"
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink">Message</label>
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
                <div className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTemplateDropdownOpen((o) => !o)}
                    className="text-sm font-medium text-sage hover:underline"
                  >
                    Use a template →
                  </button>
                  {broadcastTemplateDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setBroadcastTemplateDropdownOpen(false)}
                      />
                      <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-onda-border bg-white py-1 shadow-lg">
                        {BROADCAST_MODAL_TEMPLATES.map((t) => (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() => fillBroadcastTemplate(t)}
                            className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-cream"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 border-t border-onda-border p-4">
              <button
                type="button"
                onClick={closeBroadcastModal}
                className="rounded-lg border border-onda-border bg-transparent px-4 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
              >
                Cancel
              </button>
              <div className="relative flex items-center">
                {broadcastGuestCount === 0 && (
                  <span
                    className="absolute bottom-full left-0 mb-1 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white"
                    role="tooltip"
                  >
                    Select at least one retreat
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleBroadcastSend}
                  disabled={broadcastGuestCount === 0 || broadcastSending}
                  title={broadcastGuestCount === 0 ? "Select at least one retreat" : undefined}
                  className="rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {broadcastSending ? "Sending…" : `Send to ${broadcastGuestCount} guests`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-sage text-white" : "bg-clay text-white"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {/* Guest profile drawer */}
      {drawerBooking && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20"
            aria-hidden
            onClick={() => setGuestDrawerBookingId(null)}
          />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-onda-border bg-card-bg shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-onda-border p-4">
                <h2 className="font-serif text-lg text-ink">Guest profile</h2>
                <button
                  type="button"
                  onClick={() => setGuestDrawerBookingId(null)}
                  className="rounded p-1 text-warm-gray hover:bg-cream hover:text-ink"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <p className="font-semibold text-ink">{drawerBooking.guestName}</p>
                <p className="text-sm text-warm-gray">{drawerBooking.guestEmail}</p>
                <p className="mt-4 text-sm text-ink">{drawerBooking.retreatName}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      drawerBooking.status === "confirmed"
                        ? "bg-status-signed text-sage"
                        : drawerBooking.status === "pending"
                          ? "bg-status-pending text-clay"
                          : "bg-warm-gray/15 text-warm-gray"
                    }`}
                  >
                    {drawerBooking.status}
                  </span>
                  <span className="rounded-full bg-warm-gray/15 px-2.5 py-1 text-xs font-semibold text-warm-gray">
                    {drawerBooking.waiverStatus === "signed" ? "Waiver signed" : "Waiver pending"}
                  </span>
                </div>
                <p className="mt-2 font-medium text-ink">
                  {formatCurrency(drawerBooking.totalCents)}
                </p>
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-ink">Private notes</label>
                  <textarea
                    value={drawerNotes}
                    onChange={(e) =>
                      setHostNotesByBookingId((prev) => ({
                        ...prev,
                        [drawerBooking.id]: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Add notes about this guest (only visible to you)"
                    className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                  />
                </div>
                <Link
                  href={`/dashboard/bookings/${drawerBooking.id}`}
                  className="mt-6 inline-block text-sm font-semibold text-sage hover:underline"
                >
                  View full booking →
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function ConversationListItem({
  conversation,
  isSelected,
  onClick,
  onOpenGuest,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onOpenGuest: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-b border-[#D8D2C4] px-4 py-3 text-left transition-colors ${
        isSelected
          ? "border-l-[3px] border-l-sage bg-[#E8E2D8]"
          : "border-l-[3px] border-l-transparent hover:bg-[#F0EBE1]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGuest();
            }}
            className={`block truncate text-left ${conversation.unread ? "font-bold text-ink" : "font-semibold text-ink"}`}
          >
            {conversation.guestName}
          </button>
          <p className="text-xs text-warm-gray truncate">{conversation.retreatName}</p>
          <p
            className={`mt-1 truncate text-sm ${conversation.unread ? "font-medium text-ink" : "text-warm-gray"}`}
          >
            {conversation.lastMessage}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-start gap-1">
          <span className="text-xs text-warm-gray">
            {formatMessageTime(conversation.lastAt)}
          </span>
          {conversation.unread && (
            <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-clay" aria-label="Unread" />
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isHost = message.sender === "host";
  const plainBody = stripMarkdown(message.body);
  return (
    <div className={`flex w-full ${isHost ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[60%] flex-col ${isHost ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 ${
            isHost
              ? "rounded-2xl rounded-br-md bg-[#4A6741] text-white"
              : "rounded-2xl rounded-bl-md border border-[#D8D2C4] bg-[#FDFAF5] text-ink"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{plainBody}</p>
        </div>
        <p className="mt-1 text-xs text-warm-gray">
          {formatMessageTime(message.sentAt)}
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-warm-gray">Loading…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
