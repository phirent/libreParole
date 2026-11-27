"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PenLine, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/app/deposer", label: "Déposer", Icon: PenLine },
  { href: "/app/cercles", label: "Mes Cercles", Icon: Users },
  { href: "/app/cicatrices", label: "Cicatrices", Icon: Sparkles },
];

function SignOut() {
  const router = useRouter();
  async function logout() {
    try { await createClient().auth.signOut(); } finally { router.replace("/"); router.refresh(); }
  }
  return <button aria-label="Se déconnecter" onClick={logout} className="rounded p-1.5 text-[#8B949E] hover:text-[#F0F6FC]"><LogOut size={17} strokeWidth={1.5} /></button>;
}

function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-[#30363D] bg-[#161B22] pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-16 grid-cols-3">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === "/app/cercles" && pathname.startsWith("/app/cercle/"));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 text-xs ${active ? "text-[#F59E0B]" : "text-[#8B949E]"}`}>
            <Icon size={20} strokeWidth={1.5} /><span>{label}</span>
          </Link>;
        })}
      </div>
    </nav>
  );
}

AppNavigation.SignOut = SignOut;
export { AppNavigation };
