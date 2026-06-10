/**
 * Scraper de prospection — extrait les coordonnées d'agences de location au Maroc.
 * Sources : annuaires publics (Pages Jaunes, Google Maps) et sites publics d'agences.
 * Respecte un délai entre requêtes, alterne le user-agent, retente x3 sur timeout.
 *
 * Usage : npm run scrape:prospects
 */
import "dotenv/config";
import puppeteer, { Browser, Page } from "puppeteer";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXPORTS_DIR = path.join(__dirname, "..", "exports");
const ERROR_LOG = path.join(EXPORTS_DIR, "errors.log");
const CSV_PATH = path.join(EXPORTS_DIR, "agences_maroc.csv");
const JSON_PATH = path.join(EXPORTS_DIR, "agences_maroc.json");

if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const ALL_CITIES = [
  "Agadir", "Al Hoceïma", "Béni Mellal", "Berkane", "Casablanca",
  "Chefchaouen", "Dakhla", "El Jadida", "Essaouira", "Fès",
  "Guelmim", "Guercif", "Ifrane", "Kenitra", "Khouribga",
  "Laâyoune", "Marrakech", "Mdiq", "Meknès", "Nador",
  "Ouarzazate", "Oujda", "Rabat", "Safi", "Tanger",
  "Taourirt", "Tétouan",
];

// Permet de scoper le test via env :
//   SCRAPE_CITIES="Casablanca,Oujda" npm run scrape:prospects
const CITIES = process.env.SCRAPE_CITIES
  ? process.env.SCRAPE_CITIES.split(",").map((s) => s.trim()).filter(Boolean)
  : ALL_CITIES;

const QUERIES = [
  "agence location voiture",
  "location moto",
  "location bateau",
  "location jet ski",
  "agence location voiture Oujda",
  "agence location voiture Berkane",
  "agence location voiture Nador",
  "location moto Oujda",
  "location jet ski Oujda",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0",
];

type Prospect = {
  nom_agence: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string;
  categories: string[];
  source_url: string;
  date_scrape: string;
};

const collected: Prospect[] = [];
const seen = new Set<string>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => 2000 + Math.floor(Math.random() * 3000);
const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function logError(context: string, error: unknown) {
  const line = `[${new Date().toISOString()}] ${context}: ${error instanceof Error ? error.message : String(error)}\n`;
  fs.appendFileSync(ERROR_LOG, line);
  console.error("⚠️ ", context, "—", error instanceof Error ? error.message : error);
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

function categoryFromQuery(query: string): string {
  if (query.includes("moto")) return "MOTO";
  if (query.includes("jet")) return "JETSKI";
  if (query.includes("bateau")) return "BATEAU";
  return "VOITURE";
}

function dedupKey(p: Pick<Prospect, "nom_agence" | "ville" | "telephone">) {
  return `${p.nom_agence.toLowerCase().trim()}|${p.ville.toLowerCase()}|${p.telephone}`;
}

function addProspect(p: Prospect) {
  const k = dedupKey(p);
  if (seen.has(k)) {
    const existing = collected.find((c) => dedupKey(c) === k);
    if (existing) {
      for (const cat of p.categories) {
        if (!existing.categories.includes(cat)) existing.categories.push(cat);
      }
    }
    return;
  }
  seen.add(k);
  collected.push(p);
}

async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(pickUA());
  await page.setViewport({ width: 1366, height: 900 });
  await page.setExtraHTTPHeaders({ "Accept-Language": "fr-MA,fr;q=0.9,en;q=0.8" });
  return page;
}

