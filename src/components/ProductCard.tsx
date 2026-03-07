import { Link } from "react-router-dom";
import { Heart, ShoppingCart, BadgeCheck } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCart, CartProduct } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.status === "epuise") {
      toast.error("Ce produit est épuisé");
      return;
    }
    
    // Convert Product to CartProduct
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      vendorPhone: product.vendorPhone,
      vendorPavilion: product.vendorPavilion,
      vendorRoom: product.vendorRoom,
    };
    
    const success = addToCart(cartProduct);
    if (success) {
      toast.success("Produit ajouté au panier");
    } else {
      toast.error("Vous ne pouvez commander qu'auprès d'un seul vendeur à la fois");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  if (product.status === "epuise") {
    return null; // Produit épuisé masqué automatiquement
  }

  return (
    <Link to={`/produit/${product.id}`} className="group">
      <div className="bg-card rounded-2xl overflow-hidden shadow-card card-hover border border-border/50">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badge stock faible */}
          {product.stock <= 2 && product.stock > 0 && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-medium rounded-full bg-destructive text-destructive-foreground">
              Plus que {product.stock}
            </span>
          )}
          
          {/* Favoris button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toast.success("Ajouté aux favoris");
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Heart className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2">
          {/* Category */}
          <span className="text-[8px] font-medium text-primary uppercase tracking-wider">
            {product.category}
          </span>
          
          {/* Name */}
          <h3 className="font-medium text-foreground mt-0.5 line-clamp-2 group-hover:text-primary transition-colors text-xs">
            {product.name}
          </h3>
          
          {/* Vendeur */}
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="text-[8px] text-muted-foreground">
              par {product.vendorName}
            </span>
            {product.isVendeurVerified && (
              <BadgeCheck className="h-2.5 w-2.5 text-accent" />
            )}
          </div>
          
          {/* Price & Action */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddToCart}
              className="h-6 px-1.5 gap-0.5"
            >
              <ShoppingCart className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
