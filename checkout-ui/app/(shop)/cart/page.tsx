"use client";

import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MinusIcon, PlusIcon, TrashIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast"; // Assuming useToast is correctly set up

export default function CartPage() {
  const { cart, loading, fetchCart, updateCartItemQuantity, removeCartItem } =
    useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      toast({
        title: "Login Required",
        description: "Please log in to view your cart.",
        variant: "default",
      });
    } else if (isAuthenticated && !user?.userId) {
      // This case should ideally not happen if user is authenticated
      toast({
        title: "Error",
        description: "Could not retrieve user ID. Please try logging in again.",
        variant: "destructive",
      });
      // Optionally logout
      // logout();
    }
  }, [isAuthenticated, authLoading, router, user?.userId, toast]);

  const handleQuantityChange = async (
    productId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 0) return; // Prevent negative quantities
    await updateCartItemQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId: string) => {
    await removeCartItem(productId);
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-14rem)]">
        <p>Loading cart...</p> {/* Placeholder for a real spinner/skeleton */}
      </div>
    );
  }

  if (!isAuthenticated || !cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-center space-y-4">
        <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
        <p className="text-muted-foreground">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link href="/products">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center space-y-4">
          <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
          <p className="text-muted-foreground">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items in Cart</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <Link href={`/products/${item.productId}`}>
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="rounded-md object-cover"
                            />
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/products/${item.productId}`}
                            className="hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            ID: {item.productId}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity - 1,
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.productId,
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-16 text-center"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <PlusIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${(item.priceCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {((item.priceCents * item.quantity) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remove Item</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to remove &quot;
                                  {item.name}&quot; from your cart?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleRemoveItem(item.productId)
                                  }
                                >
                                  Remove
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Cart Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
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
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${(cart.totalPriceCents / 100).toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/checkout" className="w-full">
                  <Button className="w-full">Proceed to Checkout</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
