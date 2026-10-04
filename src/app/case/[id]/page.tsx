"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Lock, RefreshCw, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RARITY_COLOR, RARITY_LABEL, fmtRub, timeLeft } from "@/lib/ui";
import type { Rarity } from "@/lib/seed";
import type { Skin } from "@/lib/seed";

type ContentRow = { skin: Skin; weight: number; odds: number };

const ITEM_W = 150;
const GAP = 8;
const STEP = ITEM_W + GAP;
const WIN_INDEX = 52;
const COUNT = 60;

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshUser, setBalance } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [strip, setStrip] = useState<Skin[]>([]);
  const [rolling, setRolling] = useState(false);
  const [x0, setX0] = useState(0);
  const [x1, setX1] = useState(0);
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<Skin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/catalog?caseId=${id}`, { cache: "no-store" });
      const data = await res.json();
      setCaseData(data.caseDetail);
      setContents(data.contents || []);
      setExpiresAt(data.settings.limitedExpiresAt);
    };
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [id]);

  const openCase = async () => {
    if (rolling) return;
    setError(null);
    if (!user) {
      window.dispatchEvent(new Event("gb-login"));
      return;
    }
    if (!caseData) return;
    if (user.balance < caseData.price) {
      setError("Недостаточно средств — пополнение выдаёт администратор");
      return;
    }
    setResult(null);
    setRolling(true);

    const res = await fetch("/api/play", {
      method: "POST",
      body: JSON.stringify({ mode: "open", caseId: caseData.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка");
      setRolling(false);
      return;
    }

    const pool = contents.map((c) => c.skin);
    const items: Skin[] = Array.from({ length: COUNT }, () => pool[Math.floor(Math.random() * pool.length)]);
    items[WIN_INDEX] = data.skin;
    setStrip(items);

    const W = boxRef.current?.clientWidth || 900;
    const jitter = Math.floor(Math.random() * 60) - 30;
    setX0(W / 2 - ITEM_W / 2);
    setX1(W / 2 - (WIN_INDEX * STEP + ITEM_W / 2) + jitter);
    setRunId((r) => r + 1);
    setBalance(data.balance);

    setTimeout(() => {
      setRolling(false);
      setResult(data.skin);
      refreshUser();
    }, 6700);
  };

  if (!caseData) return <div className="py-24 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Загрузка кейса...</div>;

  const color = "#f7941d";

  return (
    <div className="pt-6">
      <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#f7941d] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Ко всем кейсам
      </Link>

      {/* header */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-[#181c22]/70 border border-white/5 rounded-lg p-6 mb-8">
        <div className="relative w-44 h-44 shrink-0">
          <div className="absolute inset-4 rounded-full blur-2xl opacity-50" style={{ background: caseData.isLimited ? "#e4ae39" : color }} />
          <img src={caseData.image} alt={caseData.name} style={{ filter: `hue-rotate(${caseData.hue}deg)` }} className="relative w-full h-full object-contain float-y" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="font-display text-[34px] leading-none font-semibold uppercase tracking-wide text-white">{caseData.name}</h1>
            {caseData.isLimited && (
              <span className="flex items-center gap-1.5 bg-[#e4ae39]/15 border border-[#e4ae39]/40 text-[#e4ae39] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" /> Лимитированный · {timeLeft(expiresAt - now)}
              </span>
            )}
          </div>
          <div className="text-[12px] text-gray-500 mt-2">{contents.length} предметов · шансы указаны ниже</div>
          <div className="mt-4 flex items-center justify-center md:justify-start gap-4">
            <span className="price-tag px-5 py-2 text-[15px] font-bold rounded-sm tabular-nums">{fmtRub(caseData.price)}</span>
            <button
              onClick={openCase}
              disabled={rolling}
              className="bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-bold uppercase tracking-[0.2em] text-[13px] px-8 py-3 rounded-md shadow-[0_0_25px_rgba(247,148,29,0.45)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {rolling ? "Крутим..." : `Открыть за ${caseData.price.toLocaleString("ru-RU")} ₽`}
            </button>
          </div>
          {error && <div className="mt-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2 inline-block">{error}</div>}
          {!user && <div className="mt-3 text-[12px] text-gray-500">Нажмите «Открыть» — потребуется вход в аккаунт.</div>}
        </div>
      </div>

      {/* roulette */}
      <div className="bg-[#181c22]/70 border border-white/5 rounded-lg p-5 mb-10">
        <div ref={boxRef} className="relative h-[168px] overflow-hidden rounded roulette-mask bg-black/40">
          <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 z-20 bg-[#f7941d] shadow-[0_0_14px_#f7941d]" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20 border-x-8 border-x-transparent border-t-[10px] border-t-[#f7941d]" />
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-20 border-x-8 border-x-transparent border-b-[10px] border-b-[#f7941d]" />
          {strip.length > 0 && (
            <motion.div
              key={runId}
              className="absolute top-4 flex"
              style={{ gap: GAP }}
              initial={{ x: x0 }}
              animate={{ x: x1 }}
              transition={{ duration: 6.5, ease: [0.12, 0, 0.18, 1] }}
            >
              {strip.map((s, i) => (
                <div
                  key={i}
                  className="shrink-0 bg-[#1b1f24] rounded flex flex-col items-center justify-center px-2"
                  style={{ width: ITEM_W, height: 136, borderBottom: `3px solid ${RARITY_COLOR[s.rarity as Rarity]}` }}
                >
                  <img src={s.image} alt="" className="h-[74px] w-full object-contain" />
                  <div className="text-[9px] text-gray-400 text-center leading-tight mt-1 line-clamp-2">{s.name}</div>
                </div>
              ))}
            </motion.div>
          )}
          {strip.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-600 text-[12px] font-bold uppercase tracking-[0.3em]">
              Рулетка готова к запуску
            </div>
          )}
        </div>
      </div>

      {/* contents */}
      <div className="mb-4 flex items-center gap-3">
        <Package className="w-5 h-5 text-[#f7941d]" />
        <h2 className="font-display text-[18px] font-semibold uppercase tracking-[0.2em] text-white">Содержимое кейса</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
        {contents.map((row) => (
          <div
            key={row.skin.id}
            className="group bg-[#181c22]/70 border border-white/5 rounded p-3 flex flex-col items-center hover:-translate-y-1 hover:border-white/15 transition-all"
            style={{ borderBottom: `3px solid ${RARITY_COLOR[row.skin.rarity as Rarity]}` }}
            title={RARITY_LABEL[row.skin.rarity as Rarity]}
          >
            <img src={row.skin.image} alt={row.skin.name} loading="lazy" className="h-[70px] w-full object-contain mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-[10px] text-gray-300 text-center leading-tight line-clamp-2 min-h-[26px]">{row.skin.name}</div>
            <div className="mt-1.5 flex items-center justify-between w-full text-[10px]">
              <span className="text-[#f7941d] font-bold">{row.odds}%</span>
              <span className="text-gray-500 tabular-nums">{fmtRub(row.skin.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* result modal */}
      {result && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="relative flex flex-col items-center max-w-lg w-full text-center">
            <div className="absolute inset-0 blur-[110px] rounded-full opacity-40" style={{ background: RARITY_COLOR[result.rarity as Rarity] }} />
            <div className="text-[11px] font-bold tracking-[0.4em] text-gray-400 uppercase mb-6 relative">Вы выиграли</div>
            <motion.img initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14 }} src={result.image} className="w-[300px] h-[300px] object-contain relative z-10" />
            <div className="font-display text-[28px] font-semibold text-white relative mt-2">{result.name}</div>
            <div className="text-[12px] text-gray-400 relative mt-1" style={{ color: RARITY_COLOR[result.rarity as Rarity] }}>
              {RARITY_LABEL[result.rarity as Rarity]}
            </div>
            <div className="price-tag px-6 py-2 text-[18px] font-bold rounded-sm mt-4 relative tabular-nums">{fmtRub(result.price)}</div>
            <div className="flex gap-3 mt-8 relative">
              <button onClick={() => setResult(null)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-[12px] px-8 py-3.5 rounded transition-all">
                Забрать
              </button>
              <button onClick={() => { setResult(null); openCase(); }} className="flex items-center gap-2 bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-bold uppercase tracking-widest text-[12px] px-8 py-3.5 rounded shadow-[0_0_20px_rgba(247,148,29,0.4)] hover:brightness-110 transition-all">
                <RefreshCw className="w-4 h-4" /> Открыть ещё
              </button>
            </div>
          </div>
        </div>
      )}

      {rolling && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[105] flex items-center gap-2 bg-black/80 border border-[#f7941d]/40 rounded-full px-5 py-2.5 text-[12px] font-bold text-[#f7941d] uppercase tracking-widest">
          <Lock className="w-3.5 h-3.5" /> Удачи, боец!
        </div>
      )}
    </div>
  );
}
