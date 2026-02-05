// app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
        Loading authentication...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    redirect("/login"); // Redirect non-admin or unauthenticated users
  }

  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col py-12">
      {children}
    </div>
  );
}
