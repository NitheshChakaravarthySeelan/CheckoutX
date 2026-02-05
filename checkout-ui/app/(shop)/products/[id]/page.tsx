// app/(shop)/products/[id]/page.tsx
import { apiRequest } from "@/lib/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button"; // Import AddToCartButton

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sku: string;
  category: string;
  manufacturer: string;
  stockQuantity: number;
  status: string;
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let product: Product | null = null;
  let error: string | null = null;

  try {
    product = await apiRequest<Product>(`/api/products/${params.id}`);
  } catch (err: any) {
    console.error(`Failed to fetch product with ID ${params.id}:`, err);
    error = err.message || "Could not load product details.";
  }

  if (error || !product) {
    notFound();
  }

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold text-foreground">
          {product.name}
        </h1>
        <p className="text-muted-foreground text-lg">{product.description}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            ${(product.price / 100).toFixed(2)}
          </span>
          {product.stockQuantity > 0 ? (
            <span className="text-sm text-green-500">
              In Stock ({product.stockQuantity})
            </span>
          ) : (
            <span className="text-sm text-destructive">Out of Stock</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Replaced Button with AddToCartButton */}
          <AddToCartButton productId={product.id} initialQuantity={1} />
          <Button size="lg" variant="outline">
            Wishlist
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-4">
          <span>SKU: {product.sku}</span>
          <span>Category: {product.category}</span>
          <span>Manufacturer: {product.manufacturer}</span>
          <span>Status: {product.status}</span>
        </div>
      </div>
    </div>
  );
}
