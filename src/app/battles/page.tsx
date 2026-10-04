"use client";

import { useEffect, useState } from "react";
import { Swords, Trophy, Skull, Bot, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RARITY_COLOR, fmtRub } from "@/lib/ui";
import type { Rarity } from "@/lib/seed";
import type { Skin, CaseBox } from "@/lib/seed";
import { cn } from "@/lib/utils";

type CaseRow = CaseBox & { itemCount: number };

export default function BattlesPage() {
  const { user, refreshUser, setBalance } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [sel, setSel] = useState<CaseRow | null>(null);
  const [phase, setPhase] = useState<"idle" | "spin" | "done">("idle");
  const [flash, setFlash] = useState<{ u: Skin | null; b: Skin | null }>({ u: null, b: null });
  const [result, setResult] = useState<{ userSkin: Skin; botSkin: Skin; winner: "user" | "bot" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalog", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCases(d.cases));
  }, []);

  // flash animation while spinning
  useEffect(() => {
    if (phase !== "spin") return;
    const t = setInterval(() => {
      setFlash(() => {
        const pool = cases.flatMap((c) => [] as Skin[]);
        void pool;
        return { u: randSkin(), b: randSkin() };
      });
    }, 110);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cases.length]);

  const [skinPool, setSkinPool] = useState<Skin[]>([]);
  useEffect(() => {
    fetch("/api/skins", { cache: "no-store" }).then((r) => r.json()).then(setSkinPool);
  }, []);
  const randSkin = () => skinPool[Math.floor(Math.random() * skinPool.length)] || null;

  const start = async () => {
    if (!sel || phase === "spin") return;
    setError(null);
    if (!user) {
      window.dispatchEvent(new Event("gb-login"));
      return;
    }
    setResult(null);
    setPhase("spin");
    const res = await fetch("/api/play", { method: "POST", body: JSON.stringify({ mode: "battle", caseId: sel.id }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка баттла");
      setPhase("idle");
      return;
    }
    setBalance(data.balance);
    setTimeout(() => {
      setResult({ userSkin: data.userSkin, botSkin: data.botSkin, winner: data.winner });
      setPhase("done");
      refreshUser();
    }, 3200);
  };

  return (
    <div className="pt-8">
      <h1 className="text-center font-display text-[26px] font-medium uppercase tracking-[0.25em] text-white mb-3">Баттлы кейсов</h1>
      <p className="text-center text-[12px] uppercase tracking-widest text-gray-500 mb-10">
        Один кейс — два открытия. Победитель забирает оба предмета
      </p>

      {phase === "idle" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSel(c)}
                className={cn(
                  "relative p-4 rounded-sm border bg-[#171a1e] flex flex-col items-center transition-all hover:-translate-y-1",
                  sel?.id === c.id ? "border-[#f7941d] shadow-[0_0_20px_rgba(247,148,29,0.25)]" : "border-white/5 hover:border-white/20"
                )}
              >
                {c.isLimited && <span className="absolute top-2 right-2 text-[8px] font-bold bg-[#e4ae39] text-black px-1.5 py-0.5 -skew-x-12">LIMITED</span>}
                <img src={c.image} style={{ filter: `hue-rotate(${c.hue}deg)` }} className="h-24 object-contain mb-2" alt={c.name} />
                <div className="font-display text-[13px] font-semibold uppercase tracking-wide text-white">{c.name}</div>
                <div className="price-tag px-3 py-1 text-[11px] font-bold rounded-sm mt-2 tabular-nums">{c.price.toLocaleString("ru-RU")} ₽</div>
              </button>
            ))}
          </div>
          {error && <div className="text-center mb-4 text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-4 py-2 inline-block">{error}</div>}
          <div className="flex justify-center">
            <button
              onClick={start}
              disabled={!sel}
              className="flex items-center gap-3 bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-display font-semibold uppercase tracking-[0.25em] text-[16px] px-14 py-4 rounded-md shadow-[0_0_30px_rgba(247,148,29,0.45)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Swords className="w-5 h-5" />
              {sel ? `Начать баттл за ${sel.price.toLocaleString("ru-RU")} ₽` : "Выберите кейс"}
            </button>
          </div>
        </>
      )}

      {phase !== "idle" && (
        <div className="relative bg-[#171a1e] border border-white/5 rounded-lg p-8 md:p-12">
          <div className="absolute left-1/2 top-8 bottom-8 w-px bg-white/5 hidden md:block" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#f7941d] text-black flex items-center justify-center font-display font-bold text-[15px] shadow-[0_0_35px_rgba(247,148,29,0.7)] z-10 hidden md:flex">
            VS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Side
              title={user?.username || "Вы"}
              icon={<User className="w-4 h-4" />}
              skin={phase === "spin" ? flash.u : result?.userSkin || null}
              spinning={phase === "spin"}
              winner={phase === "done" && result?.winner === "user"}
              loser={phase === "done" && result?.winner === "bot"}
            />
            <Side
              title="GRIM BOT"
              icon={<Bot className="w-4 h-4" />}
              skin={phase === "spin" ? flash.b : result?.botSkin || null}
              spinning={phase === "spin"}
              winner={phase === "done" && result?.winner === "bot"}
              loser={phase === "done" && result?.winner === "user"}
            />
          </div>

          {phase === "done" && result && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <div
                className={cn(
                  "flex items-center gap-3 font-display text-[30px] font-semibold uppercase tracking-wider",
                  result.winner === "user" ? "text-[#37d67a]" : "text-[#eb4b4b]"
                )}
              >
                {result.winner === "user" ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                {result.winner === "user" ? "Победа! Оба предмета ваши" : "Поражение — бот забрал всё"}
              </div>
              <div className="text-[12px] text-gray-500 tabular-nums">
                Ваш дроп: {fmtRub(result.userSkin.price)} · Дроп бота: {fmtRub(result.botSkin.price)}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setPhase("idle"); setResult(null); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded font-bold uppercase tracking-widest text-[12px] transition-all"
                >
                  К боям
                </button>
                <button
                  onClick={start}
                  className="flex items-center gap-2 bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black px-8 py-3 rounded font-bold uppercase tracking-widest text-[12px] hover:brightness-110 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Ещё бой
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Side({
  title,
  icon,
  skin,
  spinning,
  winner,
  loser,
}: {
  title: string;
  icon: React.ReactNode;
  skin: Skin | null;
  spinning: boolean;
  winner: boolean;
  loser: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 relative">
      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-gray-400">
        {icon}
        {title}
      </div>
      <div className={cn("relative w-[260px] h-[260px] flex items-center justify-center rounded-full", spinning && "flash-spin")}>
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-40 transition-colors"
          style={{ background: winner ? "#37d67a" : loser ? "#eb4b4b" : skin ? RARITY_COLOR[skin.rarity as Rarity] : "#22262c" }}
        />
        {skin ? (
          <img src={skin.image} className="relative w-[220px] h-[220px] object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]" alt={skin.name} />
        ) : (
          <div className="relative text-gray-600 text-[11px] uppercase tracking-widest">ожидание</div>
        )}
        {winner && (
          <div className="absolute -top-3 bg-[#37d67a] text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-3 h-3" /> Победитель
          </div>
        )}
      </div>
      <div className="text-center h-12">
        {skin && !spinning && (
          <>
            <div className="text-[12px] text-gray-300">{skin.name}</div>
            <div className="text-[18px] font-bold text-white tabular-nums">{fmtRub(skin.price)}</div>
          </>
        )}
        {spinning && <div className="text-[12px] text-[#f7941d] uppercase tracking-widest animate-pulse">Крутим барабан...</div>}
      </div>
    </div>
  );
}
