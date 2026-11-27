"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import EchoCardModal from "@/components/EchoCardModal";

type Parole = { id: string; author_id: string; theme: string; content: string; status: string; expires_at: string; golden_advice: string | null; is_public_scar: boolean };
type Message = { id: string; parole_id: string; sender_id: string; content: string; created_at: string };
type Member = { user_id: string; role: string; is_banned: boolean; pseudo: string };

export default function CirclePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [parole, setParole] = useState<Parole | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pseudos, setPseudos] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState("");
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const eject = useCallback(() => router.replace("/app/cercles"), [router]);
  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      if (alive) setUserId(user.id);
      const { data: membership, error: membershipError } = await supabase.from("circle_members").select("user_id, role, is_banned").eq("parole_id", id).eq("user_id", user.id).maybeSingle();
      if (membershipError || !membership || membership.is_banned) { eject(); return; }
      const [{ data: paroleData, error: paroleError }, { data: messagesData, error: messagesError }, { data: membersData }] = await Promise.all([
        supabase.from("paroles").select("id, author_id, theme, content, status, expires_at, golden_advice, is_public_scar").eq("id", id).maybeSingle(),
        supabase.from("messages").select("id, parole_id, sender_id, content, created_at").eq("parole_id", id).order("created_at", { ascending: true }),
        supabase.from("circle_members").select("user_id, role, is_banned").eq("parole_id", id).eq("is_banned", false),
      ]);
      if (paroleError || messagesError || !paroleData) { if (alive) { setError("Ce cercle est indisponible."); setLoading(false); } return; }
      const ids = [...new Set((membersData ?? []).map((m) => m.user_id))];
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, pseudo").in("id", ids) : { data: [] };
      if (!alive) return;
      setMember({ ...membership, pseudo: profiles?.find((p) => p.id === user.id)?.pseudo ?? "" });
      setPseudos(Object.fromEntries((profiles ?? []).map((p) => [p.id, p.pseudo])));
      setParole(paroleData); setMessages(messagesData ?? []); setLoading(false);
    }
    void load();
    return () => { alive = false; };
  }, [eject, id, router, supabase]);

  useEffect(() => {
    if (!userId || !id) return;
    const channel = supabase.channel(`circle-${id}-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `parole_id=eq.${id}` }, (payload) => {
        const message = payload.new as Message;
        setMessages((current) => current.some((m) => m.id === message.id) ? current : [...current, message]);
        void supabase.from("profiles").select("pseudo").eq("id", message.sender_id).maybeSingle().then(({ data }) => { if (data) setPseudos((current) => ({ ...current, [message.sender_id]: data.pseudo })); });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "circle_members", filter: `parole_id=eq.${id}` }, (payload) => {
        const changed = payload.new as { user_id: string; is_banned: boolean };
        if (changed.user_id === userId && changed.is_banned) eject();
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [eject, id, supabase, userId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft.trim() || !parole || parole.status !== "open") return;
    setSending(true); setError("");
    const { error: sendError } = await supabase.from("messages").insert({ parole_id: id, sender_id: userId, content: draft.trim() });
    if (sendError) setError(sendError.message); else setDraft("");
    setSending(false);
  }

  async function report(message: Message) {
    const { error: reportError } = await supabase.from("reports").insert({ parole_id: id, reported_user_id: message.sender_id, reporter_id: userId });
    if (reportError?.code === "23505") setError("Ce membre a déjà été signalé par vous.");
    else if (reportError) setError(reportError.message);
    else setError("Signalement transmis.");
  }

  async function heal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedAdvice) return;
    const { error: updateError } = await supabase.from("paroles").update({ status: "healed", golden_advice: selectedAdvice, is_public_scar: publish }).eq("id", id).eq("author_id", userId);
    if (updateError) { setError(updateError.message); return; }
    setParole((current) => current ? { ...current, status: "healed", golden_advice: selectedAdvice, is_public_scar: publish } : current);
    setClosing(false);
  }

  if (loading) return <p className="text-sm text-[#8B949E]">Ouverture du cercle…</p>;
  if (!parole || !member) return <p role="alert" className="text-sm text-[#EF4444]">{error || "Ce cercle est indisponible."}</p>;
  const isAuthor = member.role === "author";
  const remaining = Math.max(0, Math.ceil((new Date(parole.expires_at).getTime() - Date.now()) / 3600000));
  const replies = messages.filter((message) => message.sender_id !== parole.author_id);

  return <section>
    <header className="mb-5"><Link href="/app/cercles" className="inline-flex items-center gap-2 text-sm text-[#8B949E]"><ArrowLeft size={17} strokeWidth={1.5} />Retour aux cercles</Link><div className="mt-4 flex items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">{parole.theme}</h1><p className="mt-1 text-xs text-[#8B949E]">{remaining}h restantes</p></div>{isAuthor && parole.status === "open" && <button onClick={() => setClosing(true)} className="rounded-md border border-[#30363D] px-3 py-2 text-xs text-[#F59E0B]">Clôturer et apaiser</button>}</div></header>
    <article className="rounded-md border border-[#30363D] bg-[#161B22] p-4"><p className="mb-2 text-xs text-[#8B949E]">Parole initiale</p><p className="whitespace-pre-wrap text-sm leading-6">{parole.content}</p></article>
    <div className="mt-5 space-y-3">{messages.map((message) => {
      const authorMessage = message.sender_id === parole.author_id;
      return <article key={message.id} className="rounded-md border border-[#30363D] bg-[#161B22] p-4"><div className="flex items-center justify-between"><span className={`text-xs font-medium ${authorMessage ? "text-[#F59E0B]" : "text-[#8B949E]"}`}>{authorMessage ? "Auteur" : (pseudos[message.sender_id] ?? "Membre")}</span>{!authorMessage && message.sender_id !== userId && <button onClick={() => void report(message)} className="text-xs text-[#8B949E] hover:text-[#EF4444]">Signaler</button>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>{isAuthor && !authorMessage && <div className="mt-3"><EchoCardModal excerpt={parole.content} response={message.content} /></div>}</article>;
    })}</div>
    {error && <p role="status" className="mt-3 text-sm text-[#8B949E]">{error}</p>}
    {parole.status === "open" && <form onSubmit={send} className="mt-5 space-y-2"><label htmlFor="message" className="sr-only">Votre réponse</label><textarea id="message" value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 1500))} maxLength={1500} rows={3} placeholder="Écrire une réponse…" className="w-full rounded-md border border-[#30363D] bg-[#161B22] p-3 text-sm leading-6 placeholder:text-[#8B949E] focus:border-[#F59E0B] focus:outline-none"/><div className="flex justify-end"><button disabled={sending || !draft.trim()} className="rounded-md bg-[#F59E0B] px-4 py-2 text-sm font-medium text-[#0D1117] disabled:opacity-50">{sending ? "Envoi…" : "Envoyer"}</button></div></form>}
    {parole.status !== "open" && <p className="mt-5 text-sm text-[#8B949E]">Ce cercle est clôturé.</p>}
    {closing && <div role="dialog" aria-modal="true" aria-labelledby="close-title" className="fixed inset-0 z-40 flex items-center justify-center bg-[#0D1117]/95 p-4"><form onSubmit={heal} className="w-full max-w-md rounded-md border border-[#30363D] bg-[#161B22] p-5"><h2 id="close-title" className="text-lg font-semibold">Clôturer et apaiser</h2>{replies.length ? <fieldset className="mt-5 space-y-3"><legend className="mb-2 text-sm text-[#8B949E]">Choisissez le conseil à retenir</legend>{replies.map((reply) => <label key={reply.id} className="flex gap-3 rounded border border-[#30363D] p-3 text-sm"><input type="radio" name="advice" value={reply.content} checked={selectedAdvice === reply.content} onChange={() => setSelectedAdvice(reply.content)} className="accent-[#F59E0B]"/><span className="whitespace-pre-wrap">{reply.content}</span></label>)}</fieldset> : <p className="mt-4 text-sm text-[#8B949E]">Aucune réponse reçue à retenir. Le cercle ne peut pas être clôturé sans conseil.</p>}<label className="mt-5 flex items-start gap-3 text-sm text-[#F0F6FC]"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="mt-1 accent-[#F59E0B]"/><span>Publier anonymement sur le Mur des Cicatrices Dorées</span></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setClosing(false)} className="px-3 py-2 text-sm text-[#8B949E]">Annuler</button><button disabled={!selectedAdvice} className="rounded-md bg-[#F59E0B] px-3 py-2 text-sm font-medium text-[#0D1117] disabled:opacity-50">Confirmer</button></div></form></div>}
  </section>;
}
