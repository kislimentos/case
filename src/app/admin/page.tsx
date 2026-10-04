"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Users,
  Package,
  Coins,
  Archive,
  RefreshCw,
  Clock,
  Flame,
  Plus,
  Minus,
  Boxes,
  Droplets,
  User as UserIcon,
  X,
  Search,
  Trash2,
  Gift,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RARITY_COLOR, RARITY_LABEL, CATEGORY_LABEL, fmtRub, timeLeft } from "@/lib/ui";
import type { Rarity, Skin } from "@/lib/seed";
import { cn } from "@/lib/utils";

type AdminUser = { id: number; username: string; balance: number; isAdmin: boolean; items: number; stats: any };
type AdminCase = { id: number; name: string; price: number; image: string; hue: number; isLimited: boolean; itemCount: number };
type InvRow = { id: number; userId: number; skinId: number; createdAt: number; isNew: boolean; source: string; skin: Skin };

export default function AdminPage() {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [timerMin, setTimerMin] = useState("45");
  const [now, setNow] = useState(Date.now());
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Profile modal & Skin picker state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userInventory, setUserInventory] = useState<InvRow[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const [skinSearch, setSkinSearch] = useState("");
  const [skinCat, setSkinCat] = useState("all");
  const [skinRarity, setSkinRarity] = useState("all");
  const [skinSort, setSkinSort] = useState<"price-desc" | "price-asc" | "name">("price-desc");
  const [givingSkinId, setGivingSkinId] = useState<number | null>(null);

  const load = async () => {
    const r = await fetch("/api/admin", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setUsers(d.users);
    setCases(d.cases);
    setSkins(d.skins || []);
    setSettings(d.settings);
    setStats(d.stats);
  };

  useEffect(() => {
    if (user?.isAdmin) load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [user?.isAdmin]);

  const openUserProfile = async (u: AdminUser) => {
    setSelectedUser(u);
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/admin?userId=${u.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUserInventory(data.inventory || []);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const addBalance = async (userId: number, amount: number) => {
    const r = await fetch("/api/admin", { method: "POST", body: JSON.stringify({ action: "addBalance", userId, amount }) }).then((x) => x.json());
    if (r.ok) {
      load();
      refreshUser();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, balance: r.balance } : null));
      }
      setMsg(`Баланс изменен на ${amount > 0 ? "+" : ""}${amount} ₽`);
    }
  };

  const custom = async (userId: number) => {
    const v = Number(amounts[userId] || 0);
    if (!v) return;
    await addBalance(userId, v);
    setAmounts((a) => ({ ...a, [userId]: "" }));
  };

  const toggleLimited = async (caseId: number) => {
    await fetch("/api/admin", { method: "POST", body: JSON.stringify({ action: "toggleLimited", caseId }) });
    load();
  };

  const refreshLimited = async () => {
    setBusy(true);
    await fetch("/api/admin", { method: "POST", body: JSON.stringify({ action: "refreshLimited" }) });
    setBusy(false);
    load();
    setMsg("Лимитированные кейсы обновлены досрочно");
  };

  const setTimer = async () => {
    await fetch("/api/admin", { method: "POST", body: JSON.stringify({ action: "setTimer", minutes: Number(timerMin) || 45 }) });
    load();
    setMsg("Таймер ротации установлен");
  };

  const handleGiveSkin = async (skin: Skin) => {
    if (!selectedUser) return;
    setGivingSkinId(skin.id);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        body: JSON.stringify({ action: "giveSkin", userId: selectedUser.id, skinId: skin.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserInventory((prev) => [data.item, ...prev]);
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, items: u.items + 1 } : u))
        );
        setSelectedUser((prev) => (prev ? { ...prev, items: prev.items + 1 } : null));
        setMsg(`Скин «${skin.name}» успешно выдан игроку ${selectedUser.username}!`);
      } else {
        alert(data.error || "Ошибка добавления скина");
      }
    } finally {
      setGivingSkinId(null);
    }
  };

  const handleRemoveSkin = async (invId: number) => {
    if (!confirm("Удалить этот скин из инвентаря игрока?")) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "removeSkin", inventoryId: invId }),
    });
    if (res.ok) {
      setUserInventory((prev) => prev.filter((i) => i.id !== invId));
      if (selectedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, items: Math.max(0, u.items - 1) } : u))
        );
        setSelectedUser((prev) => (prev ? { ...prev, items: Math.max(0, prev.items - 1) } : null));
      }
      setMsg("Скин удален из инвентаря игрока");
    }
  };

  // Filtered skins for the "Add Skin" picker
  const filteredSkins = useMemo(() => {
    let list = [...skins];
    if (skinSearch.trim()) {
      const q = skinSearch.toLowerCase().trim();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (skinCat !== "all") {
      if (skinCat === "Heavy/SMG") {
        list = list.filter((s) => s.category === "SMGs" || s.category === "Heavy");
      } else {
        list = list.filter((s) => s.category === skinCat);
      }
    }
    if (skinRarity !== "all") {
      list = list.filter((s) => s.rarity === skinRarity);
    }
    list.sort((a, b) => {
      if (skinSort === "price-desc") return b.price - a.price;
      if (skinSort === "price-asc") return a.price - b.price;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [skins, skinSearch, skinCat, skinRarity, skinSort]);

  if (!user) {
    return (
      <div className="py-32 text-center">
        <div className="font-display text-[26px] uppercase tracking-[0.25em] text-white mb-4">Админ-панель</div>
        <button onClick={() => window.dispatchEvent(new Event("gb-login"))} className="bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-bold uppercase tracking-widest text-[12px] px-10 py-4 rounded-md hover:brightness-110 transition-all">
          Войти
        </button>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="py-32 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <div className="font-display text-[30px] uppercase tracking-[0.3em] text-red-500 italic mb-3">Доступ запрещён</div>
        <div className="text-gray-500 text-[13px]">У вас нет прав для просмотра этого раздела</div>
      </div>
    );
  }

  const inventoryTotal = userInventory.reduce((acc, it) => acc + (it.skin?.price || 0), 0);

  return (
    <div className="pt-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-sm bg-[#f7941d]/15 border border-[#f7941d]/40 flex items-center justify-center shadow-[0_0_20px_rgba(247,148,29,0.2)]">
          <ShieldAlert className="w-7 h-7 text-[#f7941d]" />
        </div>
        <div>
          <h1 className="font-display text-[28px] font-semibold uppercase tracking-[0.2em] text-white leading-none">Админ-панель</h1>
          <div className="text-[11px] uppercase tracking-widest text-gray-500 mt-1">Управление профилями игроков, выдачей скинов, балансами и кейсами</div>
        </div>
      </div>

      {msg && (
        <div className="mb-6 text-[12px] text-[#37d67a] bg-[#37d67a]/10 border border-[#37d67a]/30 rounded px-4 py-2.5 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Chip icon={<Users className="w-4 h-4" />} label="Игроков" value={stats?.users ?? 0} />
        <Chip icon={<Package className="w-4 h-4" />} label="Кейсов" value={stats?.cases ?? 0} />
        <Chip icon={<Boxes className="w-4 h-4" />} label="Скинов в базе" value={stats?.skins ?? 0} />
        <Chip icon={<Coins className="w-4 h-4" />} label="Предметов у игроков" value={stats?.items ?? 0} />
        <Chip icon={<Droplets className="w-4 h-4" />} label="Дропов в ленте" value={stats?.drops ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* users & balances */}
        <div className="bg-[#171a1e] border border-white/5 rounded-sm">
          <div className="px-5 py-3.5 bg-black/30 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#f7941d]" />
              <span className="font-display text-[14px] font-semibold uppercase tracking-[0.15em] text-white">Игроки и Балансы</span>
            </div>
            <span className="text-[11px] text-gray-500">{users.length} игроков</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[560px] overflow-y-auto">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap items-center gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f7941d] to-[#8a2be2] flex items-center justify-center font-bold text-black text-sm shrink-0 shadow-sm">
                  {u.username[0].toUpperCase()}
                </div>
                <div className="min-w-[120px]">
                  <div className="text-[13px] font-bold text-white flex items-center gap-2">
                    {u.username}
                    {u.isAdmin && <span className="text-[8px] bg-[#f7941d] text-black px-1.5 py-0.5 font-bold -skew-x-12">ADMIN</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 tabular-nums">
                    {fmtRub(u.balance)} · <span className="text-gray-500">{u.items} предм.</span>
                  </div>
                </div>

                {/* Profile inspection button */}
                <button
                  onClick={() => openUserProfile(u)}
                  className="flex items-center gap-1.5 bg-[#f7941d]/15 hover:bg-[#f7941d] text-[#f7941d] hover:text-black border border-[#f7941d]/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all ml-auto md:ml-0"
                  title="Открыть профиль и инвентарь игрока"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Профиль</span>
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button onClick={() => addBalance(u.id, -100)} className="sq-btn" title="-100 ₽"><Minus className="w-3 h-3" /></button>
                  <button onClick={() => addBalance(u.id, 100)} className="sq-btn" title="+100 ₽">+100</button>
                  <button onClick={() => addBalance(u.id, 1000)} className="sq-btn" title="+1000 ₽">+1K</button>
                  <button onClick={() => addBalance(u.id, 10000)} className="sq-btn" title="+10000 ₽">+10K</button>
                  <input
                    value={amounts[u.id] || ""}
                    onChange={(e) => setAmounts((a) => ({ ...a, [u.id]: e.target.value }))}
                    placeholder="сумма"
                    className="w-20 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none focus:border-[#f7941d]/60"
                  />
                  <button onClick={() => custom(u.id)} className="sq-btn orange" title="Применить сумму">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* limited rotation & archives */}
        <div className="space-y-5">
          <div className="bg-[#171a1e] border border-white/5 rounded-sm">
            <div className="px-5 py-3.5 bg-black/30 border-b border-white/5 flex items-center gap-3">
              <Flame className="w-4 h-4 text-[#f7941d]" />
              <span className="font-display text-[14px] font-semibold uppercase tracking-[0.15em] text-white">Лимитированные кейсы</span>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="flex items-center gap-3 border-2 border-[#f7941d] rounded px-5 py-3 bg-black/30">
                  <Clock className="w-5 h-5 text-[#f7941d] glow-pulse" />
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-gray-500">Автообновление через</div>
                    <div className="font-display text-[24px] leading-none font-semibold text-white tabular-nums">
                      {settings ? timeLeft(settings.limitedExpiresAt - now) : "--:--:--"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={refreshLimited}
                  disabled={busy}
                  className="flex items-center gap-2 bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-bold uppercase tracking-widest text-[11px] px-5 py-3.5 rounded hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                >
                  <RefreshCw className={cn("w-4 h-4", busy && "animate-spin")} />
                  Обновить сейчас
                </button>
                <div className="flex items-center gap-2">
                  <input
                    value={timerMin}
                    onChange={(e) => setTimerMin(e.target.value)}
                    className="w-20 bg-black/50 border border-white/10 rounded px-2 py-2.5 text-[12px] outline-none focus:border-[#f7941d]/60"
                  />
                  <span className="text-[11px] text-gray-500">мин</span>
                  <button onClick={setTimer} className="sq-btn orange">OK</button>
                </div>
              </div>
              <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-1">
                {cases.map((c) => (
                  <div key={c.id} className="py-3 flex items-center gap-3">
                    <img src={c.image} style={{ filter: `hue-rotate(${c.hue}deg)` }} className="w-10 h-10 object-contain" alt={c.name} />
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-white">{c.name}</div>
                      <div className="text-[11px] text-gray-500 tabular-nums">{c.price.toLocaleString("ru-RU")} ₽ · {c.itemCount} предметов</div>
                    </div>
                    <button
                      onClick={() => toggleLimited(c.id)}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm border transition-all",
                        c.isLimited
                          ? "bg-[#e4ae39] text-black border-[#e4ae39] shadow-[0_0_14px_rgba(228,174,57,0.5)]"
                          : "border-white/10 text-gray-500 hover:text-white"
                      )}
                    >
                      {c.isLimited ? "Limited" : "Regular"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#171a1e] border border-white/5 rounded-sm p-5 flex items-center gap-4">
            <Archive className="w-8 h-8 text-[#f7941d] shrink-0" />
            <div className="flex-1">
              <div className="font-display font-semibold uppercase tracking-wider text-white text-[14px]">Архив скинов CS2</div>
              <div className="text-[12px] text-gray-500">Картинки всех {skins.length || stats?.skins || 0} скинов базы (включая наклейки и брелки) + каталог .zip</div>
            </div>
            <a
              href="/api/archive"
              className="border border-[#e05a2b] text-[#f7941d] hover:bg-[#f7941d] hover:text-black text-[11px] font-bold uppercase tracking-wider px-5 py-3 rounded transition-all shrink-0"
            >
              Скачать .zip
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PLAYER PROFILE MODAL */}
      {/* ========================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#15181c] border border-white/15 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f7941d] to-[#8a2be2] flex items-center justify-center font-display text-[20px] font-bold text-black">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-[20px] font-bold uppercase tracking-wider text-white">
                      Профиль игрока: {selectedUser.username}
                    </h2>
                    {selectedUser.isAdmin && (
                      <span className="text-[9px] bg-[#f7941d] text-black px-2 py-0.5 font-bold -skew-x-12">ADMIN</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    ID #{selectedUser.id} · Баланс: <span className="text-[#37d67a] font-bold">{fmtRub(selectedUser.balance)}</span> · Инвентарь: {userInventory.length} предметов ({fmtRub(inventoryTotal)})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSkinPickerOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-b from-[#ffb340] to-[#f7681d] text-black font-bold uppercase tracking-widest text-[11px] px-5 py-2.5 rounded hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(247,148,29,0.4)] transition-all"
                >
                  <Gift className="w-4 h-4" />
                  Добавить скин
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Balance Actions & Stats */}
            <div className="px-6 py-3 bg-[#1c2128] border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Быстрый баланс:</span>
                <button onClick={() => addBalance(selectedUser.id, 500)} className="sq-btn">+500 ₽</button>
                <button onClick={() => addBalance(selectedUser.id, 2000)} className="sq-btn">+2 000 ₽</button>
                <button onClick={() => addBalance(selectedUser.id, 10000)} className="sq-btn orange">+10 000 ₽</button>
                <button onClick={() => addBalance(selectedUser.id, -selectedUser.balance)} className="sq-btn text-red-400 hover:border-red-500" title="Обнулить баланс">Сброс</button>
              </div>

              {selectedUser.stats && (
                <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                  <span>Кейсов: <b className="text-white">{selectedUser.stats.opened || 0}</b></span>
                  <span>Апгрейдов: <b className="text-white">{selectedUser.stats.upgrades || 0}</b></span>
                  <span>Побед: <b className="text-[#37d67a]">{selectedUser.stats.won || 0}</b></span>
                  <span>Лучший дроп: <b className="text-[#f7941d]">{fmtRub(selectedUser.stats.bestDrop || 0)}</b></span>
                </div>
              )}
            </div>

            {/* Inventory Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[15px] font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#f7941d]" />
                  Инвентарь ({userInventory.length} шт · {fmtRub(inventoryTotal)})
                </h3>
                <button
                  onClick={() => openUserProfile(selectedUser)}
                  className="text-gray-400 hover:text-white text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingProfile && "animate-spin")} />
                  Обновить
                </button>
              </div>

              {loadingProfile ? (
                <div className="py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                  Загрузка инвентаря игрока...
                </div>
              ) : userInventory.length === 0 ? (
                <div className="py-16 text-center bg-black/20 rounded border border-dashed border-white/10 flex flex-col items-center justify-center">
                  <Boxes className="w-12 h-12 text-gray-600 mb-3" />
                  <div className="text-gray-400 font-bold text-[14px]">У игрока нет предметов в инвентаре</div>
                  <div className="text-gray-600 text-[12px] mt-1 mb-4">Нажмите «Добавить скин», чтобы выдать любой предмет из каталога</div>
                  <button
                    onClick={() => setSkinPickerOpen(true)}
                    className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#ffb340] text-black font-bold uppercase tracking-widest text-[11px] px-6 py-2.5 rounded transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить первый скин
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {userInventory.map((item) => {
                    const skin = item.skin;
                    if (!skin) return null;
                    const rColor = RARITY_COLOR[skin.rarity as Rarity] || "#4b69ff";
                    return (
                      <div
                        key={item.id}
                        className="group relative bg-[#1c2026] border border-white/5 rounded p-3 flex flex-col items-center hover:border-white/20 transition-all shadow-sm"
                        style={{ borderBottom: `3px solid ${rColor}` }}
                      >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={() => handleRemoveSkin(item.id)}
                            className="p-1 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-colors"
                            title="Удалить из инвентаря"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="absolute top-2 left-2 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/50 text-gray-400">
                          {CATEGORY_LABEL[skin.category] || skin.category}
                        </div>

                        <img src={skin.image} alt={skin.name} className="h-20 w-full object-contain my-2 group-hover:scale-105 transition-transform" />
                        <div className="text-[11px] font-medium text-gray-200 text-center leading-tight line-clamp-2 min-h-[28px] w-full">
                          {skin.name}
                        </div>

                        <div className="mt-2 flex items-center justify-between w-full text-[10px] pt-1.5 border-t border-white/5">
                          <span className="text-gray-500">{item.source || "кейс"}</span>
                          <span className="text-[#37d67a] font-bold tabular-nums">{fmtRub(skin.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SKIN PICKER MODAL (ADD ANY SKIN TO PLAYER) */}
      {/* ========================================================= */}
      {skinPickerOpen && selectedUser && (
        <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#14171b] border border-[#f7941d]/40 rounded-lg max-w-5xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(247,148,29,0.25)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-[#f7941d]/15 border border-[#f7941d]/30 flex items-center justify-center text-[#f7941d]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-[19px] font-bold uppercase tracking-wider text-white">
                    Выдать скин игроку: <span className="text-[#f7941d]">{selectedUser.username}</span>
                  </h2>
                  <div className="text-[11px] text-gray-400">
                    Выберите любой предмет из базы ({skins.length} скинов, наклеек, брелков и ножей)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSkinPickerOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Bar */}
            <div className="p-4 bg-[#1a1e24] border-b border-white/10 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={skinSearch}
                    onChange={(e) => setSkinSearch(e.target.value)}
                    placeholder="Поиск по названию (например, Titan, Lore, Lil' Ava, Howl, Doppler)..."
                    className="w-full bg-black/60 border border-white/15 rounded pl-9 pr-4 py-2 text-[13px] text-white outline-none focus:border-[#f7941d]/70 transition-colors"
                  />
                  {skinSearch && (
                    <button onClick={() => setSkinSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Rarity */}
                <select
                  value={skinRarity}
                  onChange={(e) => setSkinRarity(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded px-3 py-2 text-[12px] text-gray-200 outline-none focus:border-[#f7941d]/70"
                >
                  <option value="all">Все редкости</option>
                  <option value="gold">Крайне редкое (Золото)</option>
                  <option value="red">Тайное (Красное)</option>
                  <option value="pink">Засекреченное (Розовое)</option>
                  <option value="purple">Запрещённое (Фиолетовое)</option>
                  <option value="blue">Армейское (Синее)</option>
                </select>

                {/* Sort */}
                <select
                  value={skinSort}
                  onChange={(e) => setSkinSort(e.target.value as any)}
                  className="bg-black/60 border border-white/15 rounded px-3 py-2 text-[12px] text-gray-200 outline-none focus:border-[#f7941d]/70"
                >
                  <option value="price-desc">Сначала дорогие</option>
                  <option value="price-asc">Сначала дешёвые</option>
                  <option value="name">По названию</option>
                </select>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { id: "all", label: "Все" },
                  { id: "Stickers", label: "Наклейки" },
                  { id: "Charms", label: "Брелки" },
                  { id: "Knives", label: "Ножи" },
                  { id: "Gloves", label: "Перчатки" },
                  { id: "Rifles", label: "Винтовки" },
                  { id: "Pistols", label: "Пистолеты" },
                  { id: "Heavy/SMG", label: "SMG / Тяжёлое" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSkinCat(cat.id)}
                    className={cn(
                      "px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all",
                      skinCat === cat.id
                        ? "bg-[#f7941d] text-black shadow-[0_0_12px_rgba(247,148,29,0.4)]"
                        : "bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
                <span className="text-[11px] text-gray-500 ml-auto tabular-nums">
                  Найдено: {filteredSkins.length} скинов
                </span>
              </div>
            </div>

            {/* Skins Grid */}
            <div className="p-6 flex-1 overflow-y-auto">
              {filteredSkins.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <div className="font-bold text-[14px]">Ничего не найдено</div>
                  <div className="text-[12px] mt-1">Попробуйте изменить поисковый запрос или фильтры</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredSkins.slice(0, 150).map((s) => {
                    const rColor = RARITY_COLOR[s.rarity as Rarity] || "#4b69ff";
                    const isGiving = givingSkinId === s.id;
                    return (
                      <div
                        key={s.id}
                        className="group bg-[#1a1e24] border border-white/5 hover:border-[#f7941d]/50 rounded p-3 flex flex-col items-center justify-between transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                        style={{ borderBottom: `3px solid ${rColor}` }}
                      >
                        <div className="flex items-center justify-between w-full text-[9px] uppercase tracking-wider text-gray-400">
                          <span className="bg-black/50 px-1.5 py-0.5 rounded">{CATEGORY_LABEL[s.category] || s.category}</span>
                          <span style={{ color: rColor }} className="font-bold">{RARITY_LABEL[s.rarity as Rarity]}</span>
                        </div>

                        <div className="h-24 w-full flex items-center justify-center my-1.5 relative">
                          <img src={s.image} alt={s.name} loading="lazy" className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-200" />
                        </div>

                        <div className="text-[11px] font-semibold text-gray-200 text-center leading-tight line-clamp-2 min-h-[28px] w-full mb-2">
                          {s.name}
                        </div>

                        <div className="w-full pt-2 border-t border-white/5 flex flex-col gap-2">
                          <div className="text-[12px] font-bold text-white text-center tabular-nums">
                            {fmtRub(s.price)}
                          </div>
                          <button
                            onClick={() => handleGiveSkin(s)}
                            disabled={isGiving}
                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#f7941d] to-[#ffb340] hover:brightness-110 active:scale-95 text-black font-bold uppercase tracking-wider text-[10px] py-2 rounded transition-all disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            {isGiving ? "Выдаём..." : "Выдать"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-gray-500">
              <span>Выдача происходит моментально в активный инвентарь игрока.</span>
              <button
                onClick={() => setSkinPickerOpen(false)}
                className="px-5 py-2 rounded bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .sq-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          height: 30px;
          padding: 0 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9ca3af;
          font-size: 10px;
          font-weight: 700;
          border-radius: 3px;
          transition: all 0.15s;
        }
        .sq-btn:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
        }
        .sq-btn.orange {
          color: #f7941d;
          border-color: rgba(247, 148, 29, 0.4);
        }
        .sq-btn.orange:hover {
          background: #f7941d;
          color: #000;
        }
      `}</style>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-[#171a1e] border border-white/5 rounded-sm p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-sm bg-[#f7941d]/10 border border-[#f7941d]/25 flex items-center justify-center text-[#f7941d]">{icon}</div>
      <div>
        <div className="font-display text-[20px] font-semibold text-white leading-none tabular-nums">{value}</div>
        <div className="text-[9px] uppercase tracking-widest text-gray-600 mt-1">{label}</div>
      </div>
    </div>
  );
}
