import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNavigation } from "@/components/AppNavigation";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let supabase;
  try { supabase = await createClient(); } catch { redirect("/"); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("pseudo").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  return (
    <div className="min-h-screen pb-24">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-[#30363D] bg-[#0D1117]">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/app/deposer" className="flex items-center gap-2 text-sm font-semibold text-[#F0F6FC]">
            <Image src="/logo.png" alt="" width={28} height={28} priority />
            <span>Libre Parole</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="max-w-28 truncate text-sm text-[#8B949E]">{profile.pseudo}</span>
            <AppNavigation.SignOut />
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-screen max-w-md px-4 pb-8 pt-20">{children}</main>
      <AppNavigation />
    </div>
  );
}
