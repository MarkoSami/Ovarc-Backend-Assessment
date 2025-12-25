// Repository interfaces
export * from './interfaces/IBaseRepository';

// Base repository
export * from './BaseRepository';

// Entity repositories
export * from './AuthorRepository';
export * from './BookRepository';
export * from './StoreRepository';
export * from './StoreBookRepository';

// Re-export types from interfaces for convenience
export type { BookWithAuthor, StoreBookWithDetails } from '../interfaces';
