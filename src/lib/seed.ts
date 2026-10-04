import { GENERATED_SKINS } from "./generated-skins";

export type Rarity = "blue" | "purple" | "pink" | "red" | "gold";

export interface Skin {
  id: number;
  name: string;
  rarity: Rarity;
  price: number;
  image: string;
  category: string;
}
export interface CaseBox {
  id: number;
  name: string;
  price: number;
  image: string;
  hue: number;
  isNew: boolean;
  isLimited: boolean;
  inPool: boolean;
}
export interface CaseItem {
  id: number;
  caseId: number;
  skinId: number;
  weight: number;
}
export interface User {
  id: number;
  username: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  couponUsed: boolean;
  email: string;
  stats: { opened: number; upgrades: number; contracts: number; battles: number; won: number; bestDrop: number };
}
export interface InvItem {
  id: number;
  userId: number;
  skinId: number;
  createdAt: number;
  isNew: boolean;
  source: string;
}
export interface Drop {
  id: number;
  skinId: number;
  userName: string;
  source: string;
  time: number;
}
export interface DB {
  users: User[];
  skins: Skin[];
  cases: CaseBox[];
  caseItems: CaseItem[];
  inventory: InvItem[];
  drops: Drop[];
  seq: Record<string, number>;
  settings: {
    limitedExpiresAt: number;
    rotationIndex: number;
    promoCode: string;
    promoPercent: number;
    limitedMs: number;
  };
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const RANGES: Record<Rarity, [number, number]> = {
  blue: [8, 70],
  purple: [70, 450],
  pink: [450, 3000],
  red: [3000, 40000],
  gold: [40000, 700000],
};

const OVERRIDES: [string, number][] = [
  ["Dragon Lore", 850000],
  ["Howl", 520000],
  ["Gungnir", 390000],
  ["Wild Lotus", 150000],
  ["Fire Serpent", 95000],
  ["Blaze", 62000],
  ["Fade", 48000],
  ["Doppler", 185000],
  ["Printstream", 9500],
  ["Asiimov", 12500],
  ["Redline", 1600],
  ["Vulcan", 26000],
  ["Neon Rider", 18000],
  ["Hyper Beast", 7000],
  ["Neo-Noir", 4500],
  ["Kill Confirmed", 30000],
  ["The Empress", 22000],
  ["Titan (Holo)", 650000],
  ["iBUYPOWER (Holo)", 850000],
  ["Reason Gaming (Holo)", 420000],
  ["Howling Dawn", 125000],
  ["Crown (Foil)", 78000],
  ["Team Dignitas (Holo)", 195000],
  ["Diamond Dog", 38000],
  ["Die-cast AK", 26000],
  ["Baby's AK", 21000],
];

function priceFor(name: string, rarity: Rarity): number {
  for (const [m, p] of OVERRIDES) if (name.includes(m)) return p;
  const [lo, hi] = RANGES[rarity];
  const t = (hash(name) % 1000) / 1000;
  return Math.round((lo + t * (hi - lo)) * 100) / 100;
}

const CASE_DEFS: { name: string; price: number; image: string; hue: number; isNew?: boolean; limited?: boolean; pool?: boolean }[] = [
  { name: "ДЖИН ГРЕЙ", price: 39, image: "/cases/case-red.png", hue: 0 },
  { name: "ЭЙНШТЕЙН", price: 69, image: "/cases/case-blue.png", hue: 0, isNew: true },
  { name: "СКОРПИОН", price: 89, image: "/cases/case-green.png", hue: 0 },
  { name: "МЕНДЕЛЕЕВ", price: 199, image: "/cases/case-green.png", hue: 45, isNew: true },
  { name: "КАРАТЕЛЬ", price: 299, image: "/cases/case-red.png", hue: 25 },
  { name: "ДАРВИН", price: 499, image: "/cases/case-blue.png", hue: 150, isNew: true },
  { name: "ХАЛК", price: 799, image: "/cases/case-green.png", hue: 95 },
  { name: "ГАУСС", price: 1999, image: "/cases/case-blue.png", hue: 210, isNew: true },
  { name: "ЧЕЛОВЕК-ПАУК", price: 1990, image: "/cases/case-red.png", hue: 310 },
  { name: "КОПЕРНИК", price: 5999, image: "/cases/case-purple.png", hue: 0, isNew: true },
  { name: "ТОР", price: 9999, image: "/cases/case-purple.png", hue: 60 },
  { name: "ДРАКОН", price: 14999, image: "/cases/case-gold.png", hue: 0, limited: true, pool: true },
  { name: "ЗОЛОТОЙ ЗАКАТ", price: 6999, image: "/cases/case-gold.png", hue: 40, pool: true },
  { name: "НОЧНОЙ ОХОТНИК", price: 3499, image: "/cases/case-purple.png", hue: 120, pool: true },
  { name: "БУРЯ", price: 49, image: "/cases/case-blue.png", hue: 200, isNew: true, pool: true },
  { name: "ФАНТОМ", price: 129, image: "/cases/case-purple.png", hue: 270 },
  { name: "ТИТАН", price: 249, image: "/cases/case-red.png", hue: 180, isNew: true },
  { name: "ПРИЗРАК", price: 449, image: "/cases/case-green.png", hue: 300 },
  { name: "МОЛНИЯ", price: 749, image: "/cases/case-blue.png", hue: 50, isNew: true },
  { name: "КОБРА", price: 1299, image: "/cases/case-red.png", hue: 140 },
  { name: "ФЕНИКС", price: 2499, image: "/cases/case-gold.png", hue: 20, isNew: true, pool: true },
  { name: "АЦТЕК", price: 3999, image: "/cases/case-purple.png", hue: 200, pool: true },
  { name: "ТЕМНЫЙ РЫЦАРЬ", price: 7999, image: "/cases/case-gold.png", hue: 280, isNew: true, pool: true },
  { name: "НЕПТУН", price: 12999, image: "/cases/case-blue.png", hue: 320, pool: true },
  { name: "КАПСУЛА НАКЛЕЕК KATOWICE", price: 2490, image: "/cases/case-sticker.png", hue: 0, isNew: true, pool: true },
  { name: "СТИКЕР-БОМБИНГ", price: 189, image: "/cases/case-sticker.png", hue: 140, isNew: true },
  { name: "КОЛЛЕКЦИЯ БРЕЛКОВ (CHARMS)", price: 890, image: "/cases/case-charm.png", hue: 0, isNew: true, pool: true },
  { name: "KILOWATT CASE", price: 490, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnEVvqf_a6VoIfGSXz7Hlbwg57QwSS_mxhl15jiGyN37c3_GZw91W8BwRflK7EfKsa2sfw", hue: 0, isNew: true },
  { name: "REVOLUTION CASE", price: 390, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnAVvfb6aqduc_TFVjTCxbx05OU4S3jilE9w4DzRnImtIy2Sa1JzDJEhRPlK7EcO4U8gfA", hue: 0, isNew: true },
  { name: "DREAMS & NIGHTMARES", price: 649, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnIV7Kb5OaU-JqfHDzXFle0u4LY8Gy_kkRgisGzcm4v4J3vDOAQmDMdyRvlK7EcmeCU3yw", hue: 0, isNew: true, pool: true },
  { name: "ЗОЛОТАЯ ЛИХОРАДКА (GOLD RUSH)", price: 18999, image: "/cases/case-gold.png", hue: 30, isNew: true, limited: true, pool: true },
  { name: "АРСЕНАЛ CS2", price: 1490, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_fr3QV7aD7OP01IfbGDzPCmbsm4LU5GnvkzUsi4WvUmIqtci_CPQNyApsjE_lK7EfrhW545A", hue: 0, isNew: true, pool: true },
];

function tierWeights(price: number): Record<Rarity, number> {
  if (price < 100) return { blue: 70, purple: 22, pink: 6, red: 1.8, gold: 0.2 };
  if (price < 500) return { blue: 55, purple: 27, pink: 12, red: 5, gold: 1 };
  if (price < 3000) return { blue: 40, purple: 30, pink: 17, red: 10, gold: 3 };
  return { blue: 30, purple: 30, pink: 20, red: 14, gold: 6 };
}

export function buildSeed(): DB {
  const now = Date.now();
  const skins: Skin[] = GENERATED_SKINS.map((s, i) => ({
    id: i + 1,
    name: s.name,
    rarity: s.rarity as Rarity,
    price: priceFor(s.name, s.rarity as Rarity),
    image: s.image,
    category: s.category,
  }));

  const cases: CaseBox[] = CASE_DEFS.map((c, i) => ({
    id: i + 1,
    name: c.name,
    price: c.price,
    image: c.image,
    hue: c.hue,
    isNew: !!c.isNew,
    isLimited: !!c.limited,
    inPool: !!c.pool,
  }));

  const caseItems: CaseItem[] = [];
  let ciId = 1;
  const counts: Record<Rarity, number> = { blue: 12, purple: 10, pink: 8, red: 6, gold: 5 };
  for (const c of cases) {
    const w = tierWeights(c.price);
    (Object.keys(counts) as Rarity[]).forEach((r, ri) => {
      const pool = skins.filter((s) => s.rarity === r);
      const n = counts[r];
      for (let i = 0; i < n; i++) {
        const skin = pool[(c.id * 7 + ri * 3 + i * 5) % pool.length];
        if (!skin) continue;
        if (caseItems.some((x) => x.caseId === c.id && x.skinId === skin.id)) continue;
        caseItems.push({
          id: ciId++,
          caseId: c.id,
          skinId: skin.id,
          weight: Math.round((w[r] / n) * 100) / 100,
        });
      }
    });
  }

  const users: User[] = [
    {
      id: 1,
      username: "admin",
      password: "admin",
      balance: 1000000,
      isAdmin: true,
      couponUsed: false,
      email: "",
      stats: { opened: 0, upgrades: 0, contracts: 0, battles: 0, won: 0, bestDrop: 0 },
    },
    {
      id: 2,
      username: "UMBRAxxx",
      password: "123",
      balance: 1272.5,
      isAdmin: false,
      couponUsed: false,
      email: "",
      stats: { opened: 11, upgrades: 3, contracts: 1, battles: 6, won: 9, bestDrop: 18500 },
    },
  ];

  const inventory: InvItem[] = [4, 11, 23, 36, 49, 62].map((sid, i) => ({
    id: i + 1,
    userId: 2,
    skinId: sid,
    createdAt: now - (i + 1) * 3600_000,
    isNew: i < 2,
    source: "кейс",
  }));

  const dropUsers = ["UMBRAxxx", "xXiproXx", "s1mple_fan", "Kolya777", "DragonLord", "Mira", "STORM", "v1ct0r", "Akira", "NoName"];
  const sources = ["кейс", "апгрейд", "контракт", "баттл"];
  const drops: Drop[] = Array.from({ length: 28 }).map((_, i) => {
    const skin = skins[(i * 13 + 5) % skins.length];
    return {
      id: i + 1,
      skinId: skin.id,
      userName: dropUsers[i % dropUsers.length],
      source: sources[i % sources.length],
      time: now - i * 137_000,
    };
  });

  return {
    users,
    skins,
    cases,
    caseItems,
    inventory,
    drops,
    seq: {
      user: 3,
      skin: skins.length + 1,
      case: cases.length + 1,
      caseItem: ciId,
      inv: inventory.length + 1,
      drop: drops.length + 1,
    },
    settings: {
      limitedExpiresAt: now + 45 * 60_000,
      rotationIndex: 0,
      promoCode: "STORM-12",
      promoPercent: 12,
      limitedMs: 45 * 60_000,
    },
  };
}