// ---------- PAGES JAUNES MAROC ----------
async function scrapePagesJaunes(browser: Browser, query: string, city: string) {
  return withRetry(`PagesJaunes "${query}" ${city}`, async () => {
    const page = await newPage(browser);
    const url = `https://www.pagesjaunes.ma/recherche/${encodeURIComponent(query)}/${encodeURIComponent(city)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(2000);

    const items = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("article, .listing-item, .result-item, .pj-card"));
      return cards.slice(0, 30).map((card) => {
        const text = (sel: string) => (card.querySelector(sel) as HTMLElement)?.innerText?.trim() || "";
        const attr = (sel: string, name: string) => (card.querySelector(sel) as HTMLElement)?.getAttribute(name) || "";
        const phoneMatch = card.textContent?.match(/0[5-7]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/);
        const emailMatch = card.textContent?.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
        return {
          name: text("h2, h3, .name, .title") || text("a"),
          address: text(".address, .adresse, address"),
          phone: phoneMatch?.[0] || "",
          email: emailMatch?.[0] || "",
          website: attr("a.website, a[href^=http]", "href"),
        };
      }).filter((x) => x.name);
    });

    for (const it of items) {
      addProspect({
        nom_agence: it.name,
        ville: city,
        adresse: it.address,
        telephone: it.phone,
        email: it.email,
        site_web: it.website,
        categories: [categoryFromQuery(query)],
        source_url: url,
        date_scrape: new Date().toISOString(),
      });
    }

    console.log(`  ✓ PagesJaunes "${query}" ${city} → ${items.length} résultats`);
    await page.close();
    await sleep(randomDelay());
  });
}

// ---------- GOOGLE MAPS ----------
async function scrapeGoogleMaps(browser: Browser, query: string, city: string) {
  return withRetry(`GMaps "${query}" ${city}`, async () => {
    const page = await newPage(browser);
    const fullQuery = `${query} ${city} Maroc`;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(fullQuery)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(4000);

    // Scroll dans le panneau de résultats
    await page.evaluate(async () => {
      const panel = document.querySelector('[role="feed"]') as HTMLElement | null;
      if (!panel) return;
      for (let i = 0; i < 5; i++) {
        panel.scrollBy(0, 1000);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }).catch(() => {});

    const items = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[role="feed"] > div > div[jsaction]'));
      return cards.slice(0, 25).map((card) => {
        const aria = (card.querySelector("a[aria-label]") as HTMLElement)?.getAttribute("aria-label") || "";
        const text = card.textContent || "";
        const phoneMatch = text.match(/\+?212[\s.-]?\d{1,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}|0[5-7][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/);
        const websiteEl = card.querySelector('a[data-value="Site Web"], a[data-value="Website"]') as HTMLAnchorElement | null;
        return {
          name: aria,
          address: "",
          phone: phoneMatch?.[0] || "",
          website: websiteEl?.href || "",
        };
      }).filter((x) => x.name);
    });

    for (const it of items) {
      addProspect({
        nom_agence: it.name,
        ville: city,
        adresse: it.address,
        telephone: it.phone,
        email: "",
        site_web: it.website,
        categories: [categoryFromQuery(query)],
        source_url: url,
        date_scrape: new Date().toISOString(),
      });
    }

    console.log(`  ✓ GMaps "${query}" ${city} → ${items.length} résultats`);
    await page.close();
    await sleep(randomDelay());
  });
}

// ---------- SITES D'AGENCES NATIONAUX ----------
async function scrapeAgencyWebsite(browser: Browser, baseUrl: string) {
  return withRetry(`Site ${baseUrl}`, async () => {
    const page = await newPage(browser);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(2000);

    // On cherche la page Contact / Agences
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map((a) => ({ href: (a as HTMLAnchorElement).href, text: a.textContent?.toLowerCase() || "" }))
        .filter((l) => /contact|agence|nos-agences|nos\sagences|locations|stations/.test(l.text))
        .map((l) => l.href);
    });

    const targets = [baseUrl, ...links].slice(0, 5);

    for (const url of targets) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        await sleep(1500);

        const data = await page.evaluate(() => {
          const text = document.body.innerText;
          const phones = Array.from(text.matchAll(/\+?212[\s.-]?\d{1,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}|0[5-7][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g)).map((m) => m[0]);
          const emails = Array.from(text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)).map((m) => m[0]);
          return { phones, emails, title: document.title };
        });

        const host = new URL(baseUrl).hostname.replace("www.", "");
        for (const phone of data.phones.slice(0, 10)) {
          addProspect({
            nom_agence: data.title.split(/[—|–\-|]/)[0].trim() || host,
            ville: "Maroc (national)",
            adresse: "",
            telephone: phone,
            email: data.emails[0] || "",
            site_web: baseUrl,
            categories: ["VOITURE"],
            source_url: url,
            date_scrape: new Date().toISOString(),
          });
        }
      } catch (e) {
        logError(`Sub-page ${url}`, e);
      }
      await sleep(randomDelay());
    }

    console.log(`  ✓ Site ${baseUrl}`);
    await page.close();
  });
}

// ---------- AVITO (annonces de location) ----------
async function scrapeAvito(browser: Browser, query: string, city: string) {
  return withRetry(`Avito "${query}" ${city}`, async () => {
    const page = await newPage(browser);
    const cityParam = city.toLowerCase().replace(/\s+/g, "_").replace(/[àâ]/g, "a").replace(/[éèê]/g, "e");
    const url = `https://www.avito.ma/fr/${encodeURIComponent(cityParam)}/v%C3%A9hicules--${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(2500);

    const items = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("a[href*='/fr/'][title], article, .sc-1jge648-0, [data-testid='listing-card']"));
      return cards.slice(0, 25).map((card) => {
        const text = card.textContent || "";
        const phoneMatch = text.match(/0[5-7]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/);
        const titleEl = card.querySelector("h2, h3, [class*='title'], a[title]") as HTMLElement | null;
        const href = (card as HTMLAnchorElement).href || (card.querySelector("a") as HTMLAnchorElement | null)?.href || "";
        return {
          name: titleEl?.innerText?.trim() || titleEl?.getAttribute("title") || "",
          address: "",
          phone: phoneMatch?.[0] || "",
          website: href,
        };
      }).filter((x) => x.name && /location|loue|rent/i.test(x.name));
    });

    for (const it of items) {
      addProspect({
        nom_agence: it.name,
        ville: city,
        adresse: it.address,
        telephone: it.phone,
        email: "",
        site_web: it.website,
        categories: [categoryFromQuery(query)],
        source_url: url,
        date_scrape: new Date().toISOString(),
      });
    }

    console.log(`  ✓ Avito "${query}" ${city} → ${items.length} résultats`);
    await page.close();
    await sleep(randomDelay());
  });
}

