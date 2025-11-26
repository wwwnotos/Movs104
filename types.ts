export type MediaType = 'movie' | 'tv';

export interface CastMember {
  name: string;
  role: string;
  image: string;
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  releaseDate?: string; // Full date string (YYYY-MM-DD) for new content tracking
  rating: number; // 0-10
  appRating?: number; // 0-5 scale (MOVOS Users)
  duration?: string;
  type: MediaType;
  genre: string[];
  description: string;
  posterUrl: string;
  backdropUrl: string;
  cast?: CastMember[];
  isTrending?: boolean;
  trailerUrl?: string; // Link to YouTube video or search result
  trailerKey?: string; // YouTube Video ID for embedding
  isSearchEmbed?: boolean; // If true, trailerKey is a search query, not an ID
}

export type ViewState = 'home' | 'search' | 'saved' | 'profile';

export interface User {
  name: string;
  email: string;
  joined: string;
}