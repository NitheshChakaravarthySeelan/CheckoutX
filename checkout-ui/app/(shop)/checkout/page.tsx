"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link"; // Assuming Link is used for navigation

interface CheckoutRequest {
  cart_id: string;
  user_id: string;
  cart_details: any; // Assuming cart_details is the full cart object from useCart
}

interface CheckoutResponse {
  success: boolean;
  order_id?: string;
  message?: string;
}

export default function CheckoutPage() {
  const { cart, loading: cartLoading } = useCart();
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState(""); // Placeholder
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] =
    useState<CheckoutResponse | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      toast({
        title: "Login Required",
        description: "Please log in to proceed to checkout.",
        variant: "default",
      });
    } else if (isAuthenticated && !user?.userId) {
      toast({
        title: "Error",
        description: "User information missing. Please log in again.",
        variant: "destructive",
      });
    } else if (!cartLoading && (!cart || cart.items.length === 0)) {
      router.push("/cart");
      toast({
        title: "Cart Empty",
        description:
          "Your cart is empty. Please add items before checking out.",
        variant: "default",
      });
    }
  }, [
    isAuthenticated,
    authLoading,
    router,
    cartLoading,
    cart,
    user?.userId,
    toast,
  ]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCheckout(true);
    setCheckoutError(null);
    setCheckoutSuccess(null);

    if (
      !isAuthenticated ||
      !user?.userId ||
      !token ||
      !cart ||
      cart.items.length === 0
    ) {
      setCheckoutError("Missing required information for checkout.");
      setLoadingCheckout(false);
      return;
    }

    const checkoutData: CheckoutRequest = {
      cart_id: cart.id,
      user_id: user.userId,
      cart_details: cart, // Sending the full cart details
    };

    try {
      const response = await apiRequest<CheckoutResponse>("/api/checkout", {
        method: "POST",
        token,
        headers: {
          "X-User-ID": user.userId,
          "X-User-Roles": user.roles.join(","),
        },
        body: JSON.stringify(checkoutData),
      });

      setCheckoutSuccess(response);
      toast({
        title: "Order Placed!",
        description: `Your order ${response.order_id || "has been processed"}.`,
        variant: "default",
      });
      // Clear cart client-side after successful order
      // We would ideally refetch the cart or have a dedicated cart clearing API
      // For now, simulate by redirecting
      // router.push('/order-confirmation/' + response.order_id);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setCheckoutError(err.message || "Failed to place order.");
      toast({
        title: "Checkout Failed",
        description: err.message || "There was an issue processing your order.",
        variant: "destructive",
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (
    loadingCheckout ||
    cartLoading ||
    authLoading ||
    !isAuthenticated ||
    !cart
  ) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-14rem)]">
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (checkoutSuccess && checkoutSuccess.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-center space-y-4">
        <h2 className="text-2xl font-bold text-green-500">
          Order Placed Successfully!
        </h2>
        <p className="text-muted-foreground">
          Your order ID: {checkoutSuccess.order_id}
        </p>
        <p className="text-muted-foreground">{checkoutSuccess.message}</p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
            <CardDescription>Enter your delivery address.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  required
                  value={shippingAddress.address}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        state: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input
                    id="zip"
                    type="text"
                    required
                    value={shippingAddress.zip}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        zip: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  required
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      country: e.target.value,
                    })
                  }
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Select your payment method.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for payment method selection */}
            <div className="grid gap-4">
              <Button variant="outline" className="justify-start">
                Credit Card (Placeholder)
              </Button>
              <Button variant="outline" className="justify-start">
                PayPal (Placeholder)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.name} (x{item.quantity})
                </span>
                <span>
                  ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${(cart.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-${(cart.totalDiscountCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${(cart.totalTaxCents / 100).toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${(cart.totalPriceCents / 100).toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            {checkoutError && (
              <p className="text-destructive text-sm mb-2">{checkoutError}</p>
            )}
            <Button
              onClick={handlePlaceOrder}
              disabled={loadingCheckout}
              className="w-full"
            >
              {loadingCheckout ? "Placing Order..." : "Place Order"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
