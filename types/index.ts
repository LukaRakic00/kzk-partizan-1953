// Shared types and interfaces for the application

export interface News {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image?: string;
  images?: string[];
  author: string;
  published: boolean;
  publishedAt?: string | Date;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PlayerCategory = 'seniori' | 'juniori' | 'kadetkinje' | 'pionirke';

export interface Player {
  _id: string;
  name: string;
  surname: string;
  position: string;
  number: number;
  year: number;
  image?: string;
  bio?: string;
  category?: PlayerCategory;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Management {
  _id: string;
  name: string;
  position: string;
  image?: string;
  type: 'upravni_odbor' | 'menadzment';
  subcategory?: 'predsednik' | 'podpredsednik' | 'clanovi_upravnog_odbora' | 'menadzment' | 'direktor' | 'sportski_direktor' | 'direktor_marketinga' | 'pr_marketinga' | 'finansijski_direktor';
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  season?: string;
  title?: string;
  description?: string;
  teamImage?: string;
  upravniOdborImage?: string;
  menadzmentImage?: string;
  subcategoryImages?: {
    predsednik?: string;
    podpredsednik?: string;
    clanovi_upravnog_odbora?: string;
    menadzment?: string;
    direktor?: string;
    sportski_direktor?: string;
    direktor_marketinga?: string;
    pr_marketinga?: string;
    finansijski_direktor?: string;
  };
}

export interface Gallery {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Image {
  _id: string;
  url: string;
  urlSajta?: string;
  folder?: string;
  category?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  round: number;
  score?: {
    home: number;
    away: number;
  };
  linkLive?: string;
}

export interface WabaStanding {
  _id?: string;
  team: string;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
  points: number;
  position: number;
  season?: string;
  updatedAt?: Date;
}

// Constants
export const categoryLabels: Record<string, string> = {
  seniori: 'SENIORI',
  juniori: 'JUNIORI',
  kadetkinje: 'KADETKINJE',
  pionirke: 'PIONIRKE',
};

export const subcategoryLabels: Record<string, string> = {
  predsednik: 'PREDSEDNIK',
  podpredsednik: 'PODPREDSEDNIK',
  clanovi_upravnog_odbora: 'ČLANOVI UPRAVNOG ODBORA',
  menadzment: 'MENADŽMENT',
  direktor: 'DIREKTOR',
  sportski_direktor: 'SPORTSKI DIREKTOR',
  direktor_marketinga: 'DIREKTOR MARKETINGA',
  pr_marketinga: 'PR MARKETINGA',
  finansijski_direktor: 'FINANSIJSKI DIREKTOR',
};

export const categoryDescriptions: Record<string, string> = {
  seniori: 'Naša seniorska ekipa – iskustvo, snaga i liderstvo',
  juniori: 'Najmlađi članovi našeg tima – budućnost košarke',
  kadetkinje: 'Talenti koji rastu i razvijaju se u našem klubu',
  pionirke: 'Mlade talente koje grade budućnost kluba',
};
