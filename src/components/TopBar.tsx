"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bomb,
  Package,
  ChevronsUp,
  FileText,
  Swords,
  Backpack,
  ShieldAlert,
  Users,
  Send,
  Play,
  Gamepad2,
  MessageCircle,
  Wallet,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fmtRub } from "@/lib/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "КЕЙСЫ", icon: Package },
  { href: "/upgrader", label: "АПГРЕЙД", icon: ChevronsUp },
  { href: "/contract", label: "КОНТРАКТЫ", icon: FileText },
  { href: "/battles", label: "БАТТЛЫ", icon: Swords },
  { href: "/inventory", label: "ПРОФИЛЬ", icon: Backpack },
];

export default function TopBar({ onLogin }: { onLogin: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [online, setOnline] = useState(10573);

  useEffect(() => {
    const t = setInterval(() => {
      setOnline((o) => Math.max(9800, o + Math.floor(Math.random() * 41) - 20));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] z-50 bg-[#0e1116] border-b border-black/70 shadow-[0_2px_18px_rgba(0,0,0,0.6)] flex items-stretch">
      {/* Logo */}
      <Link href="/" className="w-[210px] shrink-0 bg-black/60 border-r border-white/5 flex flex-col items-center justify-center group">
        <div className="flex items-center gap-1 font-display text-[26px] leading-none font-extrabold italic tracking-tight text-white">
          GRIM
          <Bomb className="w-6 h-6 text-[#f7941d] group-hover:rotate-12 transition-transform" />
          BATTLE
        </div>
        <div className="text-[8px] font-bold tracking-[0.35em] text-[#f7941d] mt-1">У НАС ВЫИГРЫВАЮТ</div>
      </Link>

      {/* Nav */}
      <nav className="flex items-stretch">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 px-5 min-w-[92px] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                active ? "text-[#f7941d] bg-[#181c22]" : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {active && <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#f7941d] shadow-[0_0_12px_#f7941d]" />}
              <n.icon className="w-5 h-5" />
              {n.label}
            </Link>
          );
        })}
        {user?.isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "relative flex flex-col items-center justify-center gap-1.5 px-5 min-w-[92px] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
              pathname === "/admin" ? "text-[#f7941d] bg-[#181c22]" : "text-yellow-600/80 hover:text-yellow-400 hover:bg-white/[0.04]"
            )}
          >
            {pathname === "/admin" && <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#f7941d] shadow-[0_0_12px_#f7941d]" />}
            <ShieldAlert className="w-5 h-5" />
            АДМИН
          </Link>
        )}
      </nav>

      {/* Online */}
      <div className="flex flex-col items-center justify-center px-4 gap-0.5" title="Игроков онлайн">
        <Users className="w-5 h-5 text-[#37d67a] fill-[#37d67a]/20" />
        <span className="text-[13px] font-bold text-[#37d67a] tabular-nums">{online.toLocaleString("ru-RU")}</span>
      </div>

      <div className="flex-1" />

      {/* Socials */}
      <div className="hidden md:flex items-center gap-3 mr-5 bg-black/40 border border-white/5 rounded-lg px-3 py-2 self-center">
        {[Send, Play, Gamepad2, MessageCircle].map((I, i) => (
          <button key={i} className="text-[#f7941d] hover:text-white hover:scale-110 transition-all" title="Сообщество GrimBattle">
            <I className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* User */}
      {user ? (
        <div className="flex items-center gap-3 pr-4">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg pl-2 pr-3 py-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f7941d] to-[#8a2be2] flex items-center justify-center font-display font-bold text-black border-2 border-[#f7941d]/60">
              {user.username[0].toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="text-[11px] text-[#f7941d]">
                Привет, <span className="text-white font-bold">! {user.username}</span>
              </div>
              <div className="text-[11px] text-gray-400">
                На счете: <span className="text-[#f7941d] font-bold tabular-nums">{fmtRub(user.balance)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Выйти"
            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogIn className="w-5 h-5 rotate-180" />
          </button>
          <Link
            href="/inventory"
            title="Кошелёк"
            className="self-center p-2.5 text-[#f7941d] border border-[#f7941d]/40 rounded-lg hover:bg-[#f7941d]/10 transition-colors"
          >
            <Wallet className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 pr-5">
          <button
            onClick={onLogin}
            className="flex items-center gap-2 bg-gradient-to-b from-[#ffb340] to-[#f7941d] text-black font-bold uppercase tracking-widest text-[12px] px-6 py-3 rounded-md shadow-[0_0_18px_rgba(247,148,29,0.45)] hover:brightness-110 active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            ВОЙТИ
          </button>
        </div>
      )}
    </header>
  );
}
