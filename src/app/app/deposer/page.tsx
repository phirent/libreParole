"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { THEMES } from "@/lib/themes";

export default function DeposerPage() {
  const [theme, setTheme] = useState<string>("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!theme || content.trim().length < 20 || content.length > 1000) return;
    setLoading(true); setError("");
    try {
      const { data, error: rpcError } = await createClient().rpc("create_parole_and_match", { p_theme: theme, p_content: content.trim() });
      if (rpcError) throw rpcError;
      if (typeof data !== "string") throw new Error("Le cercle n'a pas pu être créé.");
      router.push(`/app/cercle/${data}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return <section>
    <p className="text-xs uppercase tracking-[0.16em] text-[#8B949E]">Déposer une parole</p>
    <h1 className="mt-2 text-2xl font-semibold">Qu’est-ce qui vous pèse ?</h1>
    <form onSubmit={submit} className="mt-8 space-y-7">
      <fieldset>
        <legend className="mb-3 text-sm text-[#8B949E]">Choisissez le vécu qui s’en rapproche</legend>
        <div className="flex flex-wrap gap-2">{THEMES.map((item) => <button key={item} type="button" onClick={() => setTheme(item)} aria-pressed={theme === item} className={`rounded-full border px-3 py-2 text-sm transition-colors ${theme === item ? "border-[#F59E0B] bg-[#F59E0B] text-[#0D1117]" : "border-[#30363D] text-[#8B949E] hover:border-[#8B949E]"}`}>{item}</button>)}</div>
      </fieldset>
      <div>
        <label htmlFor="parole" className="mb-2 block text-sm text-[#8B949E]">Votre parole</label>
        <textarea id="parole" value={content} onChange={(e) => setContent(e.target.value.slice(0, 1000))} minLength={20} maxLength={1000} required rows={8} placeholder="Écrivez librement. Seules les personnes de votre cercle pourront lire ce texte." className="w-full resize-y rounded-md border border-[#30363D] bg-[#161B22] p-4 text-base leading-7 text-[#F0F6FC] placeholder:text-[#8B949E] focus:border-[#F59E0B] focus:outline-none" />
        <p className="mt-1 text-right text-xs text-[#8B949E]">{content.length}/1000</p>
      </div>
      {error && <p role="alert" className="text-sm text-[#EF4444]">{error}</p>}
      <button disabled={loading || !theme || content.trim().length < 20} className="w-full rounded-md bg-[#F59E0B] px-4 py-3 font-medium text-[#0D1117] hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Recherche de votre Cercle..." : "Ouvrir un Cercle"}</button>
      <p className="text-center text-xs text-[#8B949E]">Votre parole reste privée au sein du cercle, sauf si vous choisissez de la publier après l’avoir apaisée.</p>
    </form>
  </section>;
}
