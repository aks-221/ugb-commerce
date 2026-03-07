import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Home, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useVendorSignup } from "@/hooks/useVendorSignup";
import ugbLogo from "@/assets/ugb-logo.png";

const VendorSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    shopName: "",
    pavilion: "",
    room: "",
    description: "",
  });
  const navigate = useNavigate();
  const vendorSignup = useVendorSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const result = await vendorSignup.mutateAsync({
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
        shopName: formData.shopName || formData.name,
        pavilion: formData.pavilion,
        room: formData.room,
        phone: formData.phone,
        description: formData.description,
      });
      
      if (result.success) {
        toast.success("Inscription vendeur réussie ! Votre 1er mois est gratuit.");
        navigate("/vendeur");
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-accent items-center justify-center p-12">
        <div className="max-w-md text-center text-accent-foreground">
          <h2 className="text-4xl font-display font-bold mb-6">
            Vendez sur le campus
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Créez votre boutique en ligne et vendez vos produits à des 
            centaines d'étudiants sur le campus de l'UAM.
          </p>
          
          {/* Pricing */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="text-5xl font-bold mb-2">1 000 FCFA</div>
            <p className="text-lg opacity-90">par mois</p>
            <div className="mt-4 py-2 px-4 rounded-full bg-white/20 inline-block">
              🎉 1er mois GRATUIT !
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm font-medium">Produits illimités</p>
              <p className="text-xs opacity-75">Ajoutez autant de produits que vous voulez</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">Tableau de bord</p>
              <p className="text-xs opacity-75">Gérez vos commandes facilement</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm font-medium">Badge vérifié</p>
              <p className="text-xs opacity-75">Gagnez la confiance des clients</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium">Paiement direct</p>
              <p className="text-xs opacity-75">Aucune commission prélevée</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img src={ugbLogo} alt="UGB" className="h-12 w-auto" />
            <div>
              <span className="text-xl font-bold text-primary font-display">
                UGB Commerce
              </span>
              <p className="text-xs text-muted-foreground">Espace Vendeur</p>
            </div>
          </Link>
          {/* Mobile Pricing Banner - visible only on mobile */}
          <div className="lg:hidden flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <div>
                <p className="text-sm font-bold text-primary">1er mois GRATUIT !</p>
                <p className="text-xs text-muted-foreground">puis 1 000 FCFA/mois</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">✅ Sans commission</p>
              <p className="text-xs text-muted-foreground">📦 Produits illimités</p>
            </div>
          </div>
          {/* Title */}
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Devenir vendeur
          </h1>
          <p className="text-muted-foreground mb-8">
            Créez votre boutique en quelques minutes
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Votre nom"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nom de la boutique
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="Ma Boutique"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@gmail.com"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+221 77 123 45 67"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Village
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.pavilion}
                    onChange={(e) => setFormData({ ...formData, pavilion: e.target.value })}
                    placeholder="Village Q"
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Chambre
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="204"
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 pl-10 pr-12 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="text-primary font-medium hover:underline">
              En vous inscrivant, vous acceptez nos conditions d'utilisation. 
              L'abonnement est de 1 000 FCFA/mois après le 1er mois gratuit.
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Création en cours..." : "Créer ma boutique"}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Déjà vendeur ?{" "}
            <Link to="/connexion" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;