import { Link } from "react-router-dom";
import { ArrowRight, Store, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [displayCount, setDisplayCount] = useState(24);
  const { data: stats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
       const { data } = await supabase.rpc('get_platform_stats');
      return {
        totalUsers: (data as any)?.total_users || 0,
        totalVendors: (data as any)?.total_vendors || 0,
      };
    },
  });

  // Transform database products to UI Product type
  const products: Product[] = useMemo(() => {
    return dbProducts.map((p) => ({
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
    }));
  }, [dbProducts]);

  const availableProducts = products.filter(p => p.status === "disponible");

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        <div className="container relative py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-4">
              🎓 Université Gaston Berger
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Achetez & Vendez sur le Campus
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
              La plateforme met en relation, le paiement et la remise se font 
              directement entre étudiants. Cash, Wave ou Orange Money.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/produits">
                <Button size="lg" variant="outline" className="gap-2 border-2 border-primary-foreground/60 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground">
                  <ShoppingBag className="h-5 w-5" />
                  Explorer les produits
                </Button>
              </Link>
              <Link to="/inscription-vendeur">
                <Button size="lg" variant="secondary" className="gap-2 font-semibold">
                  <Store className="h-5 w-5" />
                  Devenir vendeur
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background" style={{
          clipPath: "polygon(0 100%, 100% 100%, 100% 0, 75% 60%, 50% 20%, 25% 60%, 0 0)"
        }}></div>
      </section>

      {/* Stats */}
      <section className="container -mt-8 relative z-10">
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <div className="bg-card rounded-2xl p-4 text-center shadow-card border border-border/50">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}+</p>
            <p className="text-xs text-muted-foreground">Étudiants</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-card border border-border/50">
            <Store className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.totalVendors || 0}+</p>
            <p className="text-xs text-muted-foreground">Vendeurs</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-card border border-border/50">
            <ShoppingBag className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{products.length}+</p>
            <p className="text-xs text-muted-foreground">Produits</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Catégories
            </h2>
            <p className="text-muted-foreground mt-1">
              Trouvez ce dont vous avez besoin
            </p>
          </div>
        </div>
        {categoriesLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="container py-16 pt-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Produits récents
            </h2>
            <p className="text-muted-foreground mt-1">
              Les dernières annonces sur le campus
            </p>
          </div>
          <Link to="/produits">
            <Button variant="ghost" className="gap-2 text-primary">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {productsLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-2 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : availableProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {availableProducts.slice(0, displayCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {availableProducts.length > displayCount && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setDisplayCount(prev => prev + 24)}
                  className="gap-2"
                >
                  Voir plus de produits
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun produit disponible pour le moment</p>
            <Link to="/inscription-vendeur" className="text-primary hover:underline mt-2 inline-block">
              Soyez le premier vendeur !
            </Link>
          </div>
        )}
      </section>

      {/* CTA Vendeur */}
      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-3xl gradient-accent p-8 md:p-12">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-white/20 text-white mb-4">
              💰 1er mois gratuit
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
              Vendez vos produits sur le campus
            </h2>
            <p className="text-white/90 mb-6">
              Inscrivez-vous comme vendeur et commencez à vendre vos produits 
              aux autres étudiants. Abonnement à seulement 1 000 FCFA/mois.
            </p>
            <Link to="/inscription-vendeur">
              <Button size="lg" variant="secondary" className="font-semibold">
                Créer ma boutique
              </Button>
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32"></div>
          <div className="absolute right-20 top-0 w-32 h-32 bg-white/10 rounded-full -mt-16"></div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;