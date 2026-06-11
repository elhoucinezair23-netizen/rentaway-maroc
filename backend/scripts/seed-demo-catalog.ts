/**
 * Catalogue de démonstration : peuple la base de données avec des véhicules
 * réalistes (20 voitures + 8 motos + 6 bateaux + 5 jet-skis) en utilisant
 * l'API Unsplash pour les photos.
 *
 * Variables d'environnement :
 *   UNSPLASH_ACCESS_KEY  Clé API Unsplash (https://unsplash.com/developers)
 *
 * Usage : npm run seed:demo
 */
import "dotenv/config";
import { PrismaClient, VehicleCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import fetch from "node-fetch";

const prisma = new PrismaClient();

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

const CITY_GPS: Record<string, { lat: number; lng: number }> = {
  Agadir: { lat: 30.4278, lng: -9.5981 },
  "Al Hoceima": { lat: 35.2517, lng: -3.9372 },
  "Béni Mellal": { lat: 32.3372, lng: -6.3498 },
  Berkane: { lat: 34.92, lng: -2.32 },
  Casablanca: { lat: 33.5731, lng: -7.5898 },
  Chefchaouen: { lat: 35.1688, lng: -5.2636 },
  Dakhla: { lat: 23.6848, lng: -15.958 },
  "El Jadida": { lat: 33.2316, lng: -8.5007 },
  Essaouira: { lat: 31.5085, lng: -9.7595 },
  Fès: { lat: 34.0181, lng: -5.0078 },
  Guelmim: { lat: 28.987, lng: -10.0574 },
  Guercif: { lat: 34.2333, lng: -3.3667 },
  Ifrane: { lat: 33.5228, lng: -5.1106 },
  Kenitra: { lat: 34.261, lng: -6.5802 },
  Khouribga: { lat: 32.8811, lng: -6.9063 },
  Laâyoune: { lat: 27.1536, lng: -13.2033 },
  Marrakech: { lat: 31.6295, lng: -7.9811 },
  Mdiq: { lat: 35.6833, lng: -5.3167 },
  Meknès: { lat: 33.8731, lng: -5.5407 },
  Mohammedia: { lat: 33.6841, lng: -7.3833 },
  Nador: { lat: 35.1681, lng: -2.9335 },
  Ouarzazate: { lat: 30.9335, lng: -6.937 },
  Oujda: { lat: 34.6867, lng: -1.9114 },
  Rabat: { lat: 34.0209, lng: -6.8416 },
  Safi: { lat: 32.2994, lng: -9.2372 },
  Tanger: { lat: 35.7595, lng: -5.834 },
  Taourirt: { lat: 34.4097, lng: -2.8936 },
  Tétouan: { lat: 35.5785, lng: -5.3684 },
};

// ──────────────── Photos par modèle (Wikimedia Commons) ────────────────
// URLs Wikimedia : domaine public, photos réelles de chaque modèle.
// Si une URL Wikimedia est cassée (404), on retombe sur PHOTOS_BY_CATEGORY.
const VEHICLE_PHOTOS: Record<string, string[]> = {
  // VOITURES
  "Dacia Logan 2023": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dacia_Logan_II_facelift_%28cropped%29.jpg/1280px-Dacia_Logan_II_facelift_%28cropped%29.jpg"],
  "Dacia Sandero Stepway": ["https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Dacia_Sandero_Stepway_II_facelift.jpg/1280px-Dacia_Sandero_Stepway_II_facelift.jpg"],
  "Renault Clio 5": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Renault_Clio_V_%28cropped%29.jpg/1280px-Renault_Clio_V_%28cropped%29.jpg"],
  "Hyundai Tucson 2023": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/2021_Hyundai_Tucson_%28NX4%29_Elite_2WD_wagon_%282021-11-01%29_01.jpg/1280px-2021_Hyundai_Tucson_%28NX4%29_Elite_2WD_wagon_%282021-11-01%29_01.jpg"],
  "Toyota Corolla": ["https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/2019_Toyota_Corolla_sedan_%28facelift%2C_red%29%2C_front_8.21.19.jpg/1280px-2019_Toyota_Corolla_sedan_%28facelift%2C_red%29%2C_front_8.21.19.jpg"],
  "Volkswagen Polo": ["https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/2018_Volkswagen_Polo_1.0_TSI_Comfortline_in_Reflex_Silver%2C_front_8.15.19.jpg/1280px-2018_Volkswagen_Polo_1.0_TSI_Comfortline_in_Reflex_Silver%2C_front_8.15.19.jpg"],
  "Peugeot 208": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Peugeot_208_II_IMG_3744.jpg/1280px-Peugeot_208_II_IMG_3744.jpg"],
  "Dacia Duster 4x4": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Dacia_Duster_II_facelift_%28cropped%29.jpg/1280px-Dacia_Duster_II_facelift_%28cropped%29.jpg"],
  "Mercedes Classe A": ["https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Mercedes-Benz_A-Class_%28W177%29_IMG_0879.jpg/1280px-Mercedes-Benz_A-Class_%28W177%29_IMG_0879.jpg"],
  "Ford Kuga": ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Ford_Kuga_III_%28facelift%2C_2022%29_front.jpg/1280px-Ford_Kuga_III_%28facelift%2C_2022%29_front.jpg"],
  "Kia Sportage": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/2022_Kia_Sportage_%28NQ5%29_GT-Line_1.6_T-GDi_AWD_%28cropped%29.jpg/1280px-2022_Kia_Sportage_%28NQ5%29_GT-Line_1.6_T-GDi_AWD_%28cropped%29.jpg"],
  "Seat Ibiza": ["https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/SEAT_Ibiza_KJ_IMG_3861.jpg/1280px-SEAT_Ibiza_KJ_IMG_3861.jpg"],
  "Renault Captur": ["https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Renault_Captur_II_%28cropped%29.jpg/1280px-Renault_Captur_II_%28cropped%29.jpg"],
  "Toyota RAV4": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2019_Toyota_RAV4_Adventure_%28facelift%2C_red%29%2C_front_8.27.19.jpg/1280px-2019_Toyota_RAV4_Adventure_%28facelift%2C_red%29%2C_front_8.27.19.jpg"],
  "BMW Série 3": ["https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/2019_BMW_330i_%28G20%29_sedan_%282019-09-18%29_01.jpg/1280px-2019_BMW_330i_%28G20%29_sedan_%282019-09-18%29_01.jpg"],
  "Hyundai i20": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/2021_Hyundai_i20_%28BC3%29_Elite_hatchback_%282021-08-27%29_01.jpg/1280px-2021_Hyundai_i20_%28BC3%29_Elite_hatchback_%282021-08-27%29_01.jpg"],
  "Renault Mégane": ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Renault_M%C3%A9gane_IV_facelift_IMG_3338.jpg/1280px-Renault_M%C3%A9gane_IV_facelift_IMG_3338.jpg"],
  "Dacia Lodgy 7 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Dacia_Lodgy_facelift_%28cropped%29.jpg/1280px-Dacia_Lodgy_facelift_%28cropped%29.jpg"],
  "Peugeot 3008": ["https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Peugeot_3008_II_facelift_IMG_4024.jpg/1280px-Peugeot_3008_II_facelift_IMG_4024.jpg"],
  "Citroën C3": ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Citro%C3%ABn_C3_III_facelift_%28cropped%29.jpg/1280px-Citro%C3%ABn_C3_III_facelift_%28cropped%29.jpg"],
  "Peugeot 301": ["https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Peugeot_301_facelift_%28cropped%29.jpg/1280px-Peugeot_301_facelift_%28cropped%29.jpg"],
  "Hyundai Accent": ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/2018_Hyundai_Accent_%28RC3%29_Sport_sedan_%282018-10-23%29_01.jpg/1280px-2018_Hyundai_Accent_%28RC3%29_Sport_sedan_%282018-10-23%29_01.jpg"],
  "Volkswagen Golf 7": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/VW_Golf_VII_Facelift_IMG_0831.jpg/1280px-VW_Golf_VII_Facelift_IMG_0831.jpg"],
  "Suzuki Swift": ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Suzuki_Swift_AZ_%28cropped%29.jpg/1280px-Suzuki_Swift_AZ_%28cropped%29.jpg"],
  "Toyota Yaris": ["https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/2020_Toyota_Yaris_GR_Sport_%28XP210%29%2C_front_8.9.20.jpg/1280px-2020_Toyota_Yaris_GR_Sport_%28XP210%29%2C_front_8.9.20.jpg"],
  "Skoda Octavia": ["https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/%C5%A0koda_Octavia_IV_%28cropped%29.jpg/1280px-%C5%A0koda_Octavia_IV_%28cropped%29.jpg"],
  "Fiat Tipo": ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Fiat_Tipo_356_facelift_%28cropped%29.jpg/1280px-Fiat_Tipo_356_facelift_%28cropped%29.jpg"],

  // MOTOS
  "Honda CB 125cc": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Honda_CB125F_%282015%29.jpg/1280px-Honda_CB125F_%282015%29.jpg"],
  "Yamaha MT-07": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Yamaha_MT-07_2021.jpg/1280px-Yamaha_MT-07_2021.jpg"],
  "Suzuki Burgman scooter": ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Suzuki_Burgman_400_%282017%29.jpg/1280px-Suzuki_Burgman_400_%282017%29.jpg"],
  "Kawasaki Z650": ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Kawasaki_Z650_2017.jpg/1280px-Kawasaki_Z650_2017.jpg"],
  "Royal Enfield Himalayan": ["https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Royal_Enfield_Himalayan_2021.jpg/1280px-Royal_Enfield_Himalayan_2021.jpg"],
  "Honda PCX 125": ["https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Honda_PCX125_%282021%29.jpg/1280px-Honda_PCX125_%282021%29.jpg"],
  "Yamaha XMAX 300": ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Yamaha_X-MAX_300_%282017%29.jpg/1280px-Yamaha_X-MAX_300_%282017%29.jpg"],
  "KTM Duke 390": ["https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/KTM_390_Duke_2017.jpg/1280px-KTM_390_Duke_2017.jpg"],
  "Honda CBR 500R": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Honda_CBR500R_2019.jpg/1280px-Honda_CBR500R_2019.jpg"],
  "Yamaha NMAX 155": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Yamaha_NMAX_155_%282020%29.jpg/1280px-Yamaha_NMAX_155_%282020%29.jpg"],
  "Suzuki GSX-S 750": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Suzuki_GSX-S750_2017.jpg/1280px-Suzuki_GSX-S750_2017.jpg"],
  "BMW G310 GS trail": ["https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/BMW_G_310_GS_2017.jpg/1280px-BMW_G_310_GS_2017.jpg"],

  // BATEAUX
  "Semi-rigide 6 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Zodiac_semi-rigid_inflatable_boat.jpg/1280px-Zodiac_semi-rigid_inflatable_boat.jpg"],
  "Barque moteur 4 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Small_motorboat.jpg/1280px-Small_motorboat.jpg"],
  "Voilier 8 places + skipper": ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sailing_boat_at_sea.jpg/1280px-Sailing_boat_at_sea.jpg"],
  "Yacht 10 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Luxury_yacht_at_sea.jpg/1280px-Luxury_yacht_at_sea.jpg"],
  "Semi-rigide plongée": ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Zodiac_semi-rigid_inflatable_boat.jpg/1280px-Zodiac_semi-rigid_inflatable_boat.jpg"],
  "Barque pêche traditionnelle": ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Small_motorboat.jpg/1280px-Small_motorboat.jpg"],
  "Semi-rigide 8 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Zodiac_semi-rigid_inflatable_boat.jpg/1280px-Zodiac_semi-rigid_inflatable_boat.jpg"],
  "Catamaran 12 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sailing_boat_at_sea.jpg/1280px-Sailing_boat_at_sea.jpg"],

  // JET-SKIS
  "Sea-Doo Spark 1 place": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Sea-Doo_Spark_2014.jpg/1280px-Sea-Doo_Spark_2014.jpg"],
  "Yamaha WaveRunner 2 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yamaha_WaveRunner_VX_2019.jpg/1280px-Yamaha_WaveRunner_VX_2019.jpg"],
  "Sea-Doo GTI 2 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Sea-Doo_Spark_2014.jpg/1280px-Sea-Doo_Spark_2014.jpg"],
  "Kawasaki Jet Ski STX": ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yamaha_WaveRunner_VX_2019.jpg/1280px-Yamaha_WaveRunner_VX_2019.jpg"],
  "Sea-Doo RXP-X sport": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Sea-Doo_Spark_2014.jpg/1280px-Sea-Doo_Spark_2014.jpg"],
  "Yamaha FX Cruiser": ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yamaha_WaveRunner_VX_2019.jpg/1280px-Yamaha_WaveRunner_VX_2019.jpg"],
  "Sea-Doo GTX 2 places": ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Sea-Doo_Spark_2014.jpg/1280px-Sea-Doo_Spark_2014.jpg"],
};

