/**
 * Scraper de véhicules — extrait fiches & photos depuis Avito, Moteur.ma, Wandaloo.
 * Photos téléchargées en local : frontend/public/uploads/scraped/<ville>/<slug>/
 * Persistance en base : Vehicle.isScraped = true, isApproved = false (modération admin).
 *
 * Variables d'env :
 *   SCRAPE_VEHICLES_SITES   "avito,moteur,wandaloo"  (par défaut : all)
 *   SCRAPE_VEHICLES_PAGES   "5"                       (pages par catégorie sur Avito)
 *   SCRAPE_VEHICLES_LIMIT   "20"                      (max véhicules par catégorie pour smoke test)
 *   SCRAPE_VEHICLES_PERSIST "true|false"              (insérer en DB)
 *   SCRAPE_VEHICLES_CITY    "Casablanca"              (filtre côté insertion)
 *
 * Usage :
 *   npm run scrape:vehicles
 *   SCRAPE_VEHICLES_SITES=avito SCRAPE_VEHICLES_LIMIT=5 npm run scrape:vehicles
 */
import "dotenv/config";
import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { PrismaClient, VehicleCategory } from "@prisma/client";

const prisma = new PrismaClient();

// ──────────────── Constantes ────────────────
const FRONTEND_PUBLIC = path.resolve(__dirname, "..", "..", "frontend", "public");
const PHOTO_BASE_DIR = path.join(FRONTEND_PUBLIC, "uploads", "scraped");
const EXPORTS_DIR = path.resolve(__dirname, "..", "exports");
const ERROR_LOG = path.join(EXPORTS_DIR, "scrape-vehicles-errors.log");
const JSON_OUT = path.join(EXPORTS_DIR, "vehicles-scraped.json");

if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });
if (!fs.existsSync(PHOTO_BASE_DIR)) fs.mkdirSync(PHOTO_BASE_DIR, { recursive: true });

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.2210.91",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:122.0) Gecko/20100101 Firefox/122.0",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => 3000 + Math.floor(Math.random() * 2500);
const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function logError(ctx: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  fs.appendFileSync(ERROR_LOG, `[${new Date().toISOString()}] ${ctx}: ${msg}\n`);
  console.error("⚠️ ", ctx, "—", msg);
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T | null> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      logError(`${label} (try ${i}/${attempts})`, err);
      if (i < attempts) await sleep(randomDelay() * i);
    }
  }
  return null;
}

// ──────────────── Helpers ────────────────
type ScrapedVehicle = {
  titre: string;
  categorie: "voiture" | "moto" | "bateau" | "jetski";
  ville: string;
  prix: number;
  devise: "MAD";
  photos: string[];        // URLs distantes
  photosLocales: string[]; // chemins relatifs servis par Next (/uploads/scraped/...)
  description: string;
  telephone: string;
  source: string;
  source_url: string;
  date_scrape: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "vehicule";
}

