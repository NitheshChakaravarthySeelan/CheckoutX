// app/(shop)/products/page.tsx
import { apiRequest } from "@/lib/api";
import { ProductCard } from "@/components/product/product-card";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  // Add other fields as per your API response
}

export default async function ProductsPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    // This assumes your gateway-bff exposes /api/products which then calls product-read
    products = await apiRequest<Product[]>("/api/products");
  } catch (err: any) {
    console.error("Failed to fetch products:", err);
    error = err.message || "Could not load products.";
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Our Products</h1>
      {error && (
        <div className="text-destructive text-center py-4">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {!products.length && !error && (
        <p className="text-muted-foreground text-center py-8">
          No products found.
        </p>
      )}
    </div>
  );
}