// ──────────────── Résolution photo via API Wikipedia ────────────────
// On interroge l'API REST de Wikipedia (gratuite, sans clé) :
//   https://en.wikipedia.org/api/rest_v1/page/summary/<title>
// → renvoie `originalimage.source` (URL Wikimedia stable).
//
// Liste de titres d'articles à tenter en priorité par modèle.
// Si non listé, on devine en normalisant le nom du modèle.
const WIKI_TITLE_OVERRIDE: Record<string, string> = {
  "Dacia Logan 2023": "Dacia_Logan",
  "Dacia Sandero Stepway": "Dacia_Sandero",
  "Renault Clio 5": "Renault_Clio",
  "Hyundai Tucson 2023": "Hyundai_Tucson",
  "Dacia Duster 4x4": "Dacia_Duster",
  "Volkswagen Golf 7": "Volkswagen_Golf",
  "BMW Série 3": "BMW_3_Series",
  "Mercedes Classe A": "Mercedes-Benz_A-Class",
  "Dacia Lodgy 7 places": "Dacia_Lodgy",
  "Renault Mégane": "Renault_Mégane",
  "Citroën C3": "Citroën_C3",
  "Honda CB 125cc": "Honda_CB125",
  "Yamaha XMAX 300": "Yamaha_X-MAX",
  "Yamaha NMAX 155": "Yamaha_NMAX",
  "Honda CBR 500R": "Honda_CBR500R",
  "Suzuki GSX-S 750": "Suzuki_GSX-S750",
  "BMW G310 GS trail": "BMW_G_310_GS",
  "Royal Enfield Himalayan": "Royal_Enfield_Himalayan",
  "KTM Duke 390": "KTM_390_Duke",
  "Honda PCX 125": "Honda_PCX",
  "Suzuki Burgman scooter": "Suzuki_Burgman",
  "Sea-Doo Spark 1 place": "Sea-Doo_Spark",
  "Sea-Doo GTI 2 places": "Sea-Doo_GTI",
  "Sea-Doo RXP-X sport": "Sea-Doo_RXP",
  "Sea-Doo GTX 2 places": "Sea-Doo_GTX",
  "Yamaha WaveRunner 2 places": "Yamaha_WaveRunner",
  "Yamaha FX Cruiser": "Yamaha_WaveRunner",
  "Kawasaki Jet Ski STX": "Jet_Ski",
};

