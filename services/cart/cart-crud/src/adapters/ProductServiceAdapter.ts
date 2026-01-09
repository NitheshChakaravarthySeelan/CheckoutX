import axios from "axios";

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
  quantity: number;
}

export class ProductServiceAdapter {
  private productServiceBaseUrl: string;

  constructor(productServiceBaseUrl: string) {
    this.productServiceBaseUrl = productServiceBaseUrl;
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const response = await axios.get(
        `${this.productServiceBaseUrl}/products/${productId}`,
      );
      if (response.status === 200) {
        return response.data as Product;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }
}
