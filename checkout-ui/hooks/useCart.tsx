"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast"; // Assuming toast is installed

interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  priceCents: number;
  quantity: number;
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalPriceCents: number;
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItemQuantity: (
    productId: string,
    quantity: number,
  ) => Promise<void>;
  removeCartItem: (productId: string) => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Assuming toast is installed
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!isAuthenticated || !user?.userId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // API call to gateway-bff, which then calls cart-crud
      const response = await apiRequest<Cart>(`/api/v1/carts/${user.userId}`, {
        token,
      });
      setCart(response);
    } catch (error: any) {
      console.error("Failed to fetch cart:", error);
      toast({
        title: "Error fetching cart",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.userId, token]);

  const addToCart = async (productId: string, quantity: number) => {
    if (!isAuthenticated || !user?.userId || !token) {
      router.push("/login");
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "default",
      });
      return;
    }
    try {
      const response = await apiRequest<Cart>(
        `/api/v1/carts/${user.userId}/items`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ productId, quantity }),
        },
      );
      setCart(response);
      toast({
        title: "Item Added",
        description: "Product added to your cart successfully.",
      });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error adding item to cart",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateCartItemQuantity = async (
    productId: string,
    quantity: number,
  ) => {
    if (!isAuthenticated || !user?.userId || !token) {
      router.push("/login");
      return;
    }
    if (quantity <= 0) {
      await removeCartItem(productId);
      return;
    }
    try {
      const response = await apiRequest<Cart>(
        `/api/v1/carts/${user.userId}/items/${productId}`,
        {
          method: "PUT",
          token,
          body: JSON.stringify({ quantity }),
        },
      );
      setCart(response);
      toast({
        title: "Cart Updated",
        description: "Item quantity updated.",
      });
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      toast({
        title: "Error updating cart",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeCartItem = async (productId: string) => {
    if (!isAuthenticated || !user?.userId || !token) {
      router.push("/login");
      return;
    }
    try {
      const response = await apiRequest<Cart>(
        `/api/v1/carts/${user.userId}/items/${productId}`,
        {
          method: "DELETE",
          token,
        },
      );
      setCart(response);
      toast({
        title: "Item Removed",
        description: "Product removed from your cart.",
      });
    } catch (error: any) {
      console.error("Error removing cart item:", error);
      toast({
        title: "Error removing item",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
