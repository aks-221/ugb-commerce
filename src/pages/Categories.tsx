import Layout from "@/components/layout/Layout";
import CategoryCard from "@/components/CategoryCard";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Catégories
          </h1>
          <p className="text-muted-foreground mt-2">
            Parcourez les produits par catégorie
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Categories;
