"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive">
            Product Not Found or Error!
          </CardTitle>
          <CardDescription>
            We could not load the product you were looking for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => reset()}>Try again</Button>
            <Link href="/products" passHref>
              <Button variant="outline">Back to Products</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