function deriveWikiTitle(titre: string): string {
  const override = WIKI_TITLE_OVERRIDE[titre];
  if (override) return override;
  // Stratégie : retirer chiffres parasites + suffixes ("scooter", "places", "trail")
  return titre
    .replace(/\b\d{4}\b/g, "")
    .replace(/\b\d+\s*(places|cc|cv)\b/gi, "")
    .replace(/\b(scooter|trail|sport)\b/gi, "")
    .replace(/[+]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

const wikiCache = new Map<string, string | null>();

async function resolveWikipediaImage(titre: string): Promise<string | null> {
  const wikiTitle = deriveWikiTitle(titre);
  if (wikiCache.has(wikiTitle)) return wikiCache.get(wikiTitle)!;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "RentaWay-Seed/1.0 (contact@rentaway.ma)" },
      signal: ctrl.signal as never,
    });
    clearTimeout(timer);

    if (!res.ok) {
      wikiCache.set(wikiTitle, null);
      return null;
    }
    const data = (await res.json()) as {
      originalimage?: { source: string };
      thumbnail?: { source: string };
    };
    const imgUrl = data.originalimage?.source || data.thumbnail?.source || null;
    wikiCache.set(wikiTitle, imgUrl);
    return imgUrl;
  } catch {
    wikiCache.set(wikiTitle, null);
    return null;
  }
}

/**
 * Photos d'une voiture/moto/etc. :
 *  - Tente l'API Wikipedia pour récupérer la vraie photo du modèle.
 *  - Sinon → rotation sur les photos génériques de la catégorie (toujours valides).
 */
async function photosFor(
  titre: string,
  category: "VOITURE" | "MOTO" | "BATEAU" | "JETSKI",
  i: number
): Promise<string[]> {
  // BATEAU & JETSKI : Wikipedia renvoie souvent des photos sous-marines / hors-sujet
  // → on force les photos catalogue validées
  if (category !== "BATEAU" && category !== "JETSKI") {
    const wikiImg = await resolveWikipediaImage(titre);
    if (wikiImg) {
      return [wikiImg, wikiImg, wikiImg, wikiImg];
    }
  }
  const pool = PHOTOS_BY_CATEGORY[category];
  return [
    pool[i % pool.length],
    pool[(i + 1) % pool.length],
    pool[(i + 2) % pool.length],
    pool[(i + 3) % pool.length],
  ];
}

