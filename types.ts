
export enum UserRole {
  USER = 'USER',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  location: string;
  regionKey?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface CommunityAuthor {
  id: string;
  name: string;
  image?: string | null;
  locationLabel?: string | null;
}

export interface Post {
  id: string;
  author: CommunityAuthor;
  content: string;
  createdAt: string;
  locationLabel: string;
  imageUrl?: string | null;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  comments: PostComment[];
  status?: 'PUBLISHED' | 'PENDING_REVIEW' | 'REMOVED';
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
}

export interface Business {
  id: string;
  slug?: string;
  name: string;
  category: string;
  address: string;
  imageUrl?: string | null;
  locationLabel?: string;
  status?: string;
  isFavorite?: boolean;
}

export interface EventItem {
  id: string;
  slug?: string;
  title: string;
  venueName: string;
  startsAt: string;
  locationLabel: string;
  imageUrl?: string | null;
  status?: string;
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
