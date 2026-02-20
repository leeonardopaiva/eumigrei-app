
export enum UserRole {
  CLIENT = 'CLIENT',
  ADVERTISER = 'ADVERTISER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  location: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  image?: string;
  isSponsored?: boolean;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  address: string;
  image: string;
  isFavorite?: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Freelance';
  image: string;
}

export interface Housing {
  id: string;
  title: string;
  price: string;
  location: string;
  type: 'Apartment' | 'House' | 'Room' | 'Studio';
  image: string;
  rating: number;
}
