// Report-related interfaces

export interface StoreReportData {
    store: {
        id: string;
        name: string;
        address: string;
        logo?: string;
    };
    topPriciestBooks: Array<{
        name: string;
        authorName: string;
        price: number;
        pages: number;
    }>;
    topProlificAuthors: Array<{
        name: string;
        bookCount: number;
    }>;
}