// ──────────────── Photos génériques par catégorie (fallback) ────────────────
const PHOTOS_BY_CATEGORY: Record<string, string[]> = {
  VOITURE: [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800",
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800",
  ],
  MOTO: [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800",
    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
    "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800",
    "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800",
  ],
  // Photos bateaux validées (sans photo jet-ski mal classée)
  BATEAU: [
    "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
    "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
  ],
  // Photos jet-skis validées (sans photos sous-marines)
  JETSKI: [
    "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  ],
};

/**
 * Retourne 4 photos pour la galerie en commençant à l'index `i` (rotation).
 * Même image possible plusieurs fois si pool < 4 (acceptable, c'est de la démo).
 */
function categoryPhotos(category: "VOITURE" | "MOTO" | "BATEAU" | "JETSKI", i: number): string[] {
  const pool = PHOTOS_BY_CATEGORY[category];
  return [
    pool[i % pool.length],
    pool[(i + 1) % pool.length],
    pool[(i + 2) % pool.length],
    pool[(i + 3) % pool.length],
  ];
}

// ──────────────── DEPRECATED — gardé pour compat éventuelle ────────────────
const PHOTOS_BY_MODEL: Record<string, string> = {
  // Voitures
  "Dacia Logan 2023":        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
  "Dacia Sandero Stepway":   "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
  "Renault Clio 5":          "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
  "Hyundai Tucson 2023":     "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800",
  "Toyota Corolla":          "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800",
  "Volkswagen Polo":         "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",
  "Peugeot 208":             "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  "Dacia Duster 4x4":        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
  "Mercedes Classe A":       "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
  "Ford Kuga":               "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
  "Kia Sportage":            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
  "Seat Ibiza":              "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",
  "Renault Captur":          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  "Dacia Duster":            "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
  "Toyota RAV4":             "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
  "BMW Série 3":             "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
  "Hyundai i20":             "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
  "Renault Mégane":          "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
  "Dacia Lodgy 7 places":    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
  "Peugeot 3008":            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
  "Citroën C3":              "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  "Peugeot 301":             "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  "Hyundai Accent":          "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
  "Volkswagen Golf 7":       "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",
  "Suzuki Swift":            "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",
  "Toyota Yaris":            "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800",
  "Renault Kangoo":          "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
  "Skoda Octavia":           "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",
  "Citroën C-Elysée":        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  "Dacia Logan MCV":         "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
  "Fiat Tipo":               "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",
  "Ford Focus":              "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800",

  // Motos
  "Honda CB 125cc":           "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  "Yamaha MT-07":             "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  "Suzuki Burgman scooter":   "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
  "Kawasaki Z650":            "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  "Royal Enfield Himalayan":  "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800",
  "Honda PCX 125":            "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
  "Yamaha XMAX 300":          "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
  "KTM Duke 390":             "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  "Honda CBR 500R":           "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  "Yamaha NMAX 155":          "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
  "Suzuki GSX-S 750":         "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  "BMW G310 GS trail":        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800",

  // Bateaux
  "Semi-rigide 6 places":         "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
  "Barque moteur 4 places":       "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
  "Voilier 8 places + skipper":   "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800",
  "Yacht 10 places":              "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
  "Semi-rigide plongée":          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
  "Barque pêche traditionnelle":  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
  "Semi-rigide 8 places":         "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
  "Catamaran 12 places":          "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800",

  // Jet-skis
  "Sea-Doo Spark 1 place":      "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  "Yamaha WaveRunner 2 places": "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  "Sea-Doo GTI 2 places":       "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  "Kawasaki Jet Ski STX":       "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  "Sea-Doo RXP-X sport":        "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  "Yamaha FX Cruiser":          "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
  "Sea-Doo GTX 2 places":       "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
};

// Photo principale + 3 angles dérivés (mêmes URL avec query string différente)
// pour que chaque véhicule ait toujours 4 entrées dans `images[]`.
function photosForModel(titre: string, fallback: string[]): string[] {
  const base = PHOTOS_BY_MODEL[titre];
  if (base) {
    const noQ = base.split("?")[0];
    return [
      base,
      `${noQ}?w=800&fit=crop&crop=entropy`,
      `${noQ}?w=800&fit=crop&crop=center`,
      `${noQ}?w=800&fit=crop&crop=edges`,
    ];
  }
  return fallback.slice(0, 4);
}

// Photos de fallback génériques (utilisées seulement si modèle inconnu)
const FALLBACK_PHOTOS: Record<string, string[]> = {
  VOITURE: [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80",
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=80",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&q=80",
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200&q=80",
  ],
  MOTO: [
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=80",
    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80",
    "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=80",
    "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&q=80",
    "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1200&q=80",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80",
    "https://images.unsplash.com/photo-1599819177626-b4ba8a26a574?w=1200&q=80",
    "https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=1200&q=80",
  ],
  BATEAU: [
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80",
    "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=80",
    "https://images.unsplash.com/photo-1502752394-09be1c4ef1ad?w=1200&q=80",
    "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1200&q=80",
    "https://images.unsplash.com/photo-1500627965408-b5f2c8793f3f?w=1200&q=80",
    "https://images.unsplash.com/photo-1527431016595-71bf7e1a4b4f?w=1200&q=80",
  ],
  JETSKI: [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80",
    "https://images.unsplash.com/photo-1530538987395-032d1800fdd4?w=1200&q=80",
    "https://images.unsplash.com/photo-1610401743836-f1c6fc01bd08?w=1200&q=80",
    "https://images.unsplash.com/photo-1599692392256-a3c68c8be53c?w=1200&q=80",
    "https://images.unsplash.com/photo-1601225998165-a89e2eb46a5f?w=1200&q=80",
  ],
};

async function fetchUnsplashPhotos(query: string, count = 4): Promise<string[]> {
  if (!UNSPLASH_KEY) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results: Array<{ urls: { regular: string } }> };
    return data.results.map((r) => r.urls.regular);
  } catch {
    return [];
  }
}

function pickFallbackPhotos(category: VehicleCategory, seed: number, count = 4): string[] {
  const pool = FALLBACK_PHOTOS[category];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(seed + i) % pool.length]);
  }
  return out;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

