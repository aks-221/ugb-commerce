import { Link } from "react-router-dom";
import { ShoppingBag, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useClientOrders } from "@/hooks/useOrders";

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: orders = [], isLoading } = useClientOrders(user?.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const statusConfig = {
    pending: { label: "En attente", icon: Clock, color: "bg-amber-100 text-amber-700" },
    completed: { label: "Terminée", icon: CheckCircle, color: "bg-green-100 text-green-700" },
    cancelled: { label: "Annulée", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  };

  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Connectez-vous pour voir vos commandes
          </h1>
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
            Mes commandes
          </h1>
          <p className="text-muted-foreground mt-2">
            Historique de vos commandes sur UAM Commerce
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status || "pending"];
              const StatusIcon = status.icon;
              return (
                <div
                  key={order.id}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Commande du {formatDate(order.created_at)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      {order.vendor && (
                        <p className="text-sm text-foreground mt-1">
                          Vendeur : <span className="font-medium">{order.vendor.shop_name}</span>
                        </p>
                      )}
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl"
                        >
                          {item.product && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                              <img
                                src={item.product.image_url || "/placeholder.svg"}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {item.product?.name || "Produit supprimé"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Quantité: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-semibold text-primary text-sm">
                            {formatPrice(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.message && (
                    <div className="mt-3 p-3 bg-accent/10 rounded-xl">
                      <p className="text-sm text-foreground">💬 {order.message}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucune commande
            </h3>
            <p className="text-muted-foreground mb-6">
              Commencez par explorer les produits disponibles
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

export default MyOrders;
