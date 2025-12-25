import { Book, Author } from '../models';

// Book-related interfaces

export interface CreateBookData {
    name: string;
    pages: number;
    authorId: string;
}

export interface BookWithAuthor extends Book {
    author?: Author;
}
