import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Home,
  Settings,
  BadgeCheck,
  AlertCircle,
  Loader2,
  TrendingUp,
  Wallet,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ugbLogo from "@/assets/ugb-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorProducts, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useVendorOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { AddProductDialog } from "@/components/vendor/AddProductDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVendorPaymentRequests, useCreatePaymentRequest } from "@/hooks/usePaymentRequests";
import { supabase } from "@/integrations/supabase/client";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { profile, vendorProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"produits" | "commandes" | "profil" | "abonnement">("produits");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("wave");
  const [transactionRef, setTransactionRef] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    shop_name: "",
    phone: "",
    pavilion: "",
    room: "",
  });

  const { data: products = [], isLoading: productsLoading } = useVendorProducts(vendorProfile?.id);
  const { data: orders = [], isLoading: ordersLoading } = useVendorOrders(vendorProfile?.id);
  
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();
  const { data: paymentRequests = [], isLoading: paymentsLoading } = useVendorPaymentRequests(vendorProfile?.id);
  const createPaymentRequest = useCreatePaymentRequest();

  const hasPendingPayment = paymentRequests.some(p => p.status === "pending");

  // Initialize profile form when vendorProfile loads
  useEffect(() => {
    if (vendorProfile) {
      setProfileForm({
        shop_name: vendorProfile.shop_name || "",
        phone: vendorProfile.phone || "",
        pavilion: vendorProfile.pavilion || "",
        room: vendorProfile.room || "",
      });
    }
  }, [vendorProfile]);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    if (vendorProfile) {
      setProfileForm({
        shop_name: vendorProfile.shop_name || "",
        phone: vendorProfile.phone || "",
        pavilion: vendorProfile.pavilion || "",
        room: vendorProfile.room || "",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!vendorProfile) return;
    
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          shop_name: profileForm.shop_name,
          phone: profileForm.phone,
          pavilion: profileForm.pavilion,
          room: profileForm.room,
        })
        .eq('id', vendorProfile.id);
      
      if (error) throw error;
      
      toast.success("Profil mis à jour avec succès !");
      setIsEditingProfile(false);
      // Refresh vendor profile
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (vendorProfile) {
      setProfileForm({
        shop_name: vendorProfile.shop_name || "",
        phone: vendorProfile.phone || "",
        pavilion: vendorProfile.pavilion || "",
        room: vendorProfile.room || "",
      });
    }
  };

  const handleSubmitPayment = async () => {
    if (!vendorProfile) return;
    await createPaymentRequest.mutateAsync({
      vendorId: vendorProfile.id,
      paymentMethod,
      transactionReference: transactionRef || undefined,
    });
    setTransactionRef("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    await updateProduct.mutateAsync({
      id: productId,
      is_available: !currentStatus,
    });
  };

  const handleDeleteProduct = async () => {
    if (deleteProductId) {
      await deleteProduct.mutateAsync(deleteProductId);
      setDeleteProductId(null);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ orderId, status: "completed" });
  };

  const getSubscriptionStatus = () => {
    if (!vendorProfile) return { label: "Inactif", color: "bg-destructive/10 text-destructive" };
    
    // Check if subscription is expired based on end date
    if (vendorProfile.subscription_end_date && new Date(vendorProfile.subscription_end_date) < new Date()) {
      return { label: "Expiré", color: "bg-destructive/10 text-destructive" };
    }
    
    switch (vendorProfile.subscription_status) {
      case "active":
        return { label: "Abonnement actif", color: "bg-green-100 text-green-700" };
      case "trial":
        return { label: "Période d'essai", color: "bg-amber-100 text-amber-700" };
      case "expired":
        return { label: "Expiré", color: "bg-destructive/10 text-destructive" };
      default:
        return { label: "Suspendu", color: "bg-destructive/10 text-destructive" };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();
  
  const isSubscriptionExpired = !vendorProfile || 
    vendorProfile.subscription_status === "expired" || 
    vendorProfile.subscription_status === "suspended" ||
    (vendorProfile.subscription_end_date && new Date(vendorProfile.subscription_end_date) < new Date());

  const availableProducts = products.filter(p => p.is_available && p.stock > 0);
  const outOfStockProducts = products.filter(p => !p.is_available || p.stock === 0);
  const pendingOrders = orders.filter(o => o.status === "pending");

  // Monthly sales calculation
  const now = new Date();
  const currentMonthOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return o.status === "completed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlySalesTotal = currentMonthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={ugbLogo} alt="UGB" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-primary font-display">
                UGB Commerce
              </span>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Espace Vendeur
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${subscriptionStatus.color}`}>
              <BadgeCheck className="h-4 w-4" />
              <span className="text-xs font-medium">{subscriptionStatus.label}</span>
            </div>
            
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Boutique</span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Bonjour, {vendorProfile?.shop_name || profile?.full_name} ! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos produits et commandes depuis votre espace vendeur.
          </p>
        </div>

        {/* Subscription Expired Banner */}
        {isSubscriptionExpired && (
          <div className="mb-8 p-6 bg-destructive/10 border border-destructive/30 rounded-2xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive text-lg">
                  Abonnement expiré
                </h3>
                <p className="text-destructive/80 mt-1">
                  Votre abonnement a expiré. Vos produits ne sont plus visibles par les clients. 
                  Renouvelez votre abonnement (1 000 FCFA/mois) via Wave ou Orange Money pour réactiver votre boutique.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setActiveTab("abonnement")}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Renouveler maintenant
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
            <Package className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
            <p className="text-sm text-muted-foreground">Produits</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
            <ShoppingCart className="h-6 w-6 text-accent mb-2" />
            <p className="text-2xl font-bold text-foreground">{pendingOrders.length}</p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
            <Eye className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{availableProducts.length}</p>
            <p className="text-sm text-muted-foreground">Disponibles</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
            <AlertCircle className="h-6 w-6 text-destructive mb-2" />
            <p className="text-2xl font-bold text-foreground">{outOfStockProducts.length}</p>
            <p className="text-sm text-muted-foreground">Épuisés</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 shadow-card">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{formatPrice(monthlySalesTotal)}</p>
            <p className="text-sm text-muted-foreground">Ventes ce mois</p>
            <p className="text-xs text-muted-foreground mt-1">{currentMonthOrders.length} commande(s)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("produits")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "produits"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Mes produits
          </button>
          <button
            onClick={() => setActiveTab("commandes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "commandes"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-2" />
            Commandes reçues
            {pendingOrders.length > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("profil")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "profil"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Mon profil
          </button>
          <button
            onClick={() => setActiveTab("abonnement")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "abonnement"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Wallet className="h-4 w-4 inline mr-2" />
            Abonnement
            {hasPendingPayment && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                En cours
              </span>
            )}
          </button>
        </div>

        {/* Products Content */}
        {activeTab === "produits" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={() => setAddDialogOpen(true)} 
                className="gap-2"
                disabled={isSubscriptionExpired}
                title={isSubscriptionExpired ? "Renouvelez votre abonnement pour ajouter des produits" : undefined}
              >
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucun produit
                </h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par ajouter votre premier produit.
                </p>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un produit
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-2xl border border-border p-4 flex gap-4 items-center"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {product.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            product.is_available && product.stock > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {product.is_available && product.stock > 0 ? "Disponible" : "Épuisé"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(product.category as any)?.name || "Sans catégorie"} • Stock: {product.stock}
                      </p>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSubscriptionExpired}
                        onClick={() => {
                          setEditProduct(product);
                          setAddDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAvailability(product.id, product.is_available ?? true)}
                        disabled={updateProduct.isPending || isSubscriptionExpired}
                      >
                        {product.is_available ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={isSubscriptionExpired}
                        onClick={() => setDeleteProductId(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Content */}
        {activeTab === "commandes" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucune commande
                </h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore reçu de commande.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {(order as any).client?.full_name || "Client"}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            order.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {order.status === "pending" ? "En attente" : 
                           order.status === "completed" ? "Terminé" : "Annulé"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        📞 {(order as any).client?.phone || "Non renseigné"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {(order as any).order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Produit #{item.product_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Quantité: {item.quantity} × {formatPrice(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          {formatPrice(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {order.message && (
                    <div className="p-3 bg-accent/10 rounded-xl mb-4">
                      <p className="text-sm text-foreground">
                        💬 {order.message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const phone = (order as any).client?.phone;
                        if (phone) window.open(`tel:${phone}`, "_blank");
                        else toast.error("Numéro non disponible");
                      }}
                    >
                      📞 Appeler
                    </Button>
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={updateOrderStatus.isPending}
                      >
                        {updateOrderStatus.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        ✅ Marquer terminé
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Content */}
        {activeTab === "profil" && (
          <div className="max-w-xl">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Informations de retrait
                </h2>
                {!isEditingProfile && (
                  <Button variant="outline" size="sm" onClick={handleEditProfile}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Nom de la boutique
                  </label>
                  <input
                    type="text"
                    value={isEditingProfile ? profileForm.shop_name : vendorProfile?.shop_name || ""}
                    onChange={(e) => isEditingProfile && setProfileForm({...profileForm, shop_name: e.target.value})}
                    readOnly={!isEditingProfile}
                    className={`w-full h-12 px-4 rounded-xl border-0 text-foreground ${
                      isEditingProfile ? "bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20" : "bg-secondary"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={isEditingProfile ? profileForm.phone : vendorProfile?.phone || ""}
                    onChange={(e) => isEditingProfile && setProfileForm({...profileForm, phone: e.target.value})}
                    readOnly={!isEditingProfile}
                    className={`w-full h-12 px-4 rounded-xl border-0 text-foreground ${
                      isEditingProfile ? "bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20" : "bg-secondary"
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Village
                    </label>
                    <input
                      type="text"
                      value={isEditingProfile ? profileForm.pavilion : vendorProfile?.pavilion || ""}
                      onChange={(e) => isEditingProfile && setProfileForm({...profileForm, pavilion: e.target.value})}
                      readOnly={!isEditingProfile}
                      className={`w-full h-12 px-4 rounded-xl border-0 text-foreground ${
                        isEditingProfile ? "bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20" : "bg-secondary"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Chambre
                    </label>
                    <input
                      type="text"
                      value={isEditingProfile ? profileForm.room : vendorProfile?.room || ""}
                      onChange={(e) => isEditingProfile && setProfileForm({...profileForm, room: e.target.value})}
                      readOnly={!isEditingProfile}
                      className={`w-full h-12 px-4 rounded-xl border-0 text-foreground ${
                        isEditingProfile ? "bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20" : "bg-secondary"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEdit}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveProfile}
                    disabled={!profileForm.shop_name.trim() || !profileForm.phone.trim()}
                  >
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>

            {/* Subscription */}
            <div className="bg-card rounded-2xl border border-border p-6 mt-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Abonnement
              </h2>
              <div className={`flex items-center justify-between p-4 rounded-xl ${subscriptionStatus.color.replace('text-', 'bg-').split(' ')[0]}/20`}>
                <div>
                  <p className={`font-medium ${subscriptionStatus.color.split(' ')[1]}`}>
                    {subscriptionStatus.label}
                  </p>
                  {vendorProfile?.subscription_end_date && (
                    <p className={`text-sm ${subscriptionStatus.color.split(' ')[1]}/80`}>
                      Expire le {new Date(vendorProfile.subscription_end_date).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                <BadgeCheck className={`h-8 w-8 ${subscriptionStatus.color.split(' ')[1]}`} />
              </div>
              {isSubscriptionExpired && (
                <Button className="w-full mt-4 gap-2" onClick={() => setActiveTab("abonnement")}>
                  <Wallet className="h-4 w-4" />
                  Renouveler mon abonnement
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Abonnement Tab */}
        {activeTab === "abonnement" && (
          <div className="max-w-xl space-y-6">
            {/* Current status */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                État de votre abonnement
              </h2>
              <div className={`flex items-center justify-between p-4 rounded-xl ${subscriptionStatus.color.replace('text-', 'bg-').split(' ')[0]}/20`}>
                <div>
                  <p className={`font-medium ${subscriptionStatus.color.split(' ')[1]}`}>
                    {subscriptionStatus.label}
                  </p>
                  {vendorProfile?.subscription_end_date && (
                    <p className={`text-sm ${subscriptionStatus.color.split(' ')[1]}/80`}>
                      Expire le {new Date(vendorProfile.subscription_end_date).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                <BadgeCheck className={`h-8 w-8 ${subscriptionStatus.color.split(' ')[1]}`} />
              </div>
            </div>

            {/* Payment instructions */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                💳 Payer l'abonnement (1 000 FCFA/mois)
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">W</div>
                    <div>
                      <p className="font-semibold text-foreground">Wave</p>
                      <p className="text-sm text-muted-foreground">Envoyez 1 000 FCFA au :</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground ml-13 pl-[52px]">+227 77 817 75 75</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">OM</div>
                    <div>
                      <p className="font-semibold text-foreground">Orange Money</p>
                      <p className="text-sm text-muted-foreground">Envoyez 1 000 FCFA au :</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground ml-13 pl-[52px]">+227 77 817 75 75</p>
                </div>
              </div>
            </div>

            {/* Submit payment request */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                <Send className="h-5 w-5 inline mr-2" />
                Confirmer votre paiement
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Après avoir effectué le paiement, remplissez ce formulaire pour que l'admin puisse vérifier et activer votre abonnement.
              </p>

              {hasPendingPayment ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock className="h-5 w-5" />
                    <p className="font-medium">Demande en cours de vérification</p>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    Votre demande de paiement est en attente de confirmation par l'administration.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Méthode de paiement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="cash">Cash (en main propre)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Référence de transaction (optionnel)
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="Ex: ID de transaction Wave/OM"
                      className="w-full h-12 px-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleSubmitPayment}
                    disabled={createPaymentRequest.isPending}
                  >
                    {createPaymentRequest.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Envoyer la demande de renouvellement
                  </Button>
                </div>
              )}
            </div>

            {/* Payment history */}
            {paymentRequests.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  📋 Historique des demandes
                </h2>
                <div className="space-y-3">
                  {paymentRequests.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {pr.payment_method === "wave" ? "Wave" : pr.payment_method === "orange_money" ? "Orange Money" : "Cash"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pr.created_at).toLocaleDateString("fr-FR")}
                          {pr.transaction_reference && ` • Réf: ${pr.transaction_reference}`}
                        </p>
                        {pr.admin_note && (
                          <p className="text-xs text-muted-foreground mt-1">Note: {pr.admin_note}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pr.status === "pending" ? "bg-amber-100 text-amber-700" :
                        pr.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {pr.status === "pending" ? "En attente" : pr.status === "approved" ? "Approuvé" : "Rejeté"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Product Dialog */}
      {vendorProfile && (
        <AddProductDialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setEditProduct(null);
          }}
          vendorId={vendorProfile.id}
          editProduct={editProduct}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorDashboard;
