import { Link } from "react-router-dom";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    icon: string | null;
    description?: string | null;
  };
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link
      to={`/produits?categorie=${category.id}`}
      className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-card card-hover"
    >
      <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
        {category.icon || "📦"}
      </div>
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors text-center">
        {category.name}
      </span>
    </Link>
  );
};

export default CategoryCard;
