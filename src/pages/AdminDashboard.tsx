import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Search,
  Eye,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  BadgeCheck,
  Loader2,
  Wallet,
  CheckCircle2,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ugbLogo from "@/assets/ugb-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllVendors,
  useAllProducts,
  useAllOrders,
  useAllProfiles,
  useAdminStats,
  useUpdateVendorStatus,
  useAdminDeleteProduct,
} from "@/hooks/useAdmin";
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
import { useAllPaymentRequests, useUpdatePaymentRequest } from "@/hooks/usePaymentRequests";

type Tab = "apercu" | "utilisateurs" | "vendeurs" | "produits" | "commandes" | "paiements";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: vendors = [], isLoading: vendorsLoading } = useAllVendors();
  const { data: products = [], isLoading: productsLoading } = useAllProducts();
  const { data: orders = [], isLoading: ordersLoading } = useAllOrders();
  const { data: profiles = [] } = useAllProfiles();

  const updateVendorStatus = useUpdateVendorStatus();
  const deleteProduct = useAdminDeleteProduct();
  const { data: paymentRequests = [], isLoading: paymentsLoading } = useAllPaymentRequests();
  const updatePaymentRequest = useUpdatePaymentRequest();
  const queryClient = useQueryClient();

  const pendingPayments = paymentRequests.filter(p => p.status === "pending");

  const handleApprovePayment = async (requestId: string, vendorId: string) => {
    // Approve the payment request
    await updatePaymentRequest.mutateAsync({
      requestId,
      status: "approved",
      adminNote: "Paiement vérifié",
    });
    // Renew subscription
    await handleRenewSubscription(vendorId);
    toast.success("Paiement approuvé et abonnement renouvelé !");
    queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
  };

  const handleRejectPayment = async (requestId: string) => {
    await updatePaymentRequest.mutateAsync({
      requestId,
      status: "rejected",
      adminNote: "Paiement non vérifié",
    });
    toast.success("Demande rejetée");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  const handleVerifyVendor = async (vendorId: string, verified: boolean) => {
    await updateVendorStatus.mutateAsync({
      vendorId,
      updates: { is_verified: verified },
    });
  };

  const handleSuspendVendor = async (vendorId: string) => {
    await updateVendorStatus.mutateAsync({
      vendorId,
      updates: { subscription_status: "suspended" },
    });
  };

  const handleRenewSubscription = async (vendorId: string) => {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    await updateVendorStatus.mutateAsync({
      vendorId,
      updates: { 
        subscription_status: "active",
      },
    });
    // Update dates separately since they're not in the type
    const { error } = await supabase
      .from('vendor_profiles')
      .update({ 
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
      })
      .eq('id', vendorId);
    if (error) {
      toast.error("Erreur lors du renouvellement");
    } else {
      toast.success("Abonnement renouvelé pour 30 jours");
    }
  };

  const handleDeleteProduct = async () => {
    if (deleteProductId) {
      await deleteProduct.mutateAsync(deleteProductId);
      setDeleteProductId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    setDeletingOrder(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteOrderId);
      
      if (error) throw error;
      
      toast.success("Commande supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setDeleteOrderId(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression de la commande");
    } finally {
      setDeletingOrder(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setDeletingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: deleteUserId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Utilisateur supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setDeletingUser(false);
      setDeleteUserId(null);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery)
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "apercu", label: "Aperçu", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "utilisateurs", label: "Utilisateurs", icon: <Users className="h-4 w-4" /> },
    { id: "vendeurs", label: "Vendeurs", icon: <Store className="h-4 w-4" /> },
    { id: "produits", label: "Produits", icon: <Package className="h-4 w-4" /> },
    { id: "commandes", label: "Commandes", icon: <ShoppingCart className="h-4 w-4" /> },
    { id: "paiements", label: "Paiements", icon: <Wallet className="h-4 w-4" />, badge: pendingPayments.length },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src={ugbLogo} alt="UGB" className="h-10 w-auto" />
            <div>
              <span className="text-lg font-bold text-primary font-display">UGB Commerce</span>
              <p className="text-[10px] text-muted-foreground -mt-1">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Retour boutique
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive mt-1"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-50 bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <img src={ugbLogo} alt="UGB" className="h-8 w-auto" />
                <span className="font-bold text-primary text-sm">Admin</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-display font-bold text-foreground">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
            </div>
            <div className="relative flex-1 max-w-xs md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full h-9 md:h-10 pl-9 pr-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="md:hidden flex gap-1.5 overflow-x-auto mt-3 pb-1 -mx-1 px-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Aperçu */}
          {activeTab === "apercu" && (
            <div className="space-y-6">
              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                   <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                     <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-card">
                       <Store className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2 md:mb-3" />
                       <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalVendors}</p>
                       <p className="text-xs md:text-sm text-muted-foreground">Vendeurs</p>
                     </div>
                     <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-card">
                       <Users className="h-6 w-6 md:h-8 md:w-8 text-accent mb-2 md:mb-3" />
                       <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalClients}</p>
                       <p className="text-xs md:text-sm text-muted-foreground">Utilisateurs</p>
                     </div>
                     <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-card">
                       <Package className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2 md:mb-3" />
                       <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalProducts}</p>
                       <p className="text-xs md:text-sm text-muted-foreground">Produits</p>
                     </div>
                     <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-card">
                       <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-green-500 mb-2 md:mb-3" />
                       <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalOrders}</p>
                       <p className="text-xs md:text-sm text-muted-foreground">Commandes</p>
                     </div>
                   </div>

                  {/* Subscription stats */}
                   <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-card">
                    <h3 className="font-semibold text-foreground mb-4">💰 Abonnements vendeurs</h3>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-sm text-green-600">Actifs</p>
                        <p className="text-2xl font-bold text-green-700">
                          {vendors.filter((v) => v.subscription_status === "active").length}
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl">
                        <p className="text-sm text-amber-600">Essai</p>
                        <p className="text-2xl font-bold text-amber-700">
                          {vendors.filter((v) => v.subscription_status === "trial").length}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-xl">
                        <p className="text-sm text-red-600">Expirés</p>
                        <p className="text-2xl font-bold text-red-700">
                          {vendors.filter((v) => v.subscription_status === "expired" || v.subscription_status === "suspended").length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly sales per vendor */}
                  <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
                    <h3 className="font-semibold text-foreground mb-4">📊 Ventes du mois par vendeur</h3>
                    {(() => {
                      const now = new Date();
                      const monthOrders = orders.filter(o => {
                        const d = new Date(o.created_at);
                        return o.status === "completed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      });
                      const vendorSales = new Map<string, { name: string; total: number; count: number }>();
                      monthOrders.forEach(o => {
                        const vid = o.vendor_id;
                        const existing = vendorSales.get(vid) || { name: o.vendor?.shop_name || "Inconnu", total: 0, count: 0 };
                        existing.total += Number(o.total_amount);
                        existing.count += 1;
                        vendorSales.set(vid, existing);
                      });
                      const sorted = [...vendorSales.entries()].sort((a, b) => b[1].total - a[1].total);
                      const grandTotal = sorted.reduce((s, [, v]) => s + v.total, 0);

                      if (sorted.length === 0) {
                        return <p className="text-sm text-muted-foreground">Aucune vente complétée ce mois-ci.</p>;
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-border">
                            <span className="text-sm font-medium text-muted-foreground">Total du mois</span>
                            <span className="text-lg font-bold text-primary">{formatPrice(grandTotal)}</span>
                          </div>
                          {sorted.map(([vid, v]) => (
                            <div key={vid} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {v.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                                <p className="text-xs text-muted-foreground">{v.count} commande(s)</p>
                              </div>
                              <span className="text-sm font-semibold text-foreground">{formatPrice(v.total)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Recent */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
                      <h3 className="font-semibold text-foreground mb-4">📦 Derniers produits</h3>
                      <div className="space-y-3">
                        {products.slice(0, 5).map((product) => (
                          <div key={product.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary">
                              <img src={product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">par {product.vendor?.shop_name}</p>
                            </div>
                            <span className="text-sm font-semibold text-primary">{formatPrice(product.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
                      <h3 className="font-semibold text-foreground mb-4">🛒 Dernières commandes</h3>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {(order.client?.full_name || "C").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{order.client?.full_name || "Client"}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                order.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : order.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {order.status === "pending" ? "En attente" : order.status === "completed" ? "Terminé" : "Annulé"}
                            </span>
                          </div>
                        ))}
                        {orders.length === 0 && <p className="text-sm text-muted-foreground">Aucune commande</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Utilisateurs */}
          {activeTab === "utilisateurs" && (
            <div className="space-y-4">
              {profiles.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun utilisateur</p>
                </div>
              ) : (
                <>
                  {/* Mobile: cards */}
                  <div className="md:hidden space-y-3">
                    {profiles.filter(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase())).map((profile) => (
                      <div key={profile.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                              {profile.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{profile.full_name}</p>
                              <p className="text-xs text-muted-foreground">{profile.email}</p>
                              {profile.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8" onClick={() => setDeleteUserId(profile.user_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Nom</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Email</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Téléphone</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Inscrit le</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profiles.filter(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase())).map((profile) => (
                            <tr key={profile.id} className="border-t border-border">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {profile.full_name.charAt(0)}
                                  </div>
                                  <span className="font-medium text-foreground">{profile.full_name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">{profile.email}</td>
                              <td className="p-4 text-sm text-muted-foreground">{profile.phone || "—"}</td>
                              <td className="p-4 text-sm text-muted-foreground">{formatDate(profile.created_at)}</td>
                              <td className="p-4">
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteUserId(profile.user_id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Vendeurs */}
          {activeTab === "vendeurs" && (
            <div className="space-y-4">
              {vendorsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun vendeur trouvé</p>
                </div>
              ) : (
                <>
                  {/* Mobile: cards */}
                  <div className="md:hidden space-y-3">
                    {filteredVendors.map((vendor) => (
                      <div key={vendor.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                              {vendor.shop_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground text-sm">{vendor.shop_name}</span>
                                {vendor.is_verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{vendor.phone}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-[10px] rounded-full shrink-0 ${
                              vendor.subscription_status === "active"
                                ? "bg-green-100 text-green-700"
                                : vendor.subscription_status === "trial"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {vendor.subscription_status === "active" ? "Actif" : vendor.subscription_status === "trial" ? "Essai" : vendor.subscription_status === "expired" ? "Expiré" : "Suspendu"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">📍 {vendor.pavilion}, {vendor.room}</p>
                        <div className="flex gap-1.5">
                          {!vendor.is_verified ? (
                            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => handleVerifyVendor(vendor.id, true)} disabled={updateVendorStatus.isPending}>
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Vérifier
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => handleVerifyVendor(vendor.id, false)} disabled={updateVendorStatus.isPending}>
                              <XCircle className="h-3.5 w-3.5 text-amber-500" /> Retirer
                            </Button>
                          )}
                          {(vendor.subscription_status === "expired" || vendor.subscription_status === "suspended") && (
                            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => handleRenewSubscription(vendor.id)} disabled={updateVendorStatus.isPending}>
                              <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Renouveler
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-xs gap-1 h-8 text-destructive" onClick={() => handleSuspendVendor(vendor.id)} disabled={updateVendorStatus.isPending}>
                            <Ban className="h-3.5 w-3.5" /> Suspendre
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Vendeur</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Contact</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Localisation</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Abonnement</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVendors.map((vendor) => (
                            <tr key={vendor.id} className="border-t border-border">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {vendor.shop_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">{vendor.shop_name}</span>
                                      {vendor.is_verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">{vendor.phone}</td>
                              <td className="p-4 text-sm text-muted-foreground">{vendor.pavilion}, {vendor.room}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${vendor.subscription_status === "active" ? "bg-green-100 text-green-700" : vendor.subscription_status === "trial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                  {vendor.subscription_status === "active" ? "Actif" : vendor.subscription_status === "trial" ? "Essai" : vendor.subscription_status === "expired" ? "Expiré" : "Suspendu"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1">
                                  {!vendor.is_verified ? (
                                    <Button variant="ghost" size="icon" onClick={() => handleVerifyVendor(vendor.id, true)} disabled={updateVendorStatus.isPending}>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                  ) : (
                                    <Button variant="ghost" size="icon" onClick={() => handleVerifyVendor(vendor.id, false)} disabled={updateVendorStatus.isPending}>
                                      <XCircle className="h-4 w-4 text-amber-500" />
                                    </Button>
                                  )}
                                  {(vendor.subscription_status === "expired" || vendor.subscription_status === "suspended") && (
                                    <Button variant="ghost" size="icon" title="Renouveler" onClick={() => handleRenewSubscription(vendor.id)} disabled={updateVendorStatus.isPending}>
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" title="Suspendre" onClick={() => handleSuspendVendor(vendor.id)} disabled={updateVendorStatus.isPending}>
                                    <Ban className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Produits */}
          {activeTab === "produits" && (
            <div className="space-y-4">
              {productsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div>
                  {/* Mobile: cards */}
                  <div className="md:hidden space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 bg-card rounded-2xl border border-border">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun produit trouvé</p>
                      </div>
                    ) : filteredProducts.map((product) => (
                      <div key={product.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <img src={product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.vendor?.shop_name} • {product.category?.name}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-primary">{formatPrice(product.price)}</span>
                              <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${product.is_available && product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {product.is_available && product.stock > 0 ? "Dispo" : "Indispo"}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8" onClick={() => setDeleteProductId(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Produit</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Vendeur</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Prix</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Stock</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Statut</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => (
                            <tr key={product.id} className="border-t border-border">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                                    <img src={product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">{product.vendor?.shop_name}</td>
                              <td className="p-4 text-sm font-semibold text-primary">{formatPrice(product.price)}</td>
                              <td className="p-4 text-sm text-muted-foreground">{product.stock}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${product.is_available && product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {product.is_available && product.stock > 0 ? "Disponible" : "Indisponible"}
                                </span>
                              </td>
                              <td className="p-4">
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteProductId(product.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun produit trouvé</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commandes */}
          {activeTab === "commandes" && (
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune commande</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-card rounded-2xl border border-border p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 md:mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          <h3 className="font-semibold text-foreground text-sm md:text-base">
                            {order.client?.full_name || (
                              order.order_type === 'whatsapp' && order.message
                                ? order.message.match(/Client:\s*([^-]+)/)?.[1]?.trim() || "Client anonyme"
                                : "Client anonyme"
                            )}
                          </h3>
                          {!order.client && order.order_type === 'whatsapp' && order.message && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {order.message.match(/Tél:\s*([^\s-]+)/)?.[1] || ""}
                            </p>
                          )}
                          {order.order_type === 'whatsapp' && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {order.vendor?.shop_name || "Vendeur"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                              order.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : order.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.status === "pending" ? "En attente" : order.status === "completed" ? "Terminé" : "Annulé"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-base md:text-lg font-bold text-primary">{formatPrice(order.total_amount)}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive shrink-0 h-8 w-8" 
                          onClick={() => setDeleteOrderId(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-1.5 md:space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2.5 md:p-3 bg-secondary/50 rounded-xl text-xs md:text-sm">
                            <span className="text-foreground truncate mr-2">{item.product?.name || "Produit"}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {item.quantity} × {formatPrice(item.unit_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Paiements */}
          {activeTab === "paiements" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Demandes de paiement d'abonnement
              </h2>
              {paymentsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paymentRequests.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune demande de paiement</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        🔔 En attente ({pendingPayments.length})
                      </h3>
                      <div className="space-y-3">
                        {pendingPayments.map((pr) => (
                          <div key={pr.id} className="bg-card rounded-2xl border-2 border-amber-300 p-4 md:p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-foreground text-base md:text-lg">
                                  {(pr.vendor as any)?.shop_name || "Vendeur"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {(pr.vendor as any)?.phone}
                                </p>
                              </div>
                              <span className="px-2 md:px-3 py-1 bg-amber-100 text-amber-700 text-xs md:text-sm rounded-full font-medium">
                                En attente
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                              <div className="p-3 bg-secondary/50 rounded-xl">
                                <p className="text-xs text-muted-foreground">Méthode</p>
                                <p className="text-sm font-medium text-foreground">
                                  {pr.payment_method === "wave" ? "📱 Wave" : pr.payment_method === "orange_money" ? "📱 Orange Money" : "💵 Cash"}
                                </p>
                              </div>
                              <div className="p-3 bg-secondary/50 rounded-xl">
                                <p className="text-xs text-muted-foreground">Montant</p>
                                <p className="text-sm font-medium text-foreground">{formatPrice(pr.amount)}</p>
                              </div>
                            </div>
                            {pr.transaction_reference && (
                              <p className="text-sm text-muted-foreground mb-3">
                                📋 Réf: <span className="font-mono text-foreground">{pr.transaction_reference}</span>
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mb-4">
                              Soumis le {new Date(pr.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                              <Button
                                className="flex-1 gap-2 text-xs md:text-sm"
                                size="sm"
                                onClick={() => handleApprovePayment(pr.id, pr.vendor_id)}
                                disabled={updatePaymentRequest.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approuver & Renouveler
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-destructive border-destructive text-xs md:text-sm"
                                onClick={() => handleRejectPayment(pr.id)}
                                disabled={updatePaymentRequest.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentRequests.filter(p => p.status !== "pending").length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 mt-6">
                        📋 Historique
                      </h3>
                      <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary/50">
                              <tr>
                                <th className="text-left text-sm font-medium text-muted-foreground p-4">Vendeur</th>
                                <th className="text-left text-sm font-medium text-muted-foreground p-4">Méthode</th>
                                <th className="text-left text-sm font-medium text-muted-foreground p-4">Date</th>
                                <th className="text-left text-sm font-medium text-muted-foreground p-4">Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentRequests.filter(p => p.status !== "pending").map((pr) => (
                                <tr key={pr.id} className="border-t border-border">
                                  <td className="p-4 text-sm font-medium text-foreground">{(pr.vendor as any)?.shop_name || "Vendeur"}</td>
                                  <td className="p-4 text-sm text-muted-foreground">
                                    {pr.payment_method === "wave" ? "Wave" : pr.payment_method === "orange_money" ? "Orange Money" : "Cash"}
                                  </td>
                                  <td className="p-4 text-sm text-muted-foreground">{formatDate(pr.created_at)}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      pr.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}>
                                      {pr.status === "approved" ? "Approuvé" : "Rejeté"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Mobile bottom bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex gap-2 z-50">
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2 text-xs h-10">
              <Home className="h-4 w-4" />
              Retour boutique
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1 gap-2 text-xs h-10 text-destructive border-destructive/30"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
        {/* Spacer for mobile bottom bar */}
        <div className="md:hidden h-16" />
      </div>

      {/* Delete product dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete order dialog */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement la commande et tous les éléments associés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingOrder}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-destructive text-destructive-foreground"
              disabled={deletingOrder}
            >
              {deletingOrder ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete user dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le compte, le profil, les favoris et toutes les données associées. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground"
              disabled={deletingUser}
            >
              {deletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
