import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, Menu, Search, X, Store, LogOut, Settings, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import ugbLogo from "@/assets/ugb-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const { user, profile, isVendor, isAdmin, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Accueil" },
    { path: "/produits", label: "Produits" },
    { path: "/categories", label: "Catégories" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produits?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={ugbLogo} alt="UGB" className="h-10 w-auto" />
          <div className="hidden sm:block">
            <span className="text-lg font-bold text-primary font-display">
              UGB Commerce
            </span>
            <p className="text-[10px] text-muted-foreground -mt-1">
              Campus Marketplace
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link to="/favoris">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/panier">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {profile?.full_name || "Mon compte"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/mes-commandes" className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    Mes commandes
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/favoris" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Mes favoris
                  </Link>
                </DropdownMenuItem>
                
                {isVendor && (
                  <DropdownMenuItem asChild>
                    <Link to="/vendeur" className="cursor-pointer">
                      <Store className="mr-2 h-4 w-4" />
                      Espace Vendeur
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Administration
                    </Link>
                  </DropdownMenuItem>
                )}

                {!isVendor && !isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/inscription-vendeur" className="cursor-pointer">
                      <Store className="mr-2 h-4 w-4" />
                      Devenir vendeur
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/connexion" className="hidden sm:block">
              <Button variant="default" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Connexion
              </Button>
            </Link>
          )}
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-slide-up">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border-0 text-sm"
              />
            </div>
          </form>
          <nav className="flex flex-col px-4 pb-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link
                  to="/mes-commandes"
                  onClick={() => setIsMenuOpen(false)}
                  className="py-2 px-4 rounded-lg text-sm font-medium hover:bg-secondary flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Mes commandes
                </Link>
                {isVendor && (
                  <Link
                    to="/vendeur"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-2 px-4 rounded-lg text-sm font-medium hover:bg-secondary flex items-center gap-2"
                  >
                    <Store className="h-4 w-4" />
                    Espace Vendeur
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-2 px-4 rounded-lg text-sm font-medium hover:bg-secondary flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Administration
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="py-2 px-4 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2 mt-2"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/connexion"
                onClick={() => setIsMenuOpen(false)}
                className="py-2 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground text-center mt-2"
              >
                Connexion
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
