import { create } from "zustand";
import { VehicleCategory } from "@/types";

interface SearchState {
  city: string;
  category: VehicleCategory | "";
  startDate: Date | null;
  endDate: Date | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sort: string;
  setCity: (city: string) => void;
  setCategory: (category: VehicleCategory | "") => void;
  setDates: (start: Date | null, end: Date | null) => void;
  setPriceRange: (min: number, max: number) => void;
  setMinRating: (rating: number) => void;
  setSort: (sort: string) => void;
  reset: () => void;
}

const defaultState = {
  city: "",
  category: "" as VehicleCategory | "",
  startDate: null,
  endDate: null,
  minPrice: 0,
  maxPrice: 5000,
  minRating: 0,
  sort: "createdAt",
};

export const useSearchStore = create<SearchState>((set) => ({
  ...defaultState,
  setCity: (city) => set({ city }),
  setCategory: (category) => set({ category }),
  setDates: (startDate, endDate) => set({ startDate, endDate }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  setMinRating: (minRating) => set({ minRating }),
  setSort: (sort) => set({ sort }),
  reset: () => set(defaultState),
}));
