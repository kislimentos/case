"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  ChevronsUp,
  FileText,
  Swords,
  Trophy,
  Wallet,
  Settings,
  LogOut,
  Percent,
  Mail,
  Coins,
  History,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RARITY_COLOR, fmtRub } from "@/lib/ui";
import type { Rarity } from "@/lib/seed";
import type { Skin } from "@/lib/seed";
import { cn } from "@/lib/utils";

type InvRow = { id: number; skin: Skin; isNew: boolean; source: string; createdAt: number };

export default function InventoryPage() {
  const { user, refreshUser, logout, setBalance } = useAuth();
  const [items, setItems] = useState<InvRow[]>([]);
  const [onlyNew, setOnlyNew] = useState(false);
  const [allDrop, setAllDrop] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);

  const load = async () => {
    const r = await fetch("/api/inventory", { cache: "no-store" }).then((x) => x.json());
    setItems(r.items || []);
  };
  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const filtered = useMemo(() => items.filter((i) => (onlyNew ? i.isNew : true)), [items, onlyNew]);
  const total = filtered.reduce((a, i) => a + i.skin.price, 0);

  const sell = async (id: number) => {
    const r = await fetch("/api/inventory", { method: "POST", body: JSON.stringify({ action: "sell", id }) }).then((x) => x.json());
    if (r.ok) {
      setItems((s) => s.filter((i) => i.id !== id));
      setBalance(r.balance);
      refreshUser();
    }
  };

  const sellAll = async () => {
    const r = await fetch("/api/inventory", { method: "POST", body: JSON.stringify({ action: "sellAll" }) }).then((x) => x.json());
    if (r.ok) {
      setItems([]);
      setBalance(r.balance);
      refreshUser();
      setMsg(`Продано предметов: ${r.count} на ${fmtRub(r.total)}`);
    }
  };

  const applyCoupon = async () => {
    const r = await fetch("/api/play", { method: "POST", body: JSON.stringify({ mode: "coupon", code: coupon }) }).then((x) => x.json());
    if (r.ok) {
      setMsg(`Купон применён: +${fmtRub(r.bonus)}`);
      setBalance(r.balance);
      refreshUser();
      setCoupon("");
    } else setMsg(r.error || "Ошибка купона");
  };

  const saveEmail = async () => {
    if (!user) return;
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "setEmail", userId: user.id, email }) }).then((x) => x.json());
    if (r.ok) {
      setMsg("E-mail сохранён");
      refreshUser();
    } else setMsg(r.error || "Ошибка e-mail");
  };

  if (!user) {
    return (
      <div className="py-32 text-center">
        <div className="font-display text-[26px] uppercase tracking-[0.25em] text-white mb-4">Профиль</div>
        <div className="text-gray-500 text-[13px] mb-6">Войдите в аккаунт, чтобы увидеть профиль и предметы</div>
        <button onClick={() => window.dispatchEvent(new Event("gb-login"))} className="bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-bold uppercase tracking-widest text-[12px] px-10 py-4 rounded-md shadow-[0_0_25px_rgba(247,148,29,0.45)] hover:brightness-110 transition-all">
          Войти
        </button>
      </div>
    );
  }

  const bestSkin = user.stats.bestDrop;

  return (
    <div className="pt-8">
      <h1 className="text-center font-display text-[26px] font-medium uppercase tracking-[0.3em] text-white mb-10">Профиль</h1>

      {msg && (
        <div className="mb-6 flex items-center gap-2 text-[12px] text-[#37d67a] bg-[#37d67a]/10 border border-[#37d67a]/30 rounded px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
        {/* left column */}
        <div className="space-y-5">
          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#37d67a]/15 border border-[#37d67a]/40 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#37d67a]" />
              </div>
              <div>
                <div className="font-display font-semibold uppercase tracking-wider text-white text-[15px]">Trade URL</div>
                <div className="text-[12px] text-gray-500">Трейд-ссылка сохранена</div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2.5 text-[12px] text-gray-400 truncate">https://steamcommunity.com/tradeoffer/…</div>
              <button className="border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black text-[11px] font-bold uppercase tracking-wider px-4 rounded transition-all">
                Обновить
              </button>
            </div>
          </div>

          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <ChevronsUp className="w-5 h-5 text-[#f7941d]" />
              <div>
                <div className="font-display font-semibold uppercase tracking-wider text-white text-[15px]">Статистика</div>
                <div className="text-[12px] text-gray-500">Аккаунта</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat icon={<Box className="w-4 h-4" />} value={user.stats.opened} label="кейсов" />
              <Stat icon={<ChevronsUp className="w-4 h-4" />} value={user.stats.upgrades} label="апгрейдов" />
              <Stat icon={<FileText className="w-4 h-4" />} value={user.stats.contracts} label="контрактов" />
              <Stat icon={<Swords className="w-4 h-4" />} value={user.stats.battles} label="баттлов" />
              <Stat icon={<Trophy className="w-4 h-4" />} value={user.stats.won} label="побед" />
              <Stat icon={<Coins className="w-4 h-4" />} value={items.length} label="предметов" />
            </div>
          </div>
        </div>

        {/* center column */}
        <div className="space-y-5">
          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] text-gray-400 bg-black/40 border border-white/10 rounded px-2.5 py-1">! {user.username}</span>
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider">
                <span className="text-gray-500 flex items-center gap-1.5">
                  Настройки <Settings className="w-3.5 h-3.5 text-[#f7941d]" />
                </span>
                <button onClick={logout} className="text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors">
                  Выход <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center mb-5">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#f7941d] to-[#8a2be2] p-1">
                <div className="w-full h-full rounded-full bg-[#101318] flex items-center justify-center font-display text-[40px] font-bold text-[#f7941d]">
                  {user.username[0].toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[13px] text-gray-300">
                <Wallet className="w-4 h-4 text-[#f7941d]" />
                <b className="text-white text-[17px] tabular-nums">{fmtRub(user.balance)}</b>
              </div>
              <button
                onClick={() => setTopupOpen((v) => !v)}
                className="flex items-center gap-2 border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all"
              >
                + Пополнить
              </button>
            </div>
            {topupOpen && (
              <div className="text-[12px] text-[#f7941d] bg-[#f7941d]/10 border border-[#f7941d]/30 rounded px-3 py-2.5 mb-3">
                Пополнение баланса выдаёт <b>только администратор</b> в админ-панели (аккаунт admin / admin).
              </div>
            )}
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <History className="w-4 h-4" /> История операций хранится в JSON-базе (data/grimbattle.json)
            </div>
          </div>

          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-6">
            <div className="font-display font-semibold uppercase tracking-[0.2em] text-white text-[13px] text-center mb-4">Лучший дроп</div>
            {bestSkin > 0 ? (
              <div className="flex items-center gap-4">
                <BestDropIcon price={bestSkin} />
                <div>
                  <div className="text-[12px] text-gray-300">Лучшая находка аккаунта</div>
                  <div className="text-[16px] font-bold text-[#f7941d] tabular-nums">{fmtRub(bestSkin)}</div>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-gray-600 text-center">Пока пусто — откройте первый кейс</div>
            )}
          </div>
        </div>

        {/* right column */}
        <div className="space-y-5">
          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Percent className="w-5 h-5 text-[#f7941d]" />
              <div>
                <div className="font-display font-semibold uppercase tracking-wider text-white text-[15px]">Персональный купон</div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Введите код купона"
                className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2.5 text-[12px] outline-none focus:border-[#f7941d]/60"
              />
              <button onClick={applyCoupon} className="border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black text-[11px] font-bold uppercase tracking-wider px-4 rounded transition-all">
                Применить
              </button>
            </div>
            <div className="text-[11px] text-gray-600 mt-3">Купон STORM-12 даёт +12% к счёту один раз</div>
          </div>

          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-[#f7941d]" />
              <div>
                <div className="font-display font-semibold uppercase tracking-wider text-white text-[15px]">Добавьте E-mail</div>
                <div className="text-[12px] text-gray-500">и получайте купоны</div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={email || user.email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите свой email"
                className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2.5 text-[12px] outline-none focus:border-[#f7941d]/60"
              />
              <button onClick={saveEmail} className="border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black text-[11px] font-bold uppercase tracking-wider px-4 rounded transition-all">
                Обновить
              </button>
            </div>
          </div>

          <Link href="/api/archive" className="block bg-[#171a1e] border border-white/5 rounded-sm p-6 hover:border-[#f7941d]/40 transition-colors">
            <div className="font-display font-semibold uppercase tracking-wider text-[#f7941d] text-[14px] mb-1">Архив скинов CS2</div>
            <div className="text-[12px] text-gray-500">Все картинки скинов базы одним .zip архивом</div>
          </Link>
        </div>
      </div>

      {/* items */}
      <h2 className="text-center font-display text-[22px] font-medium uppercase tracking-[0.3em] text-white mb-8">Ваши предметы</h2>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-5 text-[13px] text-gray-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={allDrop} onChange={(e) => { setAllDrop(e.target.checked); if (e.target.checked) setOnlyNew(false); }} className="accent-[#f7941d] w-4 h-4" />
            Весь дроп
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={onlyNew} onChange={(e) => { setOnlyNew(e.target.checked); if (e.target.checked) setAllDrop(false); }} className="accent-[#f7941d] w-4 h-4" />
            Новые ({items.filter((i) => i.isNew).length})
          </label>
        </div>
        <button
          onClick={sellAll}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-[#22262c] border border-white/10 disabled:border-white/5 text-gray-300 disabled:text-gray-600 hover:border-[#e05a2b] hover:text-[#f7941d] text-[11px] font-bold uppercase tracking-wider px-5 py-3 rounded transition-all"
        >
          <Coins className="w-4 h-4" />
          {filtered.length === 0 ? "Нет предметов для продажи" : `Продать всё за ${fmtRub(total)}`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-[13px] font-bold uppercase tracking-widest">Ничего не найдено, упростите фильтр</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
          {filtered.map((it) => (
            <div
              key={it.id}
              className="group bg-[#171a1e] border border-white/5 rounded-sm p-3 flex flex-col items-center hover:border-white/20 transition-all relative"
              style={{ borderBottom: `3px solid ${RARITY_COLOR[it.skin.rarity as Rarity]}` }}
            >
              {it.isNew && <span className="absolute top-1.5 left-1.5 bg-[#e33] text-white text-[7px] font-bold px-1 py-0.5 -skew-x-12">NEW</span>}
              <img src={it.skin.image} className="w-full h-16 object-contain mb-2 group-hover:scale-110 transition-transform" alt={it.skin.name} />
              <div className="text-[9px] text-gray-400 text-center leading-tight line-clamp-2 min-h-[24px]">{it.skin.name}</div>
              <div className="text-[10px] font-bold text-white tabular-nums mt-1">{fmtRub(it.skin.price)}</div>
              <button
                onClick={() => sell(it.id)}
                className="mt-2 w-full bg-black/40 border border-white/10 hover:bg-[#f7941d] hover:text-black hover:border-[#f7941d] text-[9px] font-bold uppercase tracking-wider text-gray-400 py-1.5 rounded transition-all"
              >
                Продать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-black/30 border border-white/5 rounded p-3">
      <div className="flex items-center justify-center gap-1.5 text-[#f7941d] mb-1">
        {icon}
        <span className="font-display text-[18px] font-semibold text-white tabular-nums">{value}</span>
      </div>
      <div className="text-[9px] uppercase tracking-wider text-gray-600">{label}</div>
    </div>
  );
}

function BestDropIcon({ price }: { price: number }) {
  return (
    <div className="w-16 h-16 rounded-sm bg-black/40 border border-[#f7941d]/30 flex items-center justify-center">
      <Trophy className="w-7 h-7 text-[#f7941d]" />
    </div>
  );
}