const carData = [
  // ── 6 grandes villes (≥ 5 véhicules) ─────────────────
  // Casablanca
  { titre: "Dacia Logan 2023", ville: "Casablanca", prix: 350 },
  { titre: "Peugeot 208", ville: "Casablanca", prix: 400 },
  { titre: "Kia Sportage", ville: "Casablanca", prix: 680 },
  { titre: "BMW Série 3", ville: "Casablanca", prix: 1500 },
  { titre: "Hyundai i20", ville: "Casablanca", prix: 340 },
  // Marrakech
  { titre: "Dacia Sandero Stepway", ville: "Marrakech", prix: 400 },
  { titre: "Mercedes Classe A", ville: "Marrakech", prix: 1200 },
  { titre: "Toyota RAV4", ville: "Marrakech", prix: 900 },
  { titre: "Dacia Duster 4x4", ville: "Marrakech", prix: 700 },
  { titre: "Renault Clio 5", ville: "Marrakech", prix: 380 },
  // Rabat
  { titre: "Hyundai Tucson 2023", ville: "Rabat", prix: 650 },
  { titre: "Seat Ibiza", ville: "Rabat", prix: 390 },
  { titre: "Peugeot 3008", ville: "Rabat", prix: 800 },
  { titre: "Volkswagen Golf 7", ville: "Rabat", prix: 520 },
  { titre: "Ford Focus", ville: "Rabat", prix: 450 },
  // Fès
  { titre: "Volkswagen Polo", ville: "Fès", prix: 420 },
  { titre: "Citroën C3", ville: "Fès", prix: 360 },
  { titre: "Toyota Yaris", ville: "Fès", prix: 410 },
  { titre: "Renault Mégane", ville: "Fès", prix: 420 },
  { titre: "Fiat Tipo", ville: "Fès", prix: 400 },
  // Tanger
  { titre: "Toyota Corolla", ville: "Tanger", prix: 500 },
  { titre: "Renault Captur", ville: "Tanger", prix: 550 },
  { titre: "Ford Kuga", ville: "Tanger", prix: 750 },
  { titre: "Skoda Octavia", ville: "Tanger", prix: 600 },
  // Oujda
  { titre: "Renault Mégane", ville: "Oujda", prix: 420 },
  { titre: "Dacia Lodgy 7 places", ville: "Oujda", prix: 480 },
  { titre: "Hyundai Accent", ville: "Oujda", prix: 370 },
  { titre: "Peugeot 301", ville: "Oujda", prix: 380 },
  { titre: "Suzuki Swift", ville: "Oujda", prix: 360 },

  // ── 9 côtières non-grandes ────────────────────────────
  // Agadir
  { titre: "Renault Clio 5", ville: "Agadir", prix: 380 },
  { titre: "Ford Kuga", ville: "Agadir", prix: 750 },
  { titre: "Peugeot 3008", ville: "Agadir", prix: 800 },
  // Essaouira
  { titre: "Dacia Logan 2023", ville: "Essaouira", prix: 360 },
  { titre: "Renault Captur", ville: "Essaouira", prix: 540 },
  // Dakhla
  { titre: "Dacia Duster 4x4", ville: "Dakhla", prix: 720 },
  { titre: "Toyota Yaris", ville: "Dakhla", prix: 400 },
  // Al Hoceima
  { titre: "Hyundai Accent", ville: "Al Hoceima", prix: 370 },
  { titre: "Dacia Sandero Stepway", ville: "Al Hoceima", prix: 410 },
  // Nador
  { titre: "Peugeot 208", ville: "Nador", prix: 390 },
  { titre: "Renault Mégane", ville: "Nador", prix: 430 },
  // Safi
  { titre: "Suzuki Swift", ville: "Safi", prix: 350 },
  { titre: "Citroën C3", ville: "Safi", prix: 380 },
  // El Jadida
  { titre: "Volkswagen Golf 7", ville: "El Jadida", prix: 520 },
  { titre: "Fiat Tipo", ville: "El Jadida", prix: 400 },
  // Mohammedia
  { titre: "Hyundai i20", ville: "Mohammedia", prix: 350 },
  { titre: "Toyota Yaris", ville: "Mohammedia", prix: 410 },
  // Mdiq
  { titre: "Renault Clio 5", ville: "Mdiq", prix: 390 },

  // ── 13 intérieures non-grandes ───────────────────────
  // Tétouan
  { titre: "Dacia Logan 2023", ville: "Tétouan", prix: 360 },
  { titre: "Peugeot 208", ville: "Tétouan", prix: 400 },
  // Meknès
  { titre: "Renault Mégane", ville: "Meknès", prix: 430 },
  { titre: "Volkswagen Polo", ville: "Meknès", prix: 410 },
  // Béni Mellal
  { titre: "Peugeot 301", ville: "Béni Mellal", prix: 360 },
  { titre: "Hyundai Accent", ville: "Béni Mellal", prix: 370 },
  // Kenitra
  { titre: "Hyundai Accent", ville: "Kenitra", prix: 370 },
  { titre: "Dacia Logan MCV", ville: "Kenitra", prix: 380 },
  // Khouribga
  { titre: "Citroën C-Elysée", ville: "Khouribga", prix: 360 },
  { titre: "Dacia Sandero Stepway", ville: "Khouribga", prix: 390 },
  // Ouarzazate
  { titre: "Dacia Duster", ville: "Ouarzazate", prix: 600 },
  { titre: "Toyota RAV4", ville: "Ouarzazate", prix: 850 },
  // Ifrane
  { titre: "Skoda Octavia", ville: "Ifrane", prix: 600 },
  { titre: "Dacia Duster 4x4", ville: "Ifrane", prix: 700 },
  // Chefchaouen
  { titre: "Renault Kangoo", ville: "Chefchaouen", prix: 460 },
  { titre: "Peugeot 208", ville: "Chefchaouen", prix: 410 },
  // Laâyoune
  { titre: "Toyota Yaris", ville: "Laâyoune", prix: 410 },
  { titre: "Hyundai i20", ville: "Laâyoune", prix: 380 },
  // Berkane
  { titre: "Hyundai Accent", ville: "Berkane", prix: 360 },
  { titre: "Renault Clio 5", ville: "Berkane", prix: 380 },
  // Guelmim
  { titre: "Dacia Logan 2023", ville: "Guelmim", prix: 350 },
  { titre: "Dacia Duster 4x4", ville: "Guelmim", prix: 680 },
  // Guercif
  { titre: "Peugeot 301", ville: "Guercif", prix: 360 },
  { titre: "Dacia Sandero Stepway", ville: "Guercif", prix: 390 },
  // Taourirt
  { titre: "Renault Mégane", ville: "Taourirt", prix: 420 },
  { titre: "Toyota Yaris", ville: "Taourirt", prix: 400 },
];

