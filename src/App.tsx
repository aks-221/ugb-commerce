import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { VendorGuard } from "@/components/guards/VendorGuard";
import { AdminGuard } from "@/components/guards/AdminGuard";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import VendorSignup from "./pages/VendorSignup";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Favorites from "./pages/Favorites";
import Categories from "./pages/Categories";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 1, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produits" element={<Products />} />
              <Route path="/produit/:id" element={<ProductDetail />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/favoris" element={<Favorites />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/mes-commandes" element={<MyOrders />} />
              <Route path="/connexion" element={<Login />} />
              <Route path="/inscription-vendeur" element={<VendorSignup />} />
              <Route 
                path="/vendeur" 
                element={
                  <VendorGuard>
                    <VendorDashboard />
                  </VendorGuard>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
