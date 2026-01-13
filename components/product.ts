// types/product.ts (or inside your component)
export interface Product {
    ProductID: number;
    ModelName: string;
    Description: string;
    RetailPrice: number;
    WholesalePrice: number; // Added as per proposal [cite: 11]
    ImageURL: string;
}