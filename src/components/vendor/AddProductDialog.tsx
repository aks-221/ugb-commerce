import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Loader2, ImagePlus, X } from "lucide-react";
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

const IMAGE_LABELS = ["Vue 1 *", "Vue 2", "Vue 3", "Vue 4", "Vue 5"];

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
    image_url_2?: string | null;
    image_url_3?: string | null;
    image_url_4?: string | null;
    image_url_5?: string | null;
  } | null;
}

export const AddProductDialog = ({ open, onOpenChange, vendorId, editProduct }: AddProductDialogProps) => {
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, stock: 0, category_id: undefined },
  });

  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name || "",
        description: editProduct.description || "",
        price: editProduct.price || 0,
        stock: editProduct.stock || 0,
        category_id: editProduct.category_id || undefined,
      });
      setImagePreviews([
        editProduct.image_url || null,
        editProduct.image_url_2 || null,
        editProduct.image_url_3 || null,
        editProduct.image_url_4 || null,
        editProduct.image_url_5 || null,
      ]);
      setImageFiles([null, null, null, null, null]);
    } else {
      form.reset({ name: "", description: "", price: 0, stock: 0, category_id: undefined });
      setImagePreviews([null, null, null, null, null]);
      setImageFiles([null, null, null, null, null]);
    }
  }, [editProduct, open]);

  const handleImageChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...imageFiles];
      const newPreviews = [...imagePreviews];
      newFiles[index] = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[index] = reader.result as string;
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
      setImageFiles([...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles[index] = null;
    newPreviews[index] = null;
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Erreur upload image"); return null; }
    return supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!editProduct && !imageFiles[0] && !imagePreviews[0]) {
      toast.error("Veuillez ajouter au moins une image");
      return;
    }
    setUploading(true);
    try {
      // Calcule les URLs pour chaque image
      const urls: (string | null)[] = [];
      const existingUrls = [
        editProduct?.image_url || null,
        editProduct?.image_url_2 || null,
        editProduct?.image_url_3 || null,
        editProduct?.image_url_4 || null,
        editProduct?.image_url_5 || null,
      ];

      for (let i = 0; i < 5; i++) {
        if (imageFiles[i]) {
          urls.push(await uploadImage(imageFiles[i]!));
        } else if (imagePreviews[i]) {
          urls.push(existingUrls[i]); // garde l'ancienne URL
        } else {
          urls.push(null); // image supprimée
        }
      }

      const payload = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category_id: data.category_id || null,
        image_url: urls[0],
        image_url_2: urls[1],
        image_url_3: urls[2],
        image_url_4: urls[3],
        image_url_5: urls[4],
      };

      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, ...payload });
      } else {
        await createProduct.mutateAsync({ vendor_id: vendorId, ...payload });
      }

      form.reset();
      setImageFiles([null, null, null, null, null]);
      setImagePreviews([null, null, null, null, null]);
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Images */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Images du produit (1-5)</label>
              <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                💡 Vous pouvez ajouter jusqu'à <strong>5 photos</strong> — profitez-en pour montrer le produit sous différents angles (face avant, arrière, détails...)
              </p>
              {/* Mobile : scroll horizontal / Desktop : grille */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-24 sm:w-auto border-2 border-dashed border-border rounded-xl p-2 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                    onClick={() => document.getElementById(`image-input-${index}`)?.click()}
                  >
                    {imagePreviews[index] ? (
                      <>
                        <img
                          src={imagePreviews[index]!}
                          alt={IMAGE_LABELS[index]}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {IMAGE_LABELS[index].replace(" *", "")}
                        </p>
                      </>
                    ) : (
                      <div className="py-3">
                        <ImagePlus className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-[9px] text-muted-foreground">{IMAGE_LABELS[index]}</p>
                      </div>
                    )}
                    <input
                      id={`image-input-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange(index)}
                    />
                  </div>
                ))}
              </div>
              
              {/* Indicateur scroll sur mobile */}
              <p className="text-[10px] text-muted-foreground sm:hidden text-center">
                ← Glissez pour voir plus →
              </p>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du produit</FormLabel>
                <FormControl><Input placeholder="Ex: Ventilateur" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Décrivez votre produit..." className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix (FCFA)</FormLabel>
                  <FormControl><Input type="number" placeholder="1000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stock" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="category_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
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