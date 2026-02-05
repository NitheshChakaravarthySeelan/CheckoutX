"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CreateProductPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stockQuantity: 0,
    sku: "",
    imageUrl: "",
    category: "",
    manufacturer: "",
    status: "ACTIVE", // Default status
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "price" || id === "stockQuantity" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token || !user?.userId || !user?.roles.includes("ADMIN")) {
      setError("Not authorized. Please log in as an admin.");
      setLoading(false);
      return;
    }

    try {
      const productData = {
        ...formData,
        price: Math.round(formData.price * 100), // Convert to cents
      };

      const response = await apiRequest("/api/products", {
        method: "POST",
        token: token,
        headers: {
          "X-User-ID": user.userId,
          "X-User-Roles": user.roles.join(","),
        },
        body: JSON.stringify(productData),
      });

      if (response.id) {
        toast({
          title: "Product Created",
          description: `Product "${response.name}" (ID: ${response.id}) has been created.`,
        });
        router.push(`/products/${response.id}`); // Redirect to new product page
      } else {
        throw new Error("Product creation failed, no ID returned.");
      }
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError(err.message || "Failed to create product.");
      toast({
        title: "Error",
        description: err.message || "Failed to create product.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Product</CardTitle>
          <CardDescription>
            Fill in the details below to add a new product to your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  type="text"
                  required
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2 col-span-full">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  required
                  value={formData.stockQuantity}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  type="text"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              {/* Status can be a select dropdown later if needed */}
              {/* <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" type="text" value={formData.status} onChange={handleChange} />
              </div> */}
            </div>
            {error && <p className="text-destructive text-sm mt-4">{error}</p>}
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
