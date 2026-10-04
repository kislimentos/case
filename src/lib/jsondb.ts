import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { buildSeed, type DB, type Rarity, type Skin, type User } from "./seed";

export type { DB, Rarity, Skin, User, CaseBox, CaseItem, InvItem, Drop } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "grimbattle.json");

const globalCache = globalThis as typeof globalThis & { __gb_db?: DB };

export { RARITY_COLOR, RARITY_LABEL, CATEGORY_LABEL, fmtRub, fmtNum, timeLeft } from "./ui";

function load(): DB {
  if (globalCache.__gb_db) return globalCache.__gb_db;
  let db: DB;
  try {
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as DB;
    } else {
      db = buildSeed();
      persist(db);
    }
  } catch {
    db = buildSeed();
    persist(db);
  }
  globalCache.__gb_db = db;
  return db;
}

function persist(db: DB) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db));
}

export function saveDb() {
  const db = globalCache.__gb_db;
  if (db) persist(db);
}

/** Get DB, applying the limited-case rotation timer if it expired. */
export function getDb(): DB {
  const db = load();
  if (Date.now() > db.settings.limitedExpiresAt) {
    rotateLimited(db);
    persist(db);
  }
  return db;
}

export function mutate<T>(fn: (db: DB) => T): T {
  const db = getDb();
  const res = fn(db);
  persist(db);
  return res;
}

export function nextId(db: DB, key: string): number {
  db.seq[key] = (db.seq[key] || 0) + 1;
  return db.seq[key];
}

export function rotateLimited(db: DB) {
  const pool = db.cases.filter((c) => c.inPool).map((c) => c.id);
  if (pool.length === 0) return;
  const idx = db.settings.rotationIndex % pool.length;
  const a = pool[idx];
  const b = pool[(idx + 1) % pool.length];
  db.cases.forEach((c) => {
    c.isLimited = c.id === a || c.id === b;
  });
  db.settings.rotationIndex += 1;
  db.settings.limitedExpiresAt = Date.now() + db.settings.limitedMs;
}

/* ---------- auth ---------- */

export async function currentUser(): Promise<User | null> {
  const store = await cookies();
  const sid = store.get("gb_session")?.value;
  if (!sid) return null;
  const db = getDb();
  return db.users.find((u) => String(u.id) === sid) || null;
}

export async function requireAdmin(): Promise<User | null> {
  const u = await currentUser();
  return u && u.isAdmin ? u : null;
}

export async function setSession(userId: number | null) {
  const store = await cookies();
  if (userId === null) store.delete("gb_session");
  else store.set("gb_session", String(userId), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

/* ---------- game logic ---------- */

export function rollCaseSkin(db: DB, caseId: number): Skin | null {
  const items = db.caseItems.filter((ci) => ci.caseId === caseId);
  if (items.length === 0) return null;
  const total = items.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if (r < it.weight) return db.skins.find((s) => s.id === it.skinId) || null;
    r -= it.weight;
  }
  return db.skins.find((s) => s.id === items[items.length - 1].skinId) || null;
}

export function pushDrop(db: DB, skin: Skin, userName: string, source: string) {
  db.drops.unshift({ id: nextId(db, "drop"), skinId: skin.id, userName, source, time: Date.now() });
  if (db.drops.length > 60) db.drops.length = 60;
}

export function giveItem(db: DB, userId: number, skinId: number, source: string) {
  db.inventory.unshift({ id: nextId(db, "inv"), userId, skinId, createdAt: Date.now(), isNew: true, source });
}

/* formatting helpers live in ./ui (client-safe) and are re-exported above */
