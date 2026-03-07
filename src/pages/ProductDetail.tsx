import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, BadgeCheck, MapPin, Phone, MessageCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useProduct } from "@/hooks/useProducts";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: favorites = [] } = useFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();

  const isFavorite = favorites.some(f => f.product_id === id);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Produit non trouvé
          </h1>
          <p className="text-muted-foreground mb-6">
            Ce produit n'existe pas ou a été supprimé.
          </p>
          <Link to="/produits">
            <Button>Voir tous les produits</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const handleAddToCart = () => {
    if (!product.is_available || product.stock <= 0) {
      toast.error("Ce produit est épuisé");
      return;
    }
    
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || "/placeholder.svg",
      stock: product.stock,
      vendorId: product.vendor_id,
      vendorName: product.vendor?.shop_name || "Vendeur",
      vendorPhone: product.vendor?.phone || "",
      vendorPavilion: product.vendor?.pavilion || "",
      vendorRoom: product.vendor?.room || "",
    };
    
    const success = addToCart(cartProduct);
    if (success) {
      toast.success("Produit ajouté au panier");
    } else {
      toast.error("Vous ne pouvez commander qu'auprès d'un seul vendeur à la fois. Videz votre panier pour commander auprès d'un autre vendeur.");
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }
    toggleFavorite.mutate({ userId: user.id, productId: product.id, isFavorite });
  };

  const handleDirectOrder = () => {
    if (!product.vendor?.phone) {
      toast.error("Numéro du vendeur non disponible");
      return;
    }
    const message = encodeURIComponent(
      `Bonjour ${product.vendor.shop_name}, je suis intéressé(e) par votre produit "${product.name}" à ${formatPrice(product.price)} sur UAM Commerce.`
    );
    window.open(`https://wa.me/${product.vendor.phone.replace(/\s+/g, "")}?text=${message}`, "_blank");
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Back Button */}
        <Link
          to="/produits"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-secondary">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Status badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {!product.is_available && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-destructive text-destructive-foreground">
                  Épuisé
                </span>
              )}
              {product.stock <= 2 && product.stock > 0 && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-destructive text-destructive-foreground">
                  Plus que {product.stock} !
                </span>
              )}
            </div>

            {/* Favorite button */}
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-4 right-4 p-3 rounded-full bg-card/80 backdrop-blur-sm transition-colors shadow-md ${
                isFavorite ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category */}
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              {product.category?.name || "Produit"}
            </span>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-2">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-3xl font-bold text-primary mt-4">
              {formatPrice(product.price)}
            </p>

            {/* Description */}
            <p className="text-muted-foreground mt-6 leading-relaxed">
              {product.description || "Aucune description disponible."}
            </p>

            {/* Stock */}
            <div className="mt-6 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                product.is_available && product.stock > 0 ? "bg-green-500" : "bg-destructive"
              }`}></span>
              <span className="text-sm text-muted-foreground">
                {product.is_available && product.stock > 0
                  ? `${product.stock} en stock`
                  : "Produit épuisé"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.is_available || product.stock <= 0}
                className="flex-1 gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Ajouter au panier
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDirectOrder}
                className="flex-1 gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Commander directement
              </Button>
            </div>

            {/* Vendor Info */}
            {product.vendor && (
              <div className="mt-8 p-6 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {product.vendor.shop_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {product.vendor.shop_name}
                      </h3>
                      {product.vendor.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.vendor.is_verified ? "Vendeur vérifié" : "Vendeur"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-foreground">
                      {product.vendor.pavilion}, Chambre {product.vendor.room}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <a 
                      href={`tel:${product.vendor.phone}`}
                      className="text-primary hover:underline"
                    >
                      {product.vendor.phone}
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Le paiement et la remise se font directement entre étudiants
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
