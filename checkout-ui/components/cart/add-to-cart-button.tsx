"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"; // Assuming useToast is correctly set up
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart"; // Assuming useCart is correctly set up
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddToCartButtonProps {
  productId: string;
  initialQuantity?: number;
}

export function AddToCartButton({
  productId,
  initialQuantity = 1,
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "default",
      });
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      await addToCart(productId, initialQuantity);
    } catch (error) {
      // Error handling is already in useCart, but can add more specific here if needed
      console.error("Failed to add item via button:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={loading || cartLoading}
      className="w-full"
    >
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
