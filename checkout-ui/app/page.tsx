import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const loadingProducts = Array.from({ length: 3 }); // Placeholder for 3 loading product cards

  return (
    <div className="flex flex-col items-center justify-center min-h-screen-minus-header-footer">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none text-foreground drop-shadow-lg">
              Discover Quality Products, Seamlessly
            </h1>
            <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl leading-relaxed">
              Your one-stop shop for everything you need. Fast, reliable, and
              always in style.
            </p>
            <div className="space-x-4">
              <Link href="/products">
                <Button size="lg" className="shadow-lg">
                  Explore Products
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="shadow-lg">
                  Sign Up Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section with Loading Skeletons */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Featured Products
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl">
              Hand-picked items just for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingProducts.map((_, index) => (
              <Card key={index} className="w-full animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium bg-gray-700 h-6 w-3/4 rounded"></CardTitle>
                  <div className="h-6 w-1/4 bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-700 h-40 w-full rounded-md mb-4"></div>
                  <div className="bg-gray-700 h-4 w-full rounded mb-2"></div>
                  <div className="bg-gray-700 h-4 w-2/3 rounded"></div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="h-10 w-24 bg-gray-700 rounded-md"></div>
                  <div className="h-10 w-24 bg-gray-700 rounded-md"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
