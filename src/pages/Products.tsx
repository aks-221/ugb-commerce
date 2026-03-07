import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("categorie") || "");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL params
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    const urlCategory = searchParams.get("categorie");
    if (urlSearch) setSearch(urlSearch);
    if (urlCategory) setSelectedCategory(urlCategory);
  }, [searchParams]);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts({
    categoryId: selectedCategory || undefined,
    minPrice: priceMin ? parseInt(priceMin) : undefined,
    maxPrice: priceMax ? parseInt(priceMax) : undefined,
    search: search || undefined,
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

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPriceMin("");
    setPriceMax("");
  };

  const hasActiveFilters = search || selectedCategory || priceMin || priceMax;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Tous les produits
          </h1>
          <p className="text-muted-foreground mt-2">
            {products.length} produit{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {[selectedCategory, priceMin, priceMax].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filtres</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1" />
                  Effacer tout
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Catégorie */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prix Min */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Prix minimum (FCFA)
                </label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Prix Max */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Prix maximum (FCFA)
                </label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="100000"
                  className="w-full h-10 px-3 rounded-lg bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
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
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos filtres de recherche
            </p>
            <Button onClick={clearFilters} variant="outline">
              Effacer les filtres
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
