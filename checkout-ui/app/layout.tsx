import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header"; // Import the new Header Client Component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CheckoutUI Frontend",
  description: "Frontend for the Community Platform microservices",
};

// Simple Footer Component
function Footer() {
  return (
    <footer className="py-6 w-full border-t bg-background/95 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CheckoutUI. All rights reserved.
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground flex flex-col",
          inter.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <Header /> {/* Render the new Header Client Component */}
            <main className="flex-grow container mx-auto p-4">{children}</main>
            <Footer />
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
