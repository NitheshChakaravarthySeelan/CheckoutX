import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button"; // Import AddToCartButton

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number; // Assuming price is a number for display
    imageUrl: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-video w-full"
      >
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <CardHeader className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold line-clamp-2 min-h-[56px]">
          <Link href={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2 min-h-[40px]">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-lg font-bold text-primary">
          ${(product.price / 100).toFixed(2)} {/* Assuming price is in cents */}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/products/${product.id}`}>View Details</Link>
        </Button>
        <AddToCartButton productId={product.id} /> {/* Use the new component */}
      </CardFooter>
    </Card>
  );
}
