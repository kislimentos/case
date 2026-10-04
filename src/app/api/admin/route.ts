import { NextResponse } from "next/server";
import { getDb, requireAdmin, mutate, rotateLimited } from "@/lib/jsondb";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const db = getDb();

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId");
  if (targetUserId) {
    const uid = Number(targetUserId);
    const u = db.users.find((x) => x.id === uid);
    if (!u) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    const { password, ...rest } = u;
    const userInventory = db.inventory
      .filter((i) => i.userId === uid)
      .map((item) => ({
        ...item,
        skin: db.skins.find((s) => s.id === item.skinId) || null,
      }))
      .filter((it) => it.skin !== null);

    return NextResponse.json({
      user: { ...rest, items: userInventory.length },
      inventory: userInventory,
    });
  }

  const users = db.users.map((u) => {
    const { password, ...rest } = u;
    return { ...rest, items: db.inventory.filter((i) => i.userId === u.id).length };
  });
  const cases = db.cases.map((c) => ({
    ...c,
    itemCount: db.caseItems.filter((ci) => ci.caseId === c.id).length,
  }));
  return NextResponse.json({
    users,
    cases,
    skins: db.skins,
    settings: db.settings,
    stats: {
      users: db.users.length,
      items: db.inventory.length,
      drops: db.drops.length,
      skins: db.skins.length,
      cases: db.cases.length,
    },
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "giveSkin") {
    const userId = Number(body.userId);
    const skinId = Number(body.skinId);
    if (!userId || !skinId) return NextResponse.json({ error: "Не указан userId или skinId" }, { status: 400 });

    const res = mutate((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (!u) return { error: "Пользователь не найден" };
      const s = db.skins.find((x) => x.id === skinId);
      if (!s) return { error: "Скин не найден" };

      const invId = (db.seq.inv = (db.seq.inv || 0) + 1);
      const newInvItem = {
        id: invId,
        userId: u.id,
        skinId: s.id,
        createdAt: Date.now(),
        isNew: true,
        source: "выдан админом",
      };
      db.inventory.unshift(newInvItem);

      return {
        ok: true,
        item: { ...newInvItem, skin: s },
        user: { id: u.id, username: u.username },
        skin: s,
      };
    });

    if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
    return NextResponse.json(res);
  }

  if (action === "removeSkin") {
    const inventoryId = Number(body.inventoryId);
    if (!inventoryId) return NextResponse.json({ error: "Не указан inventoryId" }, { status: 400 });

    const res = mutate((db) => {
      const idx = db.inventory.findIndex((i) => i.id === inventoryId);
      if (idx === -1) return { error: "Предмет не найден в инвентаре" };
      db.inventory.splice(idx, 1);
      return { ok: true };
    });

    if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
    return NextResponse.json(res);
  }

  if (action === "addBalance") {
    const amount = Number(body.amount) || 0;
    const res = mutate((db) => {
      const u = db.users.find((x) => x.id === body.userId);
      if (!u) return { error: "Пользователь не найден" };
      u.balance = Math.round(Math.max(0, u.balance + amount) * 100) / 100;
      return { ok: true, balance: u.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
    return NextResponse.json(res);
  }

  if (action === "toggleLimited") {
    const res = mutate((db) => {
      const c = db.cases.find((x) => x.id === body.caseId);
      if (!c) return { error: "Кейс не найден" };
      c.isLimited = !c.isLimited;
      if (c.isLimited) c.inPool = true;
      return { ok: true, isLimited: c.isLimited };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
    return NextResponse.json(res);
  }

  if (action === "refreshLimited") {
    const res = mutate((db) => {
      rotateLimited(db);
      return { ok: true, limitedExpiresAt: db.settings.limitedExpiresAt };
    });
    return NextResponse.json(res);
  }

  if (action === "setTimer") {
    const minutes = Math.max(1, Number(body.minutes) || 45);
    const res = mutate((db) => {
      db.settings.limitedMs = minutes * 60_000;
      db.settings.limitedExpiresAt = Date.now() + minutes * 60_000;
      return { ok: true, limitedExpiresAt: db.settings.limitedExpiresAt };
    });
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
