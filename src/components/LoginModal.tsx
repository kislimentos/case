"use client";

import { useState } from "react";
import { Bomb, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = tab === "login" ? await login(username, password) : await register(username, password);
    setBusy(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] bg-[#181c22] border border-white/10 rounded-lg overflow-hidden shadow-[0_0_60px_rgba(247,148,29,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-[#f7941d] to-[#e33]" />
        <div className="p-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 font-display text-2xl font-extrabold italic text-white">
              GRIM <Bomb className="w-6 h-6 text-[#f7941d]" /> BATTLE
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-md mb-6">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] rounded transition-all",
                  tab === t ? "bg-[#f7941d] text-black" : "text-gray-400 hover:text-white"
                )}
              >
                {t === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">Логин</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-sm outline-none focus:border-[#f7941d]/60 transition-colors"
                placeholder="Ваш ник"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-sm outline-none focus:border-[#f7941d]/60 transition-colors"
                placeholder="••••••"
              />
            </div>
            {error && (
              <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-b from-[#ffb340] to-[#f7941d] text-black font-bold uppercase tracking-[0.25em] text-[13px] py-4 rounded shadow-[0_0_20px_rgba(247,148,29,0.4)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {busy ? "..." : tab === "login" ? "ВОЙТИ В ИГРУ" : "СОЗДАТЬ АККАУНТ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
