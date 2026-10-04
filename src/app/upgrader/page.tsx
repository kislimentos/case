"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Settings, Volume2, Zap, ChevronsUp, Shuffle, Coins, Search, Bomb } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RARITY_COLOR, fmtRub } from "@/lib/ui";
import type { Rarity } from "@/lib/seed";
import type { Skin } from "@/lib/seed";
import { cn } from "@/lib/utils";

type InvRow = { id: number; skin: Skin };

export default function UpgraderPage() {
  const { user, refreshUser, setBalance } = useAuth();
  const [myItems, setMyItems] = useState<InvRow[]>([]);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [source, setSource] = useState<InvRow | null>(null);
  const [target, setTarget] = useState<Skin | null>(null);
  const [addBal, setAddBal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [arrowAngle, setArrowAngle] = useState(0);
  const [spinFlash, setSpinFlash] = useState<"win" | "lose" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [result, setResult] = useState<{ success: boolean; rolled: number; chance: number; skin: Skin } | null>(null);
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [applied, setApplied] = useState<{ min: number; max: number } | null>(null);
  const [sort, setSort] = useState<"price" | "name">("price");

  const playTick = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  };

  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.4);
      });
    } catch {}
  };

  const playLoseSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [260, 210, 160].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } catch {}
  };

  const load = async () => {
    const [i, s] = await Promise.all([
      fetch("/api/inventory", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/skins", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setMyItems(i.items || []);
    setSkins(s);
  };

  useEffect(() => {
    load();
  }, []);

  const stake = (source?.skin.price || 0) + addBal;
  const chance = target && target.price > 0 ? Math.min(95, (stake / target.price) * 100) : 0;

  const targetList = useMemo(() => {
    let list = skins.filter((s) => s.price > stake);
    if (applied) list = list.filter((s) => s.price >= applied.min && (applied.max === 0 || s.price <= applied.max));
    list = [...list].sort((a, b) => (sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)));
    return list;
  }, [skins, stake, applied, sort]);

  const pickMultiplier = (mult: number) => {
    if (stake <= 0) return;
    const goal = stake * mult;
    const best = skins.reduce<Skin | null>((acc, s) => (s.price > stake && (!acc || Math.abs(s.price - goal) < Math.abs(acc.price - goal)) ? s : acc), null);
    if (best) setTarget(best);
  };
  const pickChance = (pct: number) => {
    if (stake <= 0) return;
    const goal = stake / (pct / 100);
    const best = skins.reduce<Skin | null>((acc, s) => (s.price > stake && (!acc || Math.abs(s.price - goal) < Math.abs(acc.price - goal)) ? s : acc), null);
    if (best) setTarget(best);
  };
  const pickRandom = () => {
    const list = skins.filter((s) => s.price > stake * 1.1);
    if (list.length) setTarget(list[Math.floor(Math.random() * list.length)]);
  };

  const doUpgrade = async () => {
    if (!source || !target || busy || spinning) return;
    setBusy(true);
    setSpinning(true);
    setSpinFlash(null);
    setResult(null);

    let data: any;
    try {
      const res = await fetch("/api/play", {
        method: "POST",
        body: JSON.stringify({ mode: "upgrade", inventoryId: source.id, addBalance: addBal, targetSkinId: target.id }),
      });
      data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ошибка апгрейда");
        setBusy(false);
        setSpinning(false);
        return;
      }
    } catch {
      alert("Сетевая ошибка при запросе");
      setBusy(false);
      setSpinning(false);
      return;
    }

    setBalance(data.balance);

    // Calculate final rotation:
    // Base is currentAngle rounded to 360, + 5 full loops (1800 deg), + exact angle (rolled / 100) * 360
    const currentBase = Math.floor(arrowAngle / 360) * 360;
    const targetDeg = currentBase + 360 * 5 + (data.rolled / 100) * 360;
    setArrowAngle(targetDeg);

    // Audio tick pulses
    let ticks = 0;
    const totalTicks = 30;
    const interval = setInterval(() => {
      ticks++;
      playTick();
      if (ticks >= totalTicks) clearInterval(interval);
    }, 3600 / totalTicks);

    // After 3.6s, needle arrives at exact rolled sector
    setTimeout(() => {
      const isWin = data.success;
      setSpinFlash(isWin ? "win" : "lose");
      if (isWin) playWinSound();
      else playLoseSound();

      // Show result modal after 900ms
      setTimeout(() => {
        setResult({ success: data.success, rolled: data.rolled, chance: data.chance, skin: data.skin });
        setSource(null);
        setAddBal(0);
        setSpinning(false);
        setBusy(false);
        load();
        refreshUser();
      }, 900);
    }, 3600);
  };

  const R = 118;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="pt-8">
      <h1 className="text-center font-display text-[26px] font-medium uppercase tracking-[0.2em] text-white mb-4">
        Модернизация оружия 2.0
      </h1>
      <div className="flex items-center gap-4 text-gray-500 mb-6 px-1">
        <span title="Шанс = ставка / цена цели, максимум 95%" className="cursor-help hover:text-white transition-colors">
          <Info className="w-4 h-4" />
        </span>
        <Settings className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={cn("transition-colors hover:text-white", soundEnabled ? "text-[#f7941d]" : "text-gray-600")}
          title={soundEnabled ? "Звук включен" : "Звук выключен"}
        >
          <Volume2 className="w-4 h-4" />
        </button>
        <Zap className="w-4 h-4 text-[#f7941d]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_1fr] gap-5 items-stretch mb-5">
        {/* source */}
        <div className="bg-[#171a1e] border border-white/5 rounded-sm p-5 min-h-[300px] flex flex-col">
          <div className="text-center text-[13px] font-bold text-white mb-4">Выберите предмет на апгрейд</div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {source ? (
              <>
                <img src={source.skin.image} className="h-[150px] object-contain" alt={source.skin.name} />
                <div className="text-[12px] text-gray-300 mt-3 text-center">{source.skin.name}</div>
                <div className="text-[15px] font-bold text-[#f7941d] tabular-nums">{fmtRub(source.skin.price)}</div>
                <button onClick={() => setSource(null)} className="mt-3 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white font-bold">
                Убрать
                </button>
              </>
            ) : (
              <Silhouette />
            )}
          </div>
        </div>

        {/* gauge */}
        <div className="flex items-center justify-center">
          <div className="relative w-[270px] h-[270px] p-2">
            {/* SVG gauge: -rotate-90 means 0deg = top = 0%, clockwise = increasing % */}
            <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90 overflow-visible">
              <defs>
                <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={spinFlash === "win" ? "#37d67a" : spinFlash === "lose" ? "#f43f5e" : "#f7941d"} floodOpacity="0.9" />
                </filter>
                <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f7941d" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Dial ticks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2;
                const x1 = 130 + Math.cos(a) * 126;
                const y1 = 130 + Math.sin(a) * 126;
                const isMajor = i % 5 === 0;
                const x2 = 130 + Math.cos(a) * (isMajor ? 115 : 121);
                const y2 = 130 + Math.sin(a) * (isMajor ? 115 : 121);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? "#3a414b" : "#242930"}
                    strokeWidth={isMajor ? 2 : 1}
                  />
                );
              })}

              {/* Background circle track */}
              <circle cx="130" cy="130" r={R} fill="none" stroke="#1c2026" strokeWidth="12" />

              {/* Winning sector arc (starts at 12 o'clock, sweeps clockwise) */}
              <circle
                cx="130"
                cy="130"
                r={R}
                fill="none"
                stroke={spinFlash === "win" ? "#37d67a" : spinFlash === "lose" ? "#f43f5e" : "#f7941d"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC - (CIRC * chance) / 100}
                className="transition-all duration-500"
                filter="url(#arcGlow)"
              />

              {/* The spinning needle pointer */}
              <g
                style={{
                  transformOrigin: "130px 130px",
                  transform: `rotate(${arrowAngle}deg)`,
                  transition: spinning
                    ? "transform 3.6s cubic-bezier(0.12, 0.8, 0.2, 1)"
                    : "transform 0.4s ease-out",
                }}
              >
                {/* Needle shaft (pointing along +X, which after -rotate-90 is pointing straight up to 12 o'clock) */}
                <line
                  x1="130"
                  y1="130"
                  x2="236"
                  y2="130"
                  stroke={spinFlash === "win" ? "#37d67a" : spinFlash === "lose" ? "#f43f5e" : "#f7941d"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#needleGlow)"
                />

                {/* Arrowhead at outer rim */}
                <polygon
                  points="253,130 233,121 238,130 233,139"
                  fill={spinFlash === "win" ? "#37d67a" : spinFlash === "lose" ? "#f43f5e" : "#f7941d"}
                  filter="url(#needleGlow)"
                />

                {/* Arrowhead tip accent */}
                <circle
                  cx="246"
                  cy="130"
                  r="2.5"
                  fill="#ffffff"
                />

                {/* Center bearing hub */}
                <circle cx="130" cy="130" r="14" fill="#14171b" stroke="#2b3138" strokeWidth="2.5" />
                <circle
                  cx="130"
                  cy="130"
                  r="7"
                  fill={spinFlash === "win" ? "#37d67a" : spinFlash === "lose" ? "#f43f5e" : "#f7941d"}
                />
                <circle cx="130" cy="130" r="2.5" fill="#ffffff" />
              </g>
            </svg>

            {/* Center display with chance % */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 border",
                  spinFlash === "win"
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(55,214,122,0.3)]"
                    : spinFlash === "lose"
                    ? "bg-rose-500/10 border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
                    : "bg-[#14171b]/80 border-white/5 shadow-inner"
                )}
              >
                <Bomb
                  className={cn(
                    "w-6 h-6 transition-colors",
                    spinFlash === "win" ? "text-[#37d67a]" : spinFlash === "lose" ? "text-rose-400" : "text-gray-500"
                  )}
                />
                <div className="font-display text-[26px] font-bold text-white tabular-nums leading-none mt-1">
                  {chance.toFixed(1)}%
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1">шанс</div>
              </div>
            </div>

            {/* Scale percentage tags */}
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-500 font-semibold bg-[#0e1013] px-1 rounded">
              0%
            </span>
            <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[10px] font-mono text-gray-500 font-semibold bg-[#0e1013] px-1 rounded">
              25%
            </span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-500 font-semibold bg-[#0e1013] px-1 rounded">
              50%
            </span>
            <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[10px] font-mono text-gray-500 font-semibold bg-[#0e1013] px-1 rounded">
              75%
            </span>
          </div>
        </div>

        {/* target */}
        <div className="bg-[#171a1e] border border-white/5 rounded-sm p-5 min-h-[300px] flex flex-col">
          <div className="text-center text-[13px] font-bold text-white mb-4">Выберите оружие, которое хотите получить</div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {target ? (
              <>
                <img src={target.image} className="h-[150px] object-contain" alt={target.name} />
                <div className="text-[12px] text-gray-300 mt-3 text-center">{target.name}</div>
                <div className="text-[15px] font-bold text-[#37d67a] tabular-nums">{fmtRub(target.price)}</div>
                <button onClick={() => setTarget(null)} className="mt-3 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white font-bold">
                  Убрать
                </button>
              </>
            ) : (
              <Silhouette knife />
            )}
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5 items-center mb-8">
        <div className="flex items-center gap-4 bg-[#171a1e] border border-white/5 rounded-sm px-5 py-4">
          <Coins className="w-6 h-6 text-[#f7941d] shrink-0" />
          <div className="text-[11px] text-gray-400 leading-tight shrink-0">
            Добавить
            <br />
            баланс:
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, Math.floor(user?.balance || 0))}
            step={10}
            value={addBal}
            onChange={(e) => setAddBal(Number(e.target.value))}
            className="flex-1"
          />
          <div className="text-[13px] font-bold text-white tabular-nums w-28 text-right">
            {fmtRub(addBal)} <span className="text-gray-500 font-normal text-[10px]">(max {Math.floor(user?.balance || 0)})</span>
          </div>
        </div>

        <button
          onClick={doUpgrade}
          disabled={!source || !target || busy || spinning || chance <= 0}
          className="flex items-center justify-center gap-3 bg-[#22262c] hover:bg-[#f7941d] hover:text-black disabled:hover:bg-[#22262c] disabled:hover:text-gray-500 border border-white/10 disabled:border-white/5 text-white font-display font-semibold uppercase tracking-[0.25em] text-[16px] px-12 py-4 rounded-sm transition-all active:scale-95 disabled:opacity-60"
        >
          <ChevronsUp className={cn("w-5 h-5", spinning && "animate-bounce")} />
          {spinning ? "Крутим..." : busy ? "Прокачка..." : "Прокачать"}
        </button>

        <div className="flex items-center gap-2 justify-end flex-wrap">
          {[2, 5, 10].map((m) => (
            <button key={m} onClick={() => pickMultiplier(m)} className="skew-btn" title={`Цель ≈ ставка × ${m}`}>
              x{m}
            </button>
          ))}
          {[30, 50, 75].map((p) => (
            <button key={p} onClick={() => pickChance(p)} className="skew-btn" title={`Цель под шанс ${p}%`}>
              {p}%
            </button>
          ))}
          <button onClick={pickRandom} className="skew-btn" title="Случайная цель">
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* pickers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#171a1e] border border-white/5 rounded-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-black/30 border-b border-white/5">
            <div className="text-[13px] font-bold text-gray-300">
              Мои предметы <span className="text-gray-500">({myItems.length} шт)</span>
            </div>
          </div>
          <div className="p-4 max-h-[430px] overflow-y-auto">
            {myItems.length === 0 ? (
              <EmptyState text="Нет доступных предметов для апгрейда" />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {myItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => { setSource(it); setAddBal(0); }}
                    className={cn(
                      "p-2 rounded-sm border bg-black/30 transition-all hover:border-white/25",
                      source?.id === it.id ? "border-[#f7941d] bg-[#f7941d]/10 shadow-[0_0_12px_rgba(247,148,29,0.25)]" : "border-white/5"
                    )}
                  >
                    <img src={it.skin.image} className="w-full h-16 object-contain" alt={it.skin.name} />
                    <div className="text-[9px] text-gray-400 leading-tight line-clamp-1 mt-1">{it.skin.name}</div>
                    <div className="text-[10px] font-bold text-white tabular-nums">{fmtRub(it.skin.price)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#171a1e] border border-white/5 rounded-sm">
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-black/30 border-b border-white/5">
            <div className="text-[13px] font-bold text-gray-300 mr-auto">Выберите предмет</div>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none">
              <option value="price">Цена</option>
              <option value="name">Название</option>
            </select>
            <input value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="от ₽" className="w-20 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none" />
            <input value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="до ₽" className="w-20 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none" />
            <button
              onClick={() => setApplied({ min: Number(minP) || 0, max: Number(maxP) || 0 })}
              className="p-1.5 text-white hover:text-[#f7941d] transition-colors"
              title="Применить фильтр"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 max-h-[430px] overflow-y-auto">
            {stake <= 0 ? (
              <EmptyState text="Сначала выберите предмет слева" search />
            ) : targetList.length === 0 ? (
              <EmptyState text="Воспользуйтесь поиском" search />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {targetList.slice(0, 120).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTarget(s)}
                    className={cn(
                      "p-2 rounded-sm border bg-black/30 transition-all hover:border-white/25",
                      target?.id === s.id ? "border-[#37d67a] bg-[#37d67a]/10" : "border-white/5"
                    )}
                  >
                    <img src={s.image} className="w-full h-16 object-contain" alt={s.name} />
                    <div className="text-[9px] text-gray-400 leading-tight line-clamp-1 mt-1">{s.name}</div>
                    <div className="text-[10px] font-bold text-white tabular-nums">{fmtRub(s.price)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="relative flex flex-col items-center text-center max-w-md w-full">
              <div className="absolute inset-0 blur-[100px] rounded-full opacity-40" style={{ background: result.success ? "#37d67a" : "#eb4b4b" }} />
              <div className={cn("font-display text-[34px] font-semibold uppercase tracking-wider relative", result.success ? "text-[#37d67a]" : "text-[#eb4b4b]")}>
                {result.success ? "Апгрейд успешен!" : "Не удалось"}
              </div>
              <img src={result.skin.image} className="w-64 h-64 object-contain relative z-10 my-4" alt={result.skin.name} />
              <div className="text-[13px] text-gray-300 relative">{result.skin.name}</div>
              <div className="text-[12px] text-gray-500 relative mt-2 tabular-nums">
                Ролл: {result.rolled.toFixed(2)} / нужно было ≤ {result.chance.toFixed(2)}
              </div>
              <button onClick={() => setResult(null)} className="relative mt-8 bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-3 rounded font-bold uppercase tracking-widest text-[12px] transition-all">
                Продолжить
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .skew-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          padding: 10px 14px;
          background: #22262c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #9ca3af;
          font-size: 12px;
          font-weight: 700;
          transform: skewX(-12deg);
          transition: all 0.15s;
        }
        .skew-btn > * {
          transform: skewX(12deg);
        }
        .skew-btn:hover {
          color: #f7941d;
          border-color: rgba(247, 148, 29, 0.5);
        }
        @keyframes gauge-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Silhouette({ knife }: { knife?: boolean }) {
  return (
    <div className="flex flex-col items-center opacity-100">
      <img
        src={knife ? "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA" : "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA"}
        className="h-[150px] object-contain brightness-0 opacity-20"
        alt=""
      />
      <div className="text-[11px] text-gray-600 uppercase tracking-widest mt-2">Пусто</div>
    </div>
  );
}

function EmptyState({ text, search }: { text: string; search?: boolean }) {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-[13px] font-bold uppercase tracking-widest text-gray-400">{text}</div>
      {search ? (
        <div className="text-[11px] text-gray-600">Измените диапазон цены или сортировку</div>
      ) : (
        <Link href="/" className="border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black font-bold uppercase tracking-widest text-[11px] px-6 py-3 transition-all">
          Откройте любой кейс
        </Link>
      )}
    </div>
  );
}