// ---------- EXPORTS ----------
async function exportCsv() {
  const writer = createObjectCsvWriter({
    path: CSV_PATH,
    header: [
      { id: "nom_agence", title: "Nom Agence" },
      { id: "ville", title: "Ville" },
      { id: "adresse", title: "Adresse" },
      { id: "telephone", title: "Téléphone" },
      { id: "email", title: "Email" },
      { id: "site_web", title: "Site Web" },
      { id: "categories", title: "Catégories" },
      { id: "source_url", title: "Source" },
      { id: "date_scrape", title: "Date scrape" },
    ],
  });
  await writer.writeRecords(collected.map((c) => ({ ...c, categories: c.categories.join(";") })));
}

async function exportJson() {
  fs.writeFileSync(JSON_PATH, JSON.stringify(collected, null, 2), "utf8");
}

async function persistDb() {
  let inserted = 0;
  for (const p of collected) {
    try {
      await prisma.prospect.create({
        data: {
          name: p.nom_agence,
          city: p.ville,
          address: p.adresse || null,
          phone: p.telephone || null,
          email: p.email || null,
          website: p.site_web || null,
          categories: p.categories,
          sourceUrl: p.source_url,
        },
      });
      inserted++;
    } catch (e) {
      // ignore duplicates / DB errors silently after logging
      logError(`DB insert ${p.nom_agence}`, e);
    }
  }
  console.log(`💾 ${inserted} prospects insérés en base`);
}

// ---------- MAIN ----------
async function main() {
  const headless = process.env.SCRAPE_HEADLESS !== "false";
  console.log("🔎 Démarrage du scraper de prospection (headless:", headless, ")");

  const browser = await puppeteer.launch({
    headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=fr-FR"],
  });

  const skipSites = process.env.SCRAPE_SKIP_SITES === "true";
  const skipPJ    = process.env.SCRAPE_SKIP_PJ === "true";
  const skipGMaps = process.env.SCRAPE_SKIP_GMAPS === "true";
  const skipAvito = process.env.SCRAPE_SKIP_AVITO === "true";

  try {
    // 1) Sites d'agences nationales
    if (!skipSites) {
      const sites = [
        "https://www.locationvoiture.ma",
        "https://www.carrental.ma",
        "https://www.hertz.ma",
        "https://www.europcar.ma",
        "https://www.sixt.ma",
      ];
      for (const s of sites) {
        await scrapeAgencyWebsite(browser, s);
      }
    }

    // 2) Pages Jaunes par ville × requête
    if (!skipPJ) {
      for (const city of CITIES) {
        for (const q of QUERIES) {
          await scrapePagesJaunes(browser, q, city);
        }
      }
    }

    // 3) Google Maps par ville × requête (export incrémental après chaque ville)
    if (!skipGMaps) {
      for (const city of CITIES) {
        for (const q of QUERIES) {
          await scrapeGoogleMaps(browser, q, city);
        }
        await exportCsv();
        await exportJson();
        console.log(`  📦 Export intermédiaire — ${collected.length} prospects cumulés`);
      }
    }

    // 4) Avito — annonces de location
    if (!skipAvito) {
      const avitoQueries = ["location_voiture", "location_moto", "location_bateau", "location_jet_ski"];
      for (const city of CITIES) {
        for (const q of avitoQueries) {
          await scrapeAvito(browser, q, city);
        }
      }
    }

    // 5) Exports
    await exportCsv();
    await exportJson();
    if (process.env.SCRAPE_PERSIST_DB !== "false") await persistDb();

    console.log(`\n✅ Terminé : ${collected.length} agences uniques`);
    console.log(`   CSV  → ${CSV_PATH}`);
    console.log(`   JSON → ${JSON_PATH}`);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  logError("FATAL", e);
  process.exit(1);
});
