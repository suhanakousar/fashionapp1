import { useState, useCallback, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Upload,
  X,
  GripVertical,
  Loader2,
  Save,
  Eye,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/AdminLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DesignWithImages, Category } from "@shared/schema";
import { insertDesignSchema } from "@shared/schema";
import { cn } from "@/lib/utils";
import { z } from "zod";

const formSchema = insertDesignSchema.omit({ designerId: true }).extend({
  title: z.string().min(1, "Title is required"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface UploadedImage {
  id?: string;
  file?: File;
  preview: string;
  sortOrder: number;
}

export default function DesignEditor() {
  const [, params] = useRoute("/admin/designs/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const designId = params?.id;
  const isNew = designId === "new";

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: design, isLoading: designLoading } = useQuery<DesignWithImages>({
    queryKey: ["/api/admin/designs", designId],
    enabled: !isNew && !!designId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (design) {
      form.reset({
        title: design.title,
        description: design.description || "",
        price: design.price,
        category: design.category,
        isPublished: design.isPublished,
      });
      setImages(
        design.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => ({
            id: img.id,
            preview: img.imageUrl,
            sortOrder: img.sortOrder,
          }))
      );
    }
  }, [design, form]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      sortOrder: images.length + index,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setImages(newImages.map((img, i) => ({ ...img, sortOrder: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle boolean values properly
          if (typeof value === "boolean") {
            formData.append(key, value ? "true" : "false");
          } else {
            formData.append(key, String(value));
          }
        }
      });

      formData.append("imageOrder", JSON.stringify(
        images.map((img, i) => ({ id: img.id, sortOrder: i }))
      ));

      images.forEach((img) => {
        if (img.file) {
          formData.append("newImages", img.file);
        }
      });

      const url = isNew ? "/api/admin/designs" : `/api/admin/designs/${designId}`;
      const response = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to save design" }));
        throw new Error(error.message || "Failed to save design");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/designs"] });
      toast({ title: isNew ? "Design created" : "Design updated" });
      navigate(`/admin/designs/${data.design?.id || designId}`);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log("Form submitted with data:", data);
    console.log("Images:", images);
    
    if (images.length === 0) {
      toast({
        title: "Please add at least one image",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      saveMutation.mutate(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  if (!isNew && designLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading design..." />
      </AdminLayout>
    );
  }

  const allCategories = [
    ...new Set([
      ...categories.map((c) => c.name),
      "Dresses",
      "Suits",
      "Evening Wear",
      "Casual",
      "Traditional",
      "Accessories",
    ]),
  ];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/designs")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isNew ? "New Design" : "Edit Design"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Create a new design" : "Update design details"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(
              onSubmit,
              (errors) => {
                console.log("Form validation errors:", errors);
                const firstError = Object.values(errors)[0];
                if (firstError?.message) {
                  toast({
                    title: "Validation error",
                    description: firstError.message,
                    variant: "destructive",
                  });
                }
              }
            )} 
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                  data-testid="dropzone"
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drag & drop images here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, or WebP. Max 5MB each.
                  </p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden group cursor-move border-2",
                          draggedIndex === index
                            ? "border-primary opacity-50"
                            : "border-transparent"
                        )}
                        data-testid={`image-${index}`}
                      >
                        <img
                          src={image.preview}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <div className="text-white">
                            <GripVertical className="h-5 w-5" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Design title"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                              data-testid="input-price"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your design..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Published</FormLabel>
                        <FormDescription>
                          Make this design visible to the public
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-published"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/designs")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || saveMutation.isPending}
                className="gap-2"
                data-testid="button-save"
              >
                {isSubmitting || saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isNew ? "Create Design" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
