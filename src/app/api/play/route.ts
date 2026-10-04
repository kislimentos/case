import { NextResponse } from "next/server";
import {
  getDb,
  currentUser,
  mutate,
  rollCaseSkin,
  pushDrop,
  giveItem,
  type Rarity,
} from "@/lib/jsondb";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Нужен вход в аккаунт" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const mode = body.mode as string;

  /* ---------------- CASE OPEN ---------------- */
  if (mode === "open") {
    const res = mutate((db) => {
      const c = db.cases.find((x) => x.id === body.caseId);
      const user = db.users.find((x) => x.id === u.id)!;
      if (!c) return { error: "Кейс не найден" };
      if (user.balance < c.price) return { error: "Недостаточно средств" };
      const skin = rollCaseSkin(db, c.id);
      if (!skin) return { error: "Пустой кейс" };
      user.balance = Math.round((user.balance - c.price) * 100) / 100;
      user.stats.opened += 1;
      if (skin.price > user.stats.bestDrop) user.stats.bestDrop = skin.price;
      giveItem(db, user.id, skin.id, "кейс");
      pushDrop(db, skin, user.username, "кейс");
      return { ok: true, skin, balance: user.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  }

  /* ---------------- UPGRADER ---------------- */
  if (mode === "upgrade") {
    const res = mutate((db) => {
      const user = db.users.find((x) => x.id === u.id)!;
      const item = db.inventory.find((i) => i.id === body.inventoryId && i.userId === u.id);
      const target = db.skins.find((s) => s.id === body.targetSkinId);
      const add = Math.max(0, Number(body.addBalance) || 0);
      if (!item) return { error: "Предмет не найден" };
      const srcSkin = db.skins.find((s) => s.id === item.skinId)!;
      if (!target) return { error: "Цель не выбрана" };
      if (target.price <= srcSkin.price + add) return { error: "Цель должна быть дороже ставки" };
      if (user.balance < add) return { error: "Недостаточно средств" };
      const stake = srcSkin.price + add;
      const chance = Math.min(0.95, stake / target.price);
      const roll = Math.random();
      const success = roll < chance;
      user.balance = Math.round((user.balance - add) * 100) / 100;
      db.inventory = db.inventory.filter((i) => i.id !== item.id);
      user.stats.upgrades += 1;
      if (success) {
        user.stats.won += 1;
        if (target.price > user.stats.bestDrop) user.stats.bestDrop = target.price;
        giveItem(db, user.id, target.id, "апгрейд");
        pushDrop(db, target, user.username, "апгрейд");
      }
      return { ok: true, success, rolled: roll * 100, chance: chance * 100, skin: target, balance: user.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  }

  /* ---------------- CONTRACT ---------------- */
  if (mode === "contract") {
    const res = mutate((db) => {
      const user = db.users.find((x) => x.id === u.id)!;
      const ids: number[] = Array.isArray(body.inventoryIds) ? body.inventoryIds : [];
      if (ids.length < 3 || ids.length > 10) return { error: "Нужно от 3 до 10 предметов" };
      const items = db.inventory.filter((i) => ids.includes(i.id) && i.userId === u.id);
      if (items.length !== ids.length) return { error: "Предметы не найдены" };
      const add = Math.max(0, Number(body.addBalance) || 0);
      if (user.balance < add) return { error: "Недостаточно средств" };
      const sum = items.reduce((a, i) => a + (db.skins.find((s) => s.id === i.skinId)?.price || 0), 0) + add;
      user.balance = Math.round((user.balance - add) * 100) / 100;
      db.inventory = db.inventory.filter((i) => !ids.includes(i.id));

      const pref = body.rarity as Rarity | undefined;
      const rarities: Rarity[] = ["blue", "purple", "pink", "red", "gold"];
      let rarity: Rarity = pref && rarities.includes(pref) ? pref : rarities[Math.min(4, Math.floor(Math.random() * 5))];
      let pool = db.skins.filter((s) => s.rarity === rarity);
      if (pool.length === 0) pool = db.skins;
      const goal = sum * 1.15;
      pool = [...pool].sort((a, b) => Math.abs(a.price - goal) - Math.abs(b.price - goal));
      const pickTop = pool.slice(0, Math.max(3, Math.floor(pool.length * 0.25)));
      const skin = pickTop[Math.floor(Math.random() * pickTop.length)];
      user.stats.contracts += 1;
      if (skin.price > user.stats.bestDrop) user.stats.bestDrop = skin.price;
      giveItem(db, user.id, skin.id, "контракт");
      pushDrop(db, skin, user.username, "контракт");
      return { ok: true, skin, sum, balance: user.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  }

  /* ---------------- CASE BATTLE ---------------- */
  if (mode === "battle") {
    const res = mutate((db) => {
      const c = db.cases.find((x) => x.id === body.caseId);
      const user = db.users.find((x) => x.id === u.id)!;
      if (!c) return { error: "Кейс не найден" };
      if (user.balance < c.price) return { error: "Недостаточно средств" };
      const userSkin = rollCaseSkin(db, c.id);
      const botSkin = rollCaseSkin(db, c.id);
      if (!userSkin || !botSkin) return { error: "Ошибка боя" };
      user.balance = Math.round((user.balance - c.price) * 100) / 100;
      user.stats.battles += 1;
      const winner = userSkin.price >= botSkin.price ? "user" : "bot";
      if (winner === "user") {
        user.stats.won += 1;
        const best = Math.max(userSkin.price, botSkin.price);
        if (best > user.stats.bestDrop) user.stats.bestDrop = best;
        giveItem(db, user.id, userSkin.id, "баттл");
        giveItem(db, user.id, botSkin.id, "баттл");
        pushDrop(db, userSkin, user.username, "баттл");
      } else {
        pushDrop(db, botSkin, "GRIM BOT", "баттл");
      }
      return { ok: true, userSkin, botSkin, winner, balance: user.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  }

  /* ---------------- PROMO COUPON ---------------- */
  if (mode === "coupon") {
    const res = mutate((db) => {
      const user = db.users.find((x) => x.id === u.id)!;
      const code = String(body.code || "").trim().toUpperCase();
      if (code !== db.settings.promoCode) return { error: "Промокод не найден" };
      if (user.couponUsed) return { error: "Купон уже использован" };
      const bonus = Math.round(user.balance * (db.settings.promoPercent / 100) * 100) / 100;
      user.balance = Math.round((user.balance + bonus) * 100) / 100;
      user.couponUsed = true;
      return { ok: true, bonus, balance: user.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
}
