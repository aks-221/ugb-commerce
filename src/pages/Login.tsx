import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ugbLogo from "@/assets/ugb-logo.png";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const navigate = useNavigate();
  const { signIn, signUp, user, isVendor, isAdmin, loading: authLoading, dataLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && !dataLoading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else if (isVendor) {
        navigate("/vendeur");
      } else {
        navigate("/");
      }
  }
  }, [user, isVendor, isAdmin, authLoading, dataLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast.error(error.message || "Erreur de connexion");
        } else {
          toast.success("Connexion réussie !");
          // Redirection will be handled by useEffect after roles are loaded
        }
      } else {
        if (formData.password.length < 6) {
          toast.error("Le mot de passe doit contenir au moins 6 caractères");
          setLoading(false);
          return;
        }
        if (!formData.phone || formData.phone.trim().length < 8) {
          toast.error("Le numéro de téléphone est obligatoire");
          setLoading(false);
          return;
        }
        const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone);
        if (error) {
          toast.error(error.message || "Erreur lors de l'inscription");
        } else {
          toast.success("Compte créé avec succès !");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Don't show login form if already logged in
  if (!authLoading && !dataLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img src={ugbLogo} alt="UGB" className="h-12 w-auto" />
            <div>
              <span className="text-xl font-bold text-primary font-display">
                UGB Commerce
              </span>
              <p className="text-xs text-muted-foreground">Campus Marketplace</p>
            </div>
          </Link>

          {/* Title */}
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {isLogin ? "Bon retour !" : "Créer un compte client"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLogin
              ? "Connectez-vous pour accéder à votre compte"
              : "Rejoignez la communauté UAM Commerce"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
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
            )}

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

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Téléphone <span className="text-destructive">*</span>
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
            )}

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

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Pas encore de compte client ?" : "Déjà un compte ?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "S'inscrire pour commander" : "Se connecter"}
            </button>
          </p>

          {/* Vendor Link */}
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Vous voulez vendre vos produits ?
            </p>
            <Link to="/inscription-vendeur">
              <Button variant="outline" className="gap-2 bg-accent text-white hover:bg-accent/90 border-none transition-all">
                Devenir vendeur
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="text-4xl font-display font-bold mb-6">
            Achetez facilement sur le campus
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Trouvez tout ce dont vous avez besoin : fournitures, électronique, 
            nourriture et plus encore auprès d'autres étudiants.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm">Achetez local</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm">Prix étudiants</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl mb-2">🤝</div>
              <p className="text-sm">Paiement direct</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;