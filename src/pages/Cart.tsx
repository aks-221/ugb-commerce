import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, MessageCircle, Send, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { toast } from "sonner";
import { useState } from "react";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    if (!user) {
      toast.error("Connectez-vous pour passer commande");
      navigate("/connexion");
      return;
    }

    setIsOrdering(true);
    try {
      await createOrder.mutateAsync({
        clientId: user.id,
        vendorId: items[0].product.vendorId,
        totalAmount: totalPrice,
        message: message || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      });

      // Also open WhatsApp for direct contact
      const vendor = items[0].product;
      const productList = items
        .map((item) => `- ${item.product.name} x${item.quantity} (${formatPrice(item.product.price * item.quantity)})`)
        .join("\n");
      
      const whatsappMessage = encodeURIComponent(
        `Bonjour ${vendor.vendorName},\n\nJe viens de passer commande sur UAM Commerce :\n${productList}\n\nTotal: ${formatPrice(totalPrice)}${message ? `\n\nMessage: ${message}` : ""}\n\nMerci !`
      );

      if (vendor.vendorPhone) {
        window.open(`https://wa.me/${vendor.vendorPhone.replace(/\s+/g, "")}?text=${whatsappMessage}`, "_blank");
      }

      clearCart();
      setMessage("");
      toast.success("Commande envoyée avec succès !");
      navigate("/mes-commandes");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsOrdering(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Votre panier est vide
            </h1>
            <p className="text-muted-foreground mb-6">
              Découvrez les produits disponibles sur le campus
            </p>
            <Link to="/produits">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Explorer les produits
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const vendor = items[0].product;

  return (
    <Layout>
      <div className="container py-8">
        <Link
          to="/produits"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuer mes achats
        </Link>

        <h1 className="text-3xl font-display font-bold text-foreground mb-8">
          Mon panier
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vendor Info */}
            <div className="bg-secondary/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {vendor.vendorName.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendeur</p>
                <p className="font-medium text-foreground">{vendor.vendorName}</p>
              </div>
            </div>

            {/* Items */}
            {items.map((item) => (
              <div
                key={item.product.id}
                className="bg-card rounded-2xl border border-border p-4 flex gap-4"
              >
                <Link to={`/produit/${item.product.id}`}>
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/produit/${item.product.id}`}>
                    <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-primary mt-2">
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 bg-secondary rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-2 text-foreground hover:text-primary transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-2 text-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Vider le panier
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Récapitulatif
              </h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="text-foreground font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Message for vendor */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Message au vendeur (optionnel)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Je passe vers 14h..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isOrdering}
                className="w-full gap-2"
              >
                {isOrdering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {isOrdering ? "Envoi..." : "Passer commande"}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                💡 La commande sera envoyée au vendeur + redirection WhatsApp.
                Le paiement se fait directement (Cash, Wave, Orange Money).
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