function extFromUrl(u: string): string {
  const m = u.split("?")[0].match(/\.(jpe?g|png|webp)$/i);
  return m ? m[1].toLowerCase() : "jpg";
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": pickUA(),
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadFile(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function downloadPhotos(
  urls: string[],
  ville: string,
  titre: string,
  cat: ScrapedVehicle["categorie"]
): Promise<string[]> {
  const dir = path.join(PHOTO_BASE_DIR, slugify(ville), slugify(titre));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const out: string[] = [];

  for (let i = 0; i < Math.min(urls.length, 6); i++) {
    const url = urls[i];
    if (!/^https?:/.test(url)) continue;
    const filename = `${cat}-${slugify(titre)}-${slugify(ville)}-${i + 1}.${extFromUrl(url)}`;
    const dest = path.join(dir, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      // déjà téléchargé
      out.push(`/uploads/scraped/${slugify(ville)}/${slugify(titre)}/${filename}`);
      continue;
    }
    try {
      await downloadFile(url, dest);
      // Vérif taille minimale (filtre placeholders / 1x1)
      if (fs.statSync(dest).size < 3000) {
        fs.unlinkSync(dest);
        continue;
      }
      out.push(`/uploads/scraped/${slugify(ville)}/${slugify(titre)}/${filename}`);
    } catch (e) {
      logError(`download ${url}`, e);
    }
    await sleep(400);
  }
  return out;
}

async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(pickUA());
  await page.setViewport({ width: 1366, height: 900 });
  await page.setExtraHTTPHeaders({ "Accept-Language": "fr-MA,fr;q=0.9,en;q=0.8" });
  return page;
}

// ──────────────── Avito ────────────────
type AvitoCat = { slug: string; cat: ScrapedVehicle["categorie"]; label: string };
const AVITO_CATEGORIES: AvitoCat[] = [
  { slug: "voitures-_-location", cat: "voiture", label: "voiture" },
  { slug: "motos-_-location",    cat: "moto",    label: "moto" },
  { slug: "bateaux-_-location",  cat: "bateau",  label: "bateau" },
];

async function scrapeAvitoListing(
  browser: Browser,
  acat: AvitoCat,
  maxPages: number,
  limit: number
): Promise<ScrapedVehicle[]> {
  const results: ScrapedVehicle[] = [];

  for (let p = 1; p <= maxPages && results.length < limit; p++) {
    const url = `https://www.avito.ma/fr/maroc/${acat.slug}?o=${p}`;
    const ok = await withRetry(`avito list ${acat.cat} p${p}`, async () => {
      const page = await newPage(browser);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
      await sleep(2000);

      const links: string[] = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='/fr/']"));
        const uniq = new Set<string>();
        for (const a of anchors) {
          const href = a.href;
          if (/^https?:\/\/(www\.)?avito\.ma\/fr\/.+/.test(href) && !/listing|categorie|maroc\//.test(href)) {
            uniq.add(href.split("?")[0]);
          }
        }
        return Array.from(uniq).slice(0, 30);
      });

      await page.close();
      console.log(`  📄 Avito ${acat.cat} p${p} : ${links.length} annonces détectées`);

      for (const link of links) {
        if (results.length >= limit) break;
        const item = await scrapeAvitoDetail(browser, link, acat.cat);
        if (item) results.push(item);
        await sleep(randomDelay());
      }
      return true;
    });

    if (!ok) break;
    await sleep(randomDelay());
  }

  return results;
}

async function scrapeAvitoDetail(
  browser: Browser,
  url: string,
  cat: ScrapedVehicle["categorie"]
): Promise<ScrapedVehicle | null> {
  return await withRetry(`avito detail ${url}`, async () => {
    const page = await newPage(browser);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
      await sleep(1500);

      const data = await page.evaluate(() => {
        const text = (sel: string) =>
          (document.querySelector(sel) as HTMLElement)?.innerText?.trim() || "";
        const all = (sel: string) =>
          Array.from(document.querySelectorAll<HTMLElement>(sel)).map((e) => e.innerText.trim()).filter(Boolean);

        const titre =
          text("h1") ||
          text("[data-testid='ad-title']") ||
          document.title.replace(/ \| Avito.*$/i, "");

        const bodyText = document.body.innerText;
        const priceM = bodyText.match(/(\d[\d\s.,]{1,9})\s?(DH|MAD)/i);
        const prix = priceM ? parseInt(priceM[1].replace(/[\s.,]/g, ""), 10) : 0;

        const phoneM = bodyText.match(/\+?212[\s.-]?\d{1,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}|0[5-7][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/);

        const localityEl = document.querySelector("[data-testid='ad-location'], .sc-location, address, [class*='Location']");
        const ville = (localityEl as HTMLElement | null)?.innerText?.trim() || "";

        const descEl = document.querySelector("[data-testid='ad-description'], .description, [class*='Description']");
        const description = (descEl as HTMLElement | null)?.innerText?.trim() ||
                            all("p").slice(0, 3).join(" ");

        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"))
          .map((i) => i.src || i.getAttribute("data-src") || "")
          .filter((s) => /^https?:.+\.(jpe?g|png|webp)/i.test(s))
          .filter((s) => !/icon|logo|avatar|sprite|favicon/i.test(s));

        return {
          titre,
          prix,
          ville,
          description,
          phone: phoneM?.[0] || "",
          imgs: Array.from(new Set(imgs)).slice(0, 8),
        };
      });

      await page.close();

      if (!data.titre || !data.imgs.length) return null;

      const ville = data.ville.split(/[,\n]/)[0].trim() || "Maroc";
      const photosLocales = await downloadPhotos(data.imgs, ville, data.titre, cat);
      if (!photosLocales.length) return null;

      return {
        titre: data.titre.slice(0, 120),
        categorie: cat,
        ville,
        prix: data.prix,
        devise: "MAD",
        photos: data.imgs,
        photosLocales,
        description: data.description.slice(0, 1000),
        telephone: data.phone,
        source: "avito.ma",
        source_url: url,
        date_scrape: new Date().toISOString(),
      };
    } catch (e) {
      await page.close().catch(() => {});
      throw e;
    }
  });
}

