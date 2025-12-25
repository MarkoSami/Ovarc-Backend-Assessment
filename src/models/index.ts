import Author from './Author';
import Book from './Book';
import Store from './Store';
import StoreBook from './StoreBook';


// Author -> Books (One-to-Many)
Author.hasMany(Book, {
    foreignKey: 'authorId',
    as: 'books',
});

Book.belongsTo(Author, {
    foreignKey: 'authorId',
    as: 'author',
});

// Store <-> Book (Many-to-Many through StoreBook)
Store.belongsToMany(Book, {
    through: StoreBook,
    foreignKey: 'storeId',
    otherKey: 'bookId',
    as: 'books',
});

Book.belongsToMany(Store, {
    through: StoreBook,
    foreignKey: 'bookId',
    otherKey: 'storeId',
    as: 'stores',
});

// Direct access to junction table
Store.hasMany(StoreBook, {
    foreignKey: 'storeId',
    as: 'storeBooks',
});

StoreBook.belongsTo(Store, {
    foreignKey: 'storeId',
    as: 'store',
});

Book.hasMany(StoreBook, {
    foreignKey: 'bookId',
    as: 'storeBooks',
});

StoreBook.belongsTo(Book, {
    foreignKey: 'bookId',
    as: 'book',
});

export { Author, Book, Store, StoreBook };
