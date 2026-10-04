"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, Clock, Ticket, Timer, Copy, Flame, Package, Check } from "lucide-react";
import { timeLeft, fmtRub } from "@/lib/ui";
import { cn } from "@/lib/utils";

type CaseRow = {
  id: number;
  name: string;
  price: number;
  image: string;
  hue: number;
  isNew: boolean;
  isLimited: boolean;
  itemCount: number;
};

export default function HomePage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [expiresAt, setExpiresAt] = useState(0);
  const [promo, setPromo] = useState({ code: "STORM-12", percent: 12 });
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [favs, setFavs] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      const data = await res.json();
      setCases(data.cases);
      setExpiresAt(data.settings.limitedExpiresAt);
      setPromo({ code: data.settings.promoCode, percent: data.settings.promoPercent });
    };
    load();
    try {
      setFavs(JSON.parse(localStorage.getItem("gb_favs") || "[]"));
    } catch {
      /* ignore */
    }
    const t = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    const reload = setInterval(load, 30000);
    return () => {
      clearInterval(t);
      clearInterval(reload);
    };
  }, []);

  useEffect(() => {
    if (expiresAt && now > expiresAt) fetch("/api/catalog", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setCases(d.cases);
      setExpiresAt(d.settings.limitedExpiresAt);
    });
  }, [now, expiresAt]);

  const toggleFav = (id: number) => {
    setFavs((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      localStorage.setItem("gb_favs", JSON.stringify(next));
      return next;
    });
  };

  const copyPromo = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const filtered = useMemo(
    () =>
      cases.filter(
        (c) =>
          c.name.toLowerCase().includes(filter.trim().toLowerCase()) &&
          (!favOnly || favs.includes(c.id))
      ),
    [cases, filter, favOnly, favs]
  );

  const limited = filtered.filter((c) => c.isLimited);
  const serial = filtered.filter((c) => !c.isLimited);

  return (
    <div className="pt-6">
      {/* promo strip */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-stretch mb-8">
        <div className="relative flex items-center gap-4 bg-gradient-to-r from-[#7a1fd0] to-[#ff2d78] rounded-lg px-6 py-3 shadow-[0_6px_25px_rgba(122,31,208,0.35)] -rotate-1 hover:rotate-0 transition-transform">
          <div className="w-11 h-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center rotate-6">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-display text-[30px] font-bold text-white italic">+{promo.percent}%</div>
            <div className="text-[10px] font-bold tracking-[0.25em] text-white/85">НА СЧЕТ</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 border-2 border-[#f7941d] rounded-lg bg-[#181c22]/80 px-8 py-3 shadow-[0_0_25px_rgba(247,148,29,0.15)]">
          <div className="text-[12px] font-bold uppercase leading-tight tracking-wider text-white">
            Осталось
            <br />
            времени:
          </div>
          <div className="font-display text-[38px] leading-none font-semibold text-white tabular-nums tracking-wide">
            {timeLeft(expiresAt - now)}
          </div>
          <Timer className="w-8 h-8 text-[#f7941d] glow-pulse" />
        </div>

        <button
          onClick={copyPromo}
          className="flex flex-col items-center justify-center bg-gradient-to-b from-[#ffb340] to-[#f7681d] rounded-lg px-8 py-3 shadow-[0_0_30px_rgba(247,148,29,0.5)] hover:brightness-110 active:scale-95 transition-all"
          title="Скопировать промокод"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/90">ИСПОЛЬЗУЙ ПРОМОКОД:</span>
          <span className="font-display text-[24px] leading-none font-bold text-white tracking-[0.15em] flex items-center gap-2">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-4 h-4 opacity-70" />}
            {promo.code}
          </span>
        </button>
      </div>

      {/* quick filter */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-[13px] text-gray-400">
        <span className="font-bold">Быстрый Фильтр:</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Что ищем?"
          className="w-64 bg-black/50 border border-white/10 rounded px-4 py-2 text-sm outline-none focus:border-[#f7941d]/60 transition-colors"
        />
        <button onClick={() => setFavOnly((v) => !v)} className="flex items-center gap-2 hover:text-white transition-colors">
          <span
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              favOnly ? "bg-[#f7941d]" : "bg-white/15"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                favOnly ? "left-[22px]" : "left-0.5"
              )}
            />
          </span>
          Только избранные ({favs.length})
        </button>
      </div>

      {/* limited */}
      {limited.length > 0 && (
        <section className="mb-14">
          <div className="text-center mb-8">
            <h2 className="section-title font-display text-[22px] font-semibold uppercase tracking-[0.25em] text-white">
              <Flame className="w-5 h-5 text-[#f7941d]" />
              Лимитированные кейсы
            </h2>
            <div className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#f7941d] bg-[#f7941d]/10 border border-[#f7941d]/30 rounded-full px-4 py-1.5">
              <Clock className="w-3.5 h-3.5" />
              Обновление через {timeLeft(expiresAt - now)} — успей открыть!
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-10">
            {limited.map((c) => (
              <CaseCard key={c.id} c={c} fav={favs.includes(c.id)} onFav={() => toggleFav(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* serial */}
      <section>
        <div className="text-center mb-10">
          <h2 className="section-title font-display text-[22px] font-semibold uppercase tracking-[0.25em] text-white">
            <Package className="w-5 h-5 text-[#f7941d]" />
            Серийные кейсы
          </h2>
        </div>
        {serial.length === 0 && limited.length === 0 ? (
          <div className="text-center text-gray-500 py-16 font-bold uppercase tracking-widest text-sm">
            Ничего не найдено, упростите фильтр
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-10">
            {serial.map((c) => (
              <CaseCard key={c.id} c={c} fav={favs.includes(c.id)} onFav={() => toggleFav(c.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CaseCard({ c, fav, onFav }: { c: CaseRow; fav: boolean; onFav: () => void }) {
  return (
    <div className="group relative flex flex-col">
      <button
        onClick={onFav}
        title={fav ? "Убрать из избранного" : "В избранное"}
        className="absolute -top-1 right-0 z-20 p-1.5 transition-colors"
      >
        <Star className={cn("w-4 h-4", fav ? "text-[#f7941d] fill-[#f7941d]" : "text-gray-600 hover:text-gray-300")} />
      </button>

      <Link href={`/case/${c.id}`} className="flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display text-[16px] font-semibold uppercase tracking-wide text-white group-hover:text-[#f7941d] transition-colors">
            {c.name}
          </h3>
          {c.isNew && (
            <span className="bg-[#e33] text-white text-[8px] font-bold px-1.5 py-0.5 -skew-x-12 tracking-wider">NEW</span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 mb-2">{c.itemCount} предметов</div>

        <div className="relative h-[150px] flex items-center justify-center mb-3">
          <div
            className="absolute inset-x-6 bottom-0 h-10 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity"
            style={{ background: c.isLimited ? "#e4ae39" : "#f7941d" }}
          />
          <img
            src={c.image}
            alt={c.name}
            loading="lazy"
            style={{ filter: `hue-rotate(${c.hue}deg) drop-shadow(0 10px 18px rgba(0,0,0,0.6))` }}
            className="relative max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-1"
          />
        </div>

        <div className="mt-auto flex justify-end">
          <span className="price-tag px-4 py-1.5 text-[13px] font-bold rounded-sm tabular-nums">
            {c.price % 1 === 0 ? `${c.price.toLocaleString("ru-RU")} ₽` : fmtRub(c.price)}
          </span>
        </div>
      </Link>
    </div>
  );
}
