import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "Le prix doit être supérieur à 0"),
  stock: z.coerce.number().min(0, "Le stock ne peut pas être négatif"),
  category_id: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  editProduct?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    category_id?: string | null;
    image_url?: string | null;
  } | null;
}

export const AddProductDialog = ({
  open,
  onOpenChange,
  vendorId,
  editProduct,
}: AddProductDialogProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editProduct?.image_url || null
  );
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category_id: undefined,
    },
  });

  // Update form when editProduct changes
  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name || "",
        description: editProduct.description || "",
        price: editProduct.price || 0,
        stock: editProduct.stock || 0,
        category_id: editProduct.category_id || undefined,
      });
      setImagePreview(editProduct.image_url || null);
      setImageFile(null);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category_id: undefined,
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [editProduct, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${vendorId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Erreur lors de l'upload de l'image");
      return null;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const onSubmit = async (data: ProductFormData) => {
    // Require image for new products
    if (!editProduct && !imageFile) {
      toast.error("Veuillez ajouter une image pour le produit");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editProduct?.image_url || null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (editProduct) {
        await updateProduct.mutateAsync({
          id: editProduct.id,
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
          category_id: data.category_id || null,
          image_url: imageUrl,
        });
      } else {
        await createProduct.mutateAsync({
          vendor_id: vendorId,
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
          category_id: data.category_id,
          image_url: imageUrl || undefined,
        });
      }

      form.reset();
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setUploading(false);
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editProduct ? "Modifier le produit" : "Ajouter un produit"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image du produit</label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("image-input")?.click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-contain rounded-lg bg-secondary/20"
                  />
                ) : (
                  <div className="py-4">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour ajouter une image
                    </p>
                  </div>
                )}
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ventilateur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre produit..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editProduct ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