const motoData = [
  // Grandes villes (2 motos pour Casa et Marrakech, 1 pour les autres)
  { titre: "Yamaha MT-07", ville: "Casablanca", prix: 600, type: "sportive", cyl: 689, permis: "A" },
  { titre: "KTM Duke 390", ville: "Casablanca", prix: 580, type: "sportive", cyl: 373, permis: "A" },
  { titre: "Honda CB 125cc", ville: "Marrakech", prix: 200, type: "routière", cyl: 125, permis: "A2" },
  { titre: "Royal Enfield Himalayan", ville: "Marrakech", prix: 700, type: "trail", cyl: 411, permis: "A" },
  { titre: "Honda PCX 125", ville: "Rabat", prix: 220, type: "scooter", cyl: 125, permis: "A2" },
  { titre: "Yamaha NMAX 155", ville: "Fès", prix: 230, type: "scooter", cyl: 155, permis: "A2" },
  { titre: "Kawasaki Z650", ville: "Tanger", prix: 550, type: "sportive", cyl: 649, permis: "A" },
  { titre: "Honda CBR 500R", ville: "Oujda", prix: 450, type: "sportive", cyl: 471, permis: "A2" },

  // Côtières non-grandes (1 moto chacune)
  { titre: "Yamaha XMAX 300", ville: "Agadir", prix: 350, type: "scooter", cyl: 300, permis: "A2" },
  { titre: "Suzuki Burgman scooter", ville: "Essaouira", prix: 250, type: "scooter", cyl: 200, permis: "A2" },
  { titre: "BMW G310 GS trail", ville: "Dakhla", prix: 500, type: "trail", cyl: 313, permis: "A2" },
  { titre: "Honda CB 125cc", ville: "Al Hoceima", prix: 210, type: "routière", cyl: 125, permis: "A2" },
  { titre: "Yamaha NMAX 155", ville: "Nador", prix: 230, type: "scooter", cyl: 155, permis: "A2" },
  { titre: "Honda PCX 125", ville: "Safi", prix: 220, type: "scooter", cyl: 125, permis: "A2" },
  { titre: "Yamaha MT-07", ville: "El Jadida", prix: 580, type: "sportive", cyl: 689, permis: "A" },
  { titre: "Suzuki GSX-S 750", ville: "Mohammedia", prix: 620, type: "sportive", cyl: 749, permis: "A" },
  { titre: "Honda CB 125cc", ville: "Mdiq", prix: 210, type: "routière", cyl: 125, permis: "A2" },

  // Intérieures non-grandes (1 moto chacune)
  { titre: "Suzuki GSX-S 750", ville: "Tétouan", prix: 600, type: "sportive", cyl: 749, permis: "A" },
  { titre: "Yamaha XMAX 300", ville: "Meknès", prix: 340, type: "scooter", cyl: 300, permis: "A2" },
  { titre: "Honda PCX 125", ville: "Béni Mellal", prix: 220, type: "scooter", cyl: 125, permis: "A2" },
  { titre: "Suzuki GSX-S 750", ville: "Kenitra", prix: 620, type: "sportive", cyl: 749, permis: "A" },
  { titre: "Honda CB 125cc", ville: "Khouribga", prix: 200, type: "routière", cyl: 125, permis: "A2" },
  { titre: "Royal Enfield Himalayan", ville: "Ouarzazate", prix: 680, type: "trail", cyl: 411, permis: "A" },
  { titre: "BMW G310 GS trail", ville: "Ifrane", prix: 500, type: "trail", cyl: 313, permis: "A2" },
  { titre: "BMW G310 GS trail", ville: "Chefchaouen", prix: 500, type: "trail", cyl: 313, permis: "A2" },
  { titre: "Yamaha NMAX 155", ville: "Laâyoune", prix: 230, type: "scooter", cyl: 155, permis: "A2" },
  { titre: "Honda CBR 500R", ville: "Berkane", prix: 450, type: "sportive", cyl: 471, permis: "A2" },
  { titre: "KTM Duke 390", ville: "Guelmim", prix: 560, type: "sportive", cyl: 373, permis: "A" },
  { titre: "Yamaha NMAX 155", ville: "Guercif", prix: 230, type: "scooter", cyl: 155, permis: "A2" },
  { titre: "Honda PCX 125", ville: "Taourirt", prix: 220, type: "scooter", cyl: 125, permis: "A2" },
];

const boatData = [
  // Agadir (2)
  { titre: "Semi-rigide 6 places", ville: "Agadir", prixHeure: 1500, longueur: 6, capacite: 6, moteur: 150, skipper: false, permis: "côtier", zone: "Côte d'Agadir" },
  { titre: "Catamaran 12 places", ville: "Agadir", prixJour: 12000, longueur: 12, capacite: 12, moteur: 250, skipper: true, permis: "aucun", zone: "Côte d'Agadir" },
  // Essaouira (2)
  { titre: "Barque moteur 4 places", ville: "Essaouira", prixHeure: 800, longueur: 4, capacite: 4, moteur: 60, skipper: false, permis: "côtier", zone: "Baie d'Essaouira" },
  { titre: "Voilier 8 places + skipper", ville: "Essaouira", prixJour: 3500, longueur: 11, capacite: 8, moteur: 80, skipper: true, permis: "aucun", zone: "Côte atlantique" },
  // Tanger (2)
  { titre: "Semi-rigide 8 places", ville: "Tanger", prixHeure: 1800, longueur: 7, capacite: 8, moteur: 200, skipper: false, permis: "côtier", zone: "Détroit de Gibraltar" },
  { titre: "Yacht 10 places", ville: "Tanger", prixJour: 9000, longueur: 14, capacite: 10, moteur: 320, skipper: true, permis: "aucun", zone: "Détroit de Gibraltar" },
  // Dakhla (2)
  { titre: "Voilier 8 places + skipper", ville: "Dakhla", prixJour: 4000, longueur: 12, capacite: 8, moteur: 80, skipper: true, permis: "aucun", zone: "Lagune de Dakhla" },
  { titre: "Semi-rigide 6 places", ville: "Dakhla", prixHeure: 1400, longueur: 6, capacite: 6, moteur: 150, skipper: false, permis: "côtier", zone: "Lagune de Dakhla" },
  // Al Hoceima (1)
  { titre: "Semi-rigide plongée", ville: "Al Hoceima", prixHeure: 1200, longueur: 7, capacite: 8, moteur: 200, skipper: true, permis: "aucun", zone: "Parc National d'Al Hoceima" },
  // Nador (1)
  { titre: "Barque pêche traditionnelle", ville: "Nador", prixHeure: 600, longueur: 5, capacite: 4, moteur: 40, skipper: true, permis: "aucun", zone: "Lagune de Marchica" },
  // Safi (1)
  { titre: "Barque moteur 4 places", ville: "Safi", prixHeure: 750, longueur: 4, capacite: 4, moteur: 60, skipper: false, permis: "côtier", zone: "Port de Safi" },
  // El Jadida (1)
  { titre: "Semi-rigide 6 places", ville: "El Jadida", prixHeure: 1300, longueur: 6, capacite: 6, moteur: 150, skipper: false, permis: "côtier", zone: "Côte atlantique" },
  // Mohammedia (1)
  { titre: "Yacht 10 places", ville: "Mohammedia", prixJour: 8500, longueur: 14, capacite: 10, moteur: 320, skipper: true, permis: "aucun", zone: "Côte atlantique" },
  // Mdiq (1)
  { titre: "Yacht 10 places", ville: "Mdiq", prixJour: 8000, longueur: 15, capacite: 10, moteur: 350, skipper: true, permis: "aucun", zone: "Côte méditerranéenne" },
];

