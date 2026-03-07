import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface VendorGuardProps {
  children: ReactNode;
}

export const VendorGuard = ({ children }: VendorGuardProps) => {
  const { user, loading, isVendor, vendorProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (!isVendor || !vendorProfile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
