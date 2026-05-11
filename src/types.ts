export interface Guest {
  name: string;
  confirmed: boolean | null; // null means not answered yet
}

export interface GuestGroup {
  id: string; // token
  familyName: string;
  guests: Guest[];
  updatedAt?: any;
  createdAt?: any;
}

export interface WeddingSettings {
  coupleNames: string;
  date: string;
  time: string;
  location: string;
  address: string;
  mapUrl: string;
  heroImageUrl: string;
  welcomeMessage: string;
}