// ──────────────── Moteur.ma ────────────────
async function scrapeMoteur(browser: Browser, limit: number): Promise<ScrapedVehicle[]> {
  const url = "https://www.moteur.ma/fr/voiture/location-de-voiture/";
  const result: ScrapedVehicle[] = [];
  const ok = await withRetry("moteur.ma", async () => {
    const page = await newPage(browser);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    await sleep(2500);
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));
      return Array.from(new Set(
        anchors.map((a) => a.href).filter((h) => /moteur\.ma.*location.*\/\d+|fiche|detail/i.test(h))
      )).slice(0, 20);
    });
    await page.close();
    console.log(`  📄 Moteur.ma : ${links.length} annonces`);

    for (const link of links) {
      if (result.length >= limit) break;
      const item = await scrapeGenericDetail(browser, link, "voiture", "moteur.ma");
      if (item) result.push(item);
      await sleep(randomDelay());
    }
    return true;
  });
  if (!ok) return [];
  return result;
}

// ──────────────── Wandaloo ────────────────
async function scrapeWandaloo(browser: Browser, limit: number): Promise<ScrapedVehicle[]> {
  const url = "https://www.wandaloo.com/location-voiture-maroc/";
  const result: ScrapedVehicle[] = [];
  const ok = await withRetry("wandaloo", async () => {
    const page = await newPage(browser);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    await sleep(2500);
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));
      return Array.from(new Set(
        anchors.map((a) => a.href).filter((h) => /wandaloo\.com\/location/i.test(h) && /[a-z]/.test(h))
      )).slice(0, 20);
    });
    await page.close();
    console.log(`  📄 Wandaloo : ${links.length} annonces`);

    for (const link of links) {
      if (result.length >= limit) break;
      const item = await scrapeGenericDetail(browser, link, "voiture", "wandaloo.com");
      if (item) result.push(item);
      await sleep(randomDelay());
    }
    return true;
  });
  if (!ok) return [];
  return result;
}

async function scrapeGenericDetail(
  browser: Browser,
  url: string,
  cat: ScrapedVehicle["categorie"],
  source: string
): Promise<ScrapedVehicle | null> {
  return await withRetry(`${source} detail ${url}`, async () => {
    const page = await newPage(browser);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(1500);
      const data = await page.evaluate(() => {
        const titre = (document.querySelector("h1") as HTMLElement | null)?.innerText?.trim() ||
                      document.title.split(/[|—]/)[0].trim();
        const bodyText = document.body.innerText;
        const priceM = bodyText.match(/(\d[\d\s.,]{1,9})\s?(DH|MAD)/i);
        const prix = priceM ? parseInt(priceM[1].replace(/[\s.,]/g, ""), 10) : 0;
        const phoneM = bodyText.match(/\+?212[\s.-]?\d{1,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}|0[5-7][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/);
        const cityM = bodyText.match(/\b(Casablanca|Marrakech|Agadir|Rabat|Tanger|F[eè]s|Mekn[eè]s|Oujda|Kenitra|Safi|El\s?Jadida|Laayoune|Chefchaouen|Essaouira|Dakhla|Ifrane|Khouribga|Mdiq|Nador)\b/i);
        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"))
          .map((i) => i.src || i.getAttribute("data-src") || "")
          .filter((s) => /^https?:.+\.(jpe?g|png|webp)/i.test(s))
          .filter((s) => !/icon|logo|avatar|sprite|favicon|placeholder/i.test(s));
        const descEl = document.querySelector(".description, .desc, [class*='description'], article p");
        return {
          titre,
          prix,
          ville: cityM?.[1] || "",
          phone: phoneM?.[0] || "",
          description: (descEl as HTMLElement | null)?.innerText?.trim() || "",
          imgs: Array.from(new Set(imgs)).slice(0, 8),
        };
      });

      await page.close();
      if (!data.titre || !data.imgs.length) return null;
      const ville = data.ville || "Maroc";
      const photosLocales = await downloadPhotos(data.imgs, ville, data.titre, cat);
      if (!photosLocales.length) return null;

      return {
        titre: data.titre.slice(0, 120),
        categorie: cat,
        ville,
        prix: data.prix,
        devise: "MAD",
        photos: data.imgs,
        photosLocales,
        description: data.description.slice(0, 1000),
        telephone: data.phone,
        source,
        source_url: url,
        date_scrape: new Date().toISOString(),
      };
    } catch (e) {
      await page.close().catch(() => {});
      throw e;
    }
  });
}

