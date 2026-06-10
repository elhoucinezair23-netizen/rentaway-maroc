export type Role = "CLIENT" | "LOUEUR" | "ADMIN";
export type VehicleCategory = "VOITURE" | "MOTO" | "BATEAU" | "JETSKI";
export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  isBlacklisted: boolean;
  cinPath?: string;
  permisPath?: string;
  createdAt: string;
  agency?: Agency;
}

export interface Agency {
  id: string;
  userId: string;
  name: string;
  registreCommerce: string;
  assurancePath?: string;
  description?: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  rating: number;
  reviewCount: number;
  isApproved: boolean;
  responseTime?: number;
  createdAt: string;
  user?: { firstName: string; lastName: string; avatar?: string };
  vehicles?: Vehicle[];
}

export interface VehicleSpecs {
  // Voiture
  marque?: string;
  modele?: string;
  annee?: number;
  kilometrage?: number;
  boite?: "automatique" | "manuelle";
  carburant?: string;
  climatisation?: boolean;
  places?: number;
  gps?: boolean;
  // Moto
  cylindree?: number;
  typeMoto?: string;
  casque?: boolean;
  // Bateau
  typeBateau?: string;
  longueur?: number;
  capacite?: number;
  motorisation?: number;
  skipper?: boolean;
  zoneNavigation?: string;
  // Jet-ski
  puissance?: number;
  capacitePersonnes?: number;
  ageMinimum?: number;
  equipements?: string[];
}

export interface Vehicle {
  id: string;
  agencyId: string;
  category: VehicleCategory;
  title: string;
  description: string;
  images: string[];
  pricePerDay: number;
  pricePerHour?: number;
  caution: number;
  city: string;
  lat?: number;
  lng?: number;
  isAvailable: boolean;
  specs: VehicleSpecs;
  requiredLicense: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
  agency?: Agency;
  availability?: Availability[];
}

export interface Reservation {
  id: string;
  vehicleId: string;
  clientId: string;
  agencyId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  commission: number;
  cautionAmount: number;
  status: ReservationStatus;
  pdfPath?: string;
  cancelReason?: string;
  createdAt: string;
  vehicle?: Partial<Vehicle>;
  client?: Partial<User>;
  agency?: Partial<Agency>;
  payments?: Payment[];
  reviews?: Review[];
}

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  type: "MAIN" | "CAUTION";
  status: "PENDING" | "CAPTURED" | "RELEASED" | "REFUNDED";
  stripeIntentId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  reservationId: string;
  authorId: string;
  targetId: string;
  targetType: "CLIENT" | "AGENCY";
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
  author?: Partial<User>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  reservationId?: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender?: Partial<User>;
}

export interface Availability {
  id: string;
  vehicleId: string;
  date: string;
  isBlocked: boolean;
}

export interface SearchParams {
  city?: string;
  category?: VehicleCategory;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
