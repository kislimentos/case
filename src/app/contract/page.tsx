"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Wallet, Plus, Coins, Handshake, Shuffle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RARITY_COLOR, RARITY_LABEL, fmtRub } from "@/lib/ui";
import type { Rarity } from "@/lib/seed";
import type { Skin } from "@/lib/seed";
import { cn } from "@/lib/utils";

type InvRow = { id: number; skin: Skin };
const RARITIES: Rarity[] = ["blue", "purple", "pink", "red", "gold"];

export default function ContractPage() {
  const { user, refreshUser, setBalance } = useAuth();
  const [myItems, setMyItems] = useState<InvRow[]>([]);
  const [selected, setSelected] = useState<InvRow[]>([]);
  const [addBal, setAddBal] = useState(0);
  const [goal, setGoal] = useState<"random" | Rarity>("random");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ skin: Skin; sum: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch("/api/inventory", { cache: "no-store" }).then((x) => x.json());
    setMyItems(r.items || []);
  };
  useEffect(() => {
    load();
  }, []);

  const itemsSum = selected.reduce((a, i) => a + i.skin.price, 0);
  const sum = itemsSum + addBal;
  const outMin = sum * 0.9;
  const outMax = sum * 1.6;

  const toggle = (it: InvRow) => {
    setSelected((s) => {
      if (s.find((x) => x.id === it.id)) return s.filter((x) => x.id !== it.id);
      if (s.length >= 10) return s;
      return [...s, it];
    });
  };

  const sign = async () => {
    if (selected.length < 3 || selected.length > 10 || busy) return;
    setBusy(true);
    const res = await fetch("/api/play", {
      method: "POST",
      body: JSON.stringify({
        mode: "contract",
        inventoryIds: selected.map((s) => s.id),
        addBalance: addBal,
        rarity: goal === "random" ? undefined : goal,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "Ошибка контракта");
      return;
    }
    setNote(null);
    setBalance(data.balance);
    setTimeout(() => {
      setResult({ skin: data.skin, sum: data.sum });
      setSelected([]);
      setAddBal(0);
      load();
      refreshUser();
    }, 1500);
  };

  const slots = useMemo(() => Array.from({ length: 10 }, (_, i) => selected[i] || null), [selected]);

  return (
    <div className="pt-8">
      <div className="flex items-center gap-3 mb-6">
        <button className="flex items-center gap-2 text-[#f7941d] hover:text-white font-bold text-[13px] transition-colors" title="Правила: от 3 до 10 предметов сгорают, вы получаете один предмет дороже суммы контракта">
          <FileText className="w-5 h-5" />
          Правила игры
        </button>
      </div>

      <h1 className="text-center font-display text-[26px] font-medium uppercase tracking-[0.25em] text-white mb-8">Контракты</h1>

      {/* slots */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
        {slots.map((s, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square bg-[#171a1e] border rounded-sm flex items-center justify-center relative overflow-hidden transition-all",
              s ? "border-[#f7941d]/60 shadow-[0_0_14px_rgba(247,148,29,0.2)]" : "border-white/5"
            )}
          >
            {s ? (
              <>
                <img src={s.skin.image} className="w-[80%] h-[80%] object-contain" alt={s.skin.name} />
                <button
                  onClick={() => toggle(s)}
                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity text-[10px] font-bold uppercase text-red-400"
                >
                  Убрать
                </button>
              </>
            ) : (
              <img
                src="https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA"
                className="w-[80%] object-contain brightness-0 opacity-[0.13]"
                alt=""
              />
            )}
          </div>
        ))}
      </div>

      {/* balance bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#171a1e] border border-white/5 rounded-sm px-6 py-4 mb-5">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#f7941d]" />
          <span className="text-[13px] text-gray-300">
            Ваш баланс: <b className="text-white tabular-nums">{fmtRub(user?.balance || 0)}</b>
          </span>
          <button
            onClick={() => setNote("Пополнение баланса выдаёт только администратор (админ-панель)")}
            className="w-6 h-6 rounded-full bg-[#f7941d] text-black flex items-center justify-center hover:scale-110 transition-transform"
            title="Пополнение — только через администратора"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[12px] font-bold uppercase tracking-widest text-[#f7941d] text-center">
          {selected.length < 3 ? `Положите еще минимум ${3 - selected.length} предмета` : `Вы получите предмет от ${fmtRub(outMin)} до ${fmtRub(outMax)}`}
        </div>
        <div className="text-[13px] font-bold uppercase tracking-wider text-gray-300">
          Сумма контракта: <span className="text-white tabular-nums">{fmtRub(sum)}</span>
        </div>
      </div>
      {note && <div className="mb-4 text-[12px] text-[#f7941d] bg-[#f7941d]/10 border border-[#f7941d]/30 rounded px-4 py-2 inline-block">{note}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* my items */}
        <div className="bg-[#171a1e] border border-white/5 rounded-sm">
          <div className="px-5 py-3.5 bg-black/30 border-b border-white/5 font-display text-[15px] font-semibold uppercase tracking-[0.15em] text-white">
            Мои предметы
          </div>
          <div className="p-4 min-h-[380px] max-h-[480px] overflow-y-auto">
            {myItems.length === 0 ? (
              <div className="h-[340px] flex flex-col items-center justify-center gap-5">
                <div className="text-[13px] font-bold uppercase tracking-widest text-gray-500">У вас нет предметов</div>
                <Link href="/" className="border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black font-bold uppercase tracking-widest text-[11px] px-6 py-3 transition-all">
                  Откройте любой кейс
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {myItems.map((it) => {
                  const isSel = !!selected.find((s) => s.id === it.id);
                  return (
                    <button
                      key={it.id}
                      onClick={() => toggle(it)}
                      className={cn(
                        "p-2 rounded-sm border bg-black/30 transition-all hover:border-white/25",
                        isSel ? "border-[#f7941d] bg-[#f7941d]/10 shadow-[0_0_12px_rgba(247,148,29,0.25)]" : "border-white/5"
                      )}
                    >
                      <img src={it.skin.image} className="w-full h-16 object-contain" alt={it.skin.name} />
                      <div className="text-[9px] text-gray-400 leading-tight line-clamp-1 mt-1">{it.skin.name}</div>
                      <div className="text-[10px] font-bold text-white tabular-nums">{fmtRub(it.skin.price)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* outcome */}
        <div className="bg-[#171a1e] border border-white/5 rounded-sm">
          <div className="flex items-center gap-4 px-5 py-3 bg-black/30 border-b border-white/5">
            <Coins className="w-5 h-5 text-[#f7941d]" />
            <span className="text-[11px] text-gray-400 leading-tight">
              Использовать
              <br />
              баланс:
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, Math.floor(user?.balance || 0))}
              step={10}
              value={addBal}
              onChange={(e) => setAddBal(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-[12px] font-bold text-white tabular-nums w-24 text-right">{fmtRub(addBal)}</span>
          </div>

          <div className="p-6 flex flex-col items-center gap-5 min-h-[380px]">
            <div className="text-center">
              <div className="font-display text-[17px] font-semibold uppercase tracking-[0.15em] text-white">Вы получите предмет</div>
              <div className="text-[14px] font-bold uppercase tracking-wider text-gray-300 mt-1">
                от <span className="text-[#f7941d] tabular-nums">{fmtRub(outMin)}</span> до <span className="text-[#f7941d] tabular-nums">{fmtRub(outMax)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-[420px]">
              <span className="text-[12px] text-gray-400 shrink-0">Цель:</span>
              <div className="flex-1 grid grid-cols-6 gap-1">
                <button
                  onClick={() => setGoal("random")}
                  className={cn(
                    "col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-sm border text-[10px] font-bold uppercase tracking-wider transition-all",
                    goal === "random" ? "border-[#f7941d] text-[#f7941d] bg-[#f7941d]/10" : "border-white/10 text-gray-400 hover:text-white"
                  )}
                >
                  <Shuffle className="w-3.5 h-3.5" /> Случайная
                </button>
                {RARITIES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setGoal(r)}
                    title={RARITY_LABEL[r]}
                    className={cn("py-2 rounded-sm border text-[9px] font-bold uppercase transition-all", goal === r ? "text-black" : "text-gray-400 hover:text-white")}
                    style={
                      goal === r
                        ? { background: RARITY_COLOR[r], borderColor: RARITY_COLOR[r] }
                        : { borderColor: `${RARITY_COLOR[r]}55`, color: RARITY_COLOR[r] }
                    }
                  >
                    {RARITY_LABEL[r].slice(0, 6)}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="w-full max-w-[420px] h-[150px] rounded-sm border border-white/5 bg-[#22262c] flex items-center justify-center relative overflow-hidden"
              style={{ boxShadow: goal !== "random" ? `inset 0 0 60px ${RARITY_COLOR[goal]}33` : undefined }}
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                {goal === "random" ? "Редкость определится автоматически" : RARITY_LABEL[goal]}
              </div>
            </div>

            <button
              onClick={sign}
              disabled={selected.length < 3 || busy}
              className="flex items-center gap-3 bg-[#3a2a1a] hover:bg-[#f7941d] hover:text-black disabled:hover:bg-[#3a2a1a] disabled:hover:text-gray-500 border border-[#f7941d]/40 disabled:border-white/5 text-[#f7941d] disabled:text-gray-500 font-display font-semibold uppercase tracking-[0.25em] text-[15px] px-10 py-3.5 rounded-sm transition-all active:scale-95 disabled:opacity-70"
            >
              <Handshake className="w-5 h-5" />
              {busy ? "Подписание..." : "Подписать!"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="relative flex flex-col items-center text-center max-w-md w-full">
              <div className="absolute inset-0 blur-[100px] rounded-full opacity-40" style={{ background: RARITY_COLOR[result.skin.rarity as Rarity] }} />
              <div className="text-[11px] font-bold tracking-[0.4em] text-gray-400 uppercase relative">Контракт исполнен</div>
              <img src={result.skin.image} className="w-72 h-72 object-contain relative z-10 my-4" alt={result.skin.name} />
              <div className="font-display text-[24px] font-semibold text-white relative">{result.skin.name}</div>
              <div className="text-[13px] font-bold mt-1 relative tabular-nums" style={{ color: RARITY_COLOR[result.skin.rarity as Rarity] }}>
                {fmtRub(result.skin.price)}
              </div>
              <div className="text-[11px] text-gray-500 mt-2 relative tabular-nums">Сумма контракта: {fmtRub(result.sum)}</div>
              <button onClick={() => setResult(null)} className="relative mt-8 bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-3 rounded font-bold uppercase tracking-widest text-[12px] transition-all">
                Забрать
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