const jetskiData = [
  // Agadir (2)
  { titre: "Sea-Doo Spark 1 place", ville: "Agadir", prixHeure: 400, puissance: 90, capacite: 1, age: 18, comb: false },
  { titre: "Yamaha WaveRunner 2 places", ville: "Agadir", prixHeure: 600, puissance: 180, capacite: 2, age: 18, comb: true },
  // Essaouira (1)
  { titre: "Sea-Doo GTX 2 places", ville: "Essaouira", prixHeure: 520, puissance: 130, capacite: 2, age: 18, comb: true },
  // Tanger (1)
  { titre: "Yamaha FX Cruiser", ville: "Tanger", prixHeure: 580, puissance: 180, capacite: 2, age: 18, comb: true },
  // Dakhla (1)
  { titre: "Sea-Doo GTI 2 places", ville: "Dakhla", prixHeure: 500, puissance: 130, capacite: 2, age: 18, comb: true },
  // Al Hoceima (1)
  { titre: "Sea-Doo Spark 1 place", ville: "Al Hoceima", prixHeure: 400, puissance: 90, capacite: 1, age: 18, comb: false },
  // Nador (1)
  { titre: "Yamaha WaveRunner 2 places", ville: "Nador", prixHeure: 580, puissance: 180, capacite: 2, age: 18, comb: true },
  // Safi (1)
  { titre: "Sea-Doo GTI 2 places", ville: "Safi", prixHeure: 490, puissance: 130, capacite: 2, age: 18, comb: true },
  // El Jadida (1)
  { titre: "Kawasaki Jet Ski STX", ville: "El Jadida", prixHeure: 540, puissance: 160, capacite: 2, age: 18, comb: true },
  // Mohammedia (1)
  { titre: "Sea-Doo RXP-X sport", ville: "Mohammedia", prixHeure: 700, puissance: 300, capacite: 2, age: 21, comb: true },
  // Mdiq (1)
  { titre: "Kawasaki Jet Ski STX", ville: "Mdiq", prixHeure: 550, puissance: 160, capacite: 2, age: 18, comb: true },
];

function describeCar(d: typeof carData[0], specs: any): string {
  return `${d.titre}, ${specs.places} places, boîte ${specs.boite} ${specs.carburant}, climatisation et ${specs.gps ? "GPS embarqué" : "Bluetooth"}. Idéal pour vos déplacements à ${d.ville} avec kilométrage ${specs.kilometrage}.`;
}
function describeMoto(d: typeof motoData[0]): string {
  return `${d.titre}, ${d.cyl}cm³ ${d.type}, casque inclus. Disponible à ${d.ville}, parfaite pour explorer la région. Permis ${d.permis} requis.`;
}
function describeBoat(d: any): string {
  return `${d.titre}, ${d.longueur}m, ${d.capacite} personnes maximum, moteur ${d.moteur}cv. Navigation sur ${d.zone}${d.skipper ? " avec skipper professionnel inclus" : ""}.`;
}
function describeJet(d: typeof jetskiData[0]): string {
  return `${d.titre}, ${d.puissance}cv, ${d.capacite} place${d.capacite > 1 ? "s" : ""}. Briefing sécurité, gilet de sauvetage${d.comb ? " et combinaison néoprène" : ""} fournis. Âge minimum ${d.age} ans.`;
}

async function getOrCreateDemoAgency(city: string) {
  const email = `demo-${city.toLowerCase().replace(/[^a-z]/g, "")}@rentaway.ma`;
  const existing = await prisma.user.findUnique({ where: { email }, include: { agency: true } });
  if (existing?.agency) return existing.agency;

  const passwordHash = await bcrypt.hash("DemoAgency1234!", 10);
  const gps = CITY_GPS[city] || { lat: 33.5731, lng: -7.5898 };

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "LOUEUR",
      firstName: "Demo",
      lastName: city,
      isVerified: true,
      agency: {
        create: {
          name: `Location ${city} Demo`,
          registreCommerce: `RC-DEMO-${city.toUpperCase().slice(0, 3)}`,
          address: `Centre-ville, ${city}`,
          city,
          lat: gps.lat,
          lng: gps.lng,
          isApproved: true,
          isDemo: true,
          rating: 4.5,
          reviewCount: randInt(10, 80),
          description: `Agence de démonstration à ${city}. Flotte récente, service professionnel.`,
        },
      },
    },
    include: { agency: true },
  });

  console.log(`  + Agence démo créée : ${user.agency!.name}`);
  return user.agency!;
}

