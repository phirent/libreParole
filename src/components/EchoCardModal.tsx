"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import { Share2 } from "lucide-react";

type Props = { excerpt: string; response: string };
export default function EchoCardModal({ excerpt, response }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  async function share() {
    if (!cardRef.current) return;
    setBusy(true); setError("");
    try {
      const dataUrl = await toPng(cardRef.current, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "carte-echo-libre-parole.png", { type: "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: "Libre Parole", text: "Une réponse reçue sur Libre Parole." });
      } else {
        const anchor = document.createElement("a"); anchor.href = dataUrl; anchor.download = file.name; anchor.click();
      }
    } catch (e) { setError(e instanceof Error ? e.message : "La carte n’a pas pu être créée."); }
    finally { setBusy(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-[#F59E0B] hover:text-[#D97706]"><Share2 size={14} strokeWidth={1.5} />Carte d’Écho</button>
    {open && <div role="dialog" aria-modal="true" aria-label="Carte d’Écho" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1117]/95 p-4">
      <div className="w-full max-w-sm rounded-md border border-[#30363D] bg-[#161B22] p-4">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-medium">Carte d’Écho</h2><button onClick={() => setOpen(false)} className="text-sm text-[#8B949E]">Fermer</button></div>
        <div className="mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden border border-[#30363D] bg-[#0D1117] p-4"><div className="flex h-full flex-col justify-between border border-[#30363D] p-4"><div><p className="text-[8px] uppercase tracking-widest text-[#8B949E]">Une parole reçue</p><p className="mt-4 line-clamp-4 text-[10px] leading-4 text-[#8B949E]">{excerpt}</p><p className="mt-6 text-base leading-6 text-[#F0F6FC]">{response}</p></div><div className="flex items-center gap-2 text-[10px] font-medium text-[#F59E0B]"><Image src="/logo.png" alt="" width={22} height={22} />Libre Parole</div></div></div>
        {error && <p role="alert" className="mt-3 text-xs text-[#EF4444]">{error}</p>}
        <button disabled={busy} onClick={share} className="mt-4 w-full rounded-md bg-[#F59E0B] px-4 py-3 text-sm font-medium text-[#0D1117] disabled:opacity-50">{busy ? "Préparation…" : "Partager ou télécharger"}</button>
      </div>
      <div ref={cardRef} aria-hidden="true" style={{ position: "fixed", left: "-1200px", top: 0, width: 1080, height: 1920, padding: 48, background: "#0D1117", color: "#F0F6FC" }}><div style={{ boxSizing: "border-box", height: "100%", border: "1px solid #30363D", padding: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><p style={{ color: "#8B949E", fontSize: 24, letterSpacing: 4, textTransform: "uppercase" }}>Une parole reçue</p><p style={{ color: "#8B949E", fontSize: 34, lineHeight: 1.5, marginTop: 80 }}>{excerpt}</p><p style={{ color: "#F0F6FC", fontSize: 58, lineHeight: 1.35, marginTop: 100, whiteSpace: "pre-wrap" }}>{response}</p></div><div style={{ display: "flex", alignItems: "center", gap: 20, color: "#F59E0B", fontSize: 34, fontWeight: 600 }}><img src="/logo.png" alt="" width="64" height="64" />Libre Parole</div></div></div>
    </div>}
  </>;
}
