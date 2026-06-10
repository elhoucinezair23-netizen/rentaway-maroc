import { Suspense } from "react";
import { Metadata } from "next";
import { SearchResults } from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Rechercher un véhicule",
  description: "Trouvez la voiture, moto, bateau ou jet-ski idéal au Maroc",
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex items-center justify-center h-96 text-gray-400">Chargement...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
