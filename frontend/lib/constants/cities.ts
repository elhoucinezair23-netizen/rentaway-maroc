export type MoroccanCity = {
  name: string;
  lat: number;
  lng: number;
};

/**
 * Liste centralisée des villes marocaines couvertes par la plateforme.
 * Pour ajouter une nouvelle ville, modifier UNIQUEMENT ce fichier.
 * Toutes les listes de villes du projet doivent importer depuis ici.
 */
export const MOROCCAN_CITIES: MoroccanCity[] = [
  { name: "Agadir", lat: 30.4278, lng: -9.5981 },
  { name: "Al Hoceima", lat: 35.2517, lng: -3.9372 },
  { name: "Béni Mellal", lat: 32.3372, lng: -6.3498 },
  { name: "Berkane", lat: 34.92, lng: -2.32 },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898 },
  { name: "Chefchaouen", lat: 35.1688, lng: -5.2636 },
  { name: "Dakhla", lat: 23.6848, lng: -15.958 },
  { name: "El Jadida", lat: 33.2316, lng: -8.5007 },
  { name: "Essaouira", lat: 31.5085, lng: -9.7595 },
  { name: "Fès", lat: 34.0181, lng: -5.0078 },
  { name: "Guelmim", lat: 28.987, lng: -10.0574 },
  { name: "Guercif", lat: 34.2333, lng: -3.3667 },
  { name: "Ifrane", lat: 33.5228, lng: -5.1106 },
  { name: "Kenitra", lat: 34.261, lng: -6.5802 },
  { name: "Khouribga", lat: 32.8811, lng: -6.9063 },
  { name: "Laâyoune", lat: 27.1536, lng: -13.2033 },
  { name: "Marrakech", lat: 31.6295, lng: -7.9811 },
  { name: "Mdiq", lat: 35.6833, lng: -5.3167 },
  { name: "Meknès", lat: 33.8731, lng: -5.5407 },
  { name: "Nador", lat: 35.1681, lng: -2.9335 },
  { name: "Ouarzazate", lat: 30.9335, lng: -6.937 },
  { name: "Oujda", lat: 34.6867, lng: -1.9114 },
  { name: "Rabat", lat: 34.0209, lng: -6.8416 },
  { name: "Safi", lat: 32.2994, lng: -9.2372 },
  { name: "Tanger", lat: 35.7595, lng: -5.834 },
  { name: "Taourirt", lat: 34.4097, lng: -2.8936 },
  { name: "Tétouan", lat: 35.5785, lng: -5.3684 },
];

export const CITY_NAMES: string[] = MOROCCAN_CITIES.map((c) => c.name);

export const CITY_GPS: Record<string, { lat: number; lng: number }> =
  Object.fromEntries(MOROCCAN_CITIES.map((c) => [c.name, { lat: c.lat, lng: c.lng }]));