// ──────────────── Persistance DB ────────────────
async function getOrCreateScraperAgency(source: string) {
  const slug = source.replace(/[^a-z0-9]/gi, "");
  const email = `scraper-${slug}@rentaway.ma`;
  const existing = await prisma.user.findUnique({ where: { email }, include: { agency: true } });
  if (existing?.agency) return existing.agency;

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.default.hash(`Scraped-${slug}-${Date.now()}`, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "LOUEUR",
      firstName: "Source",
      lastName: source,
      isVerified: false,
      agency: {
        create: {
          name: `Source: ${source}`,
          registreCommerce: `SCRAPED-${slug.toUpperCase()}`,
          address: "Importé depuis " + source,
          city: "Maroc",
          isApproved: false,
          isDemo: false,
          description: `Annonces importées depuis ${source}. À valider par l'administrateur.`,
        },
      },
    },
    include: { agency: true },
  });
  return user.agency!;
}

const CAT_MAP: Record<string, VehicleCategory> = {
  voiture: "VOITURE",
  moto: "MOTO",
  bateau: "BATEAU",
  jetski: "JETSKI",
};

async function persistDB(items: ScrapedVehicle[]) {
  let inserted = 0;
  for (const v of items) {
    try {
      const agency = await getOrCreateScraperAgency(v.source);
      await prisma.vehicle.create({
        data: {
          agencyId: agency.id,
          category: CAT_MAP[v.categorie],
          title: v.titre,
          description: v.description || `${v.titre} disponible à ${v.ville}.`,
          images: v.photosLocales,
          pricePerDay: v.prix || 500,
          caution: (v.prix || 500) * 2,
          city: v.ville,
          isAvailable: true,
          isDemo: false,
          isScraped: true,
          isApproved: false,  // modération requise
          sourceUrl: v.source_url,
          sourcePhone: v.telephone || null,
          specs: { source: v.source, devise: v.devise },
          requiredLicense: v.categorie === "voiture" ? "B" : v.categorie === "moto" ? "A2" : "Aucun",
        },
      });
      inserted++;
    } catch (e) {
      logError(`DB insert ${v.titre}`, e);
    }
  }
  console.log(`💾 ${inserted}/${items.length} véhicules insérés en base`);
}

// ──────────────── Main ────────────────
async function main() {
  const sites = (process.env.SCRAPE_VEHICLES_SITES || "avito,moteur,wandaloo")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const pages = parseInt(process.env.SCRAPE_VEHICLES_PAGES || "5", 10);
  const limit = parseInt(process.env.SCRAPE_VEHICLES_LIMIT || "20", 10);
  const persist = process.env.SCRAPE_VEHICLES_PERSIST !== "false";

  console.log("🔎 Scraper véhicules");
  console.log(`   Sites    : ${sites.join(", ")}`);
  console.log(`   Pages    : ${pages}`);
  console.log(`   Limit    : ${limit} véhicules/catégorie`);
  console.log(`   Persist  : ${persist ? "OUI (DB)" : "NON (JSON seul)"}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=fr-FR"],
  });

  const collected: ScrapedVehicle[] = [];

  try {
    if (sites.includes("avito")) {
      for (const acat of AVITO_CATEGORIES) {
        console.log(`\n🚗 Avito → ${acat.label}...`);
        const items = await scrapeAvitoListing(browser, acat, pages, limit);
        collected.push(...items);
        // export intermédiaire
        fs.writeFileSync(JSON_OUT, JSON.stringify(collected, null, 2), "utf8");
        console.log(`   ✓ ${items.length} véhicules ${acat.label} — total cumulé : ${collected.length}`);
      }
    }
    if (sites.includes("moteur")) {
      console.log(`\n🚗 Moteur.ma...`);
      const items = await scrapeMoteur(browser, limit);
      collected.push(...items);
      fs.writeFileSync(JSON_OUT, JSON.stringify(collected, null, 2), "utf8");
      console.log(`   ✓ ${items.length} véhicules — total cumulé : ${collected.length}`);
    }
    if (sites.includes("wandaloo")) {
      console.log(`\n🚗 Wandaloo...`);
      const items = await scrapeWandaloo(browser, limit);
      collected.push(...items);
      fs.writeFileSync(JSON_OUT, JSON.stringify(collected, null, 2), "utf8");
      console.log(`   ✓ ${items.length} véhicules — total cumulé : ${collected.length}`);
    }

    fs.writeFileSync(JSON_OUT, JSON.stringify(collected, null, 2), "utf8");
    console.log(`\n📦 ${collected.length} véhicules exportés → ${JSON_OUT}`);

    if (persist && collected.length > 0) {
      await persistDB(collected);
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n✅ Terminé");
}

main().catch((e) => {
  logError("FATAL", e);
  process.exit(1);
});
