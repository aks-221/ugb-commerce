import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { Product } from "@/types";
import { useMemo } from "react";

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: favorites = [], isLoading } = useFavorites(user?.id);

  const products: Product[] = useMemo(() => {
    return favorites
      .filter(f => f.product)
      .map((f) => {
        const p = f.product!;
        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          description: p.description || "",
          image: p.image_url || "/placeholder.svg",
          category: p.category?.name || "Autre",
          stock: p.stock,
          status: (p.is_available && p.stock > 0 ? "disponible" : "epuise") as "disponible" | "epuise",
          vendorId: p.vendor_id,
          vendorName: p.vendor?.shop_name || "Vendeur",
          vendorPhone: p.vendor?.phone || "",
          vendorPavilion: p.vendor?.pavilion || "",
          vendorRoom: p.vendor?.room || "",
          isVendeurVerified: p.vendor?.is_verified || false,
          createdAt: new Date(p.created_at),
        };
      });
  }, [favorites]);

  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Connectez-vous pour voir vos favoris
          </h1>
          <p className="text-muted-foreground mb-6">
            Sauvegardez vos produits préférés pour les retrouver facilement
          </p>
          <Link to="/connexion">
            <Button size="lg">Se connecter</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Mes favoris
          </h1>
          <p className="text-muted-foreground mt-2">
            {products.length} produit{products.length > 1 ? "s" : ""} sauvegardé{products.length > 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucun favori
            </h3>
            <p className="text-muted-foreground mb-6">
              Explorez les produits et ajoutez-les à vos favoris
            </p>
            <Link to="/produits">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Explorer les produits
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