async function blockRandomDates(vehicleId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const used = new Set<number>();
  for (let i = 0; i < 3; i++) {
    let day: number;
    do {
      day = randInt(1, 28);
    } while (used.has(day));
    used.add(day);
    const date = new Date(year, month, day);
    try {
      await prisma.availability.create({
        data: { vehicleId, date, isBlocked: true },
      });
    } catch {
      // unique constraint - skip
    }
  }
}

async function seedCars() {
  for (let i = 0; i < carData.length; i++) {
    const d = carData[i];
    const agency = await getOrCreateDemoAgency(d.ville);
    const gps = CITY_GPS[d.ville] || { lat: 0, lng: 0 };

    const images = await photosFor(d.titre, "VOITURE", i);

    const specs = {
      boite: i % 2 === 0 ? "automatique" : "manuelle",
      carburant: i % 3 === 0 ? "diesel" : "essence",
      places: i % 4 === 0 ? 7 : 5,
      clim: true,
      gps: i % 2 === 0,
      kilometrage: "illimité",
    };

    const v = await prisma.vehicle.create({
      data: {
        agencyId: agency.id,
        category: "VOITURE",
        title: d.titre,
        description: describeCar(d, specs),
        images,
        pricePerDay: d.prix,
        caution: d.prix * 2,
        city: d.ville,
        lat: gps.lat,
        lng: gps.lng,
        isAvailable: true,
        isDemo: true,
        specs,
        requiredLicense: "B",
        rating: parseFloat(rand(4.1, 4.9).toFixed(1)),
        reviewCount: randInt(5, 60),
      },
    });
    await blockRandomDates(v.id);
    console.log(`  ✓ Voiture: ${d.titre} (${d.ville})`);
  }
}

async function seedMotos() {
  for (let i = 0; i < motoData.length; i++) {
    const d = motoData[i];
    const agency = await getOrCreateDemoAgency(d.ville);
    const gps = CITY_GPS[d.ville] || { lat: 0, lng: 0 };

    const images = await photosFor(d.titre, "MOTO", i);

    const specs = {
      cylindree: d.cyl,
      type: d.type,
      casque: true,
      permis: d.permis,
    };

    const v = await prisma.vehicle.create({
      data: {
        agencyId: agency.id,
        category: "MOTO",
        title: d.titre,
        description: describeMoto(d),
        images,
        pricePerDay: d.prix,
        caution: d.prix * 2,
        city: d.ville,
        lat: gps.lat,
        lng: gps.lng,
        isAvailable: true,
        isDemo: true,
        specs,
        requiredLicense: d.permis,
        rating: parseFloat(rand(4.1, 4.9).toFixed(1)),
        reviewCount: randInt(3, 30),
      },
    });
    await blockRandomDates(v.id);
    console.log(`  ✓ Moto: ${d.titre} (${d.ville})`);
  }
}

async function seedBoats() {
  for (let i = 0; i < boatData.length; i++) {
    const d = boatData[i] as any;
    const agency = await getOrCreateDemoAgency(d.ville);
    const gps = CITY_GPS[d.ville] || { lat: 0, lng: 0 };

    const images = await photosFor(d.titre, "BATEAU", i);

    const specs = {
      longueur: d.longueur,
      capacite: d.capacite,
      moteur_cv: d.moteur,
      avec_skipper: d.skipper,
      permis_requis: d.permis,
      zone_navigation: d.zone,
    };

    const isHourly = !!d.prixHeure;
    const pricePerDay = isHourly ? d.prixHeure * 6 : d.prixJour;
    const caution = isHourly ? d.prixHeure * 4 : d.prixJour * 2;

    const v = await prisma.vehicle.create({
      data: {
        agencyId: agency.id,
        category: "BATEAU",
        title: d.titre,
        description: describeBoat(d),
        images,
        pricePerDay,
        pricePerHour: d.prixHeure || null,
        caution,
        city: d.ville,
        lat: gps.lat,
        lng: gps.lng,
        isAvailable: true,
        isDemo: true,
        specs,
        requiredLicense: d.permis === "aucun" ? "Aucun (avec skipper)" : `Permis ${d.permis}`,
        rating: parseFloat(rand(4.1, 4.9).toFixed(1)),
        reviewCount: randInt(3, 25),
      },
    });
    await blockRandomDates(v.id);
    console.log(`  ✓ Bateau: ${d.titre} (${d.ville})`);
  }
}

async function seedJetskis() {
  for (let i = 0; i < jetskiData.length; i++) {
    const d = jetskiData[i];
    const agency = await getOrCreateDemoAgency(d.ville);
    const gps = CITY_GPS[d.ville] || { lat: 0, lng: 0 };

    const images = await photosFor(d.titre, "JETSKI", i);

    const specs = {
      puissance_cv: d.puissance,
      capacite: d.capacite,
      age_minimum: d.age,
      gilet_fourni: true,
      combinaison: d.comb,
      zone: `Côte de ${d.ville}`,
    };

    const v = await prisma.vehicle.create({
      data: {
        agencyId: agency.id,
        category: "JETSKI",
        title: d.titre,
        description: describeJet(d),
        images,
        pricePerDay: d.prixHeure * 6,
        pricePerHour: d.prixHeure,
        caution: d.prixHeure * 4,
        city: d.ville,
        lat: gps.lat,
        lng: gps.lng,
        isAvailable: true,
        isDemo: true,
        specs,
        requiredLicense: "Permis bateau",
        rating: parseFloat(rand(4.1, 4.9).toFixed(1)),
        reviewCount: randInt(5, 30),
      },
    });
    await blockRandomDates(v.id);
    console.log(`  ✓ Jet-ski: ${d.titre} (${d.ville})`);
  }
}

async function main() {
  console.log("🌱 Seed catalogue de démonstration");
  console.log(`   API Unsplash : ${UNSPLASH_KEY ? "OK" : "non fournie (fallback photos)"}\n`);

  console.log("🚗 Voitures...");
  await seedCars();
  console.log("🏍️  Motos...");
  await seedMotos();
  console.log("⛵ Bateaux...");
  await seedBoats();
  console.log("🌊 Jet-skis...");
  await seedJetskis();

  const total = await prisma.vehicle.count({ where: { isDemo: true } });
  console.log(`\n✅ ${total} véhicules de démo en base`);
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
