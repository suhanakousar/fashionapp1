import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Save,
  Building2,
  Download,
  Upload,
  Plus,
  X,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { AdminLayout } from "@/components/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { Category } from "@shared/schema";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const businessForm = useForm({
    defaultValues: {
      businessName: user?.businessName || "Rajiya Fashion",
      businessPhone: user?.businessPhone || "9182720386",
      businessAddress: user?.businessAddress || "D.No. 7/394, Rayachur Street, Main Bazar, Tadipatri-515411",
    },
  });

  const saveBusinessMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/admin/settings/business", data);
    },
    onSuccess: () => {
      toast({ title: "Business info updated" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/admin/categories", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category added" });
      setNewCategory("");
    },
    onError: () => {
      toast({ title: "Failed to add category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const exportAllData = () => {
    window.open("/api/admin/export/all", "_blank");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your business settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              This information appears on invoices and client communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...businessForm}>
              <form
                onSubmit={businessForm.handleSubmit((data) =>
                  saveBusinessMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={businessForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={businessForm.control}
                  name="businessPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="9182720386" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for WhatsApp integration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={businessForm.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your business address..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={saveBusinessMutation.isPending}
                  className="gap-2"
                >
                  {saveBusinessMutation.isPending ? "Saving..." : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage design categories for your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="py-1.5 px-3 gap-2"
                >
                  {category.name}
                  <button
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                    className="hover:text-destructive"
                    data-testid={`button-delete-category-${category.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                data-testid="input-new-category"
              />
              <Button
                onClick={() => newCategory && addCategoryMutation.mutate(newCategory)}
                disabled={!newCategory || addCategoryMutation.isPending}
                className="gap-2 shrink-0"
                data-testid="button-add-category"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data & Backup
            </CardTitle>
            <CardDescription>
              Export your data for backup or analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="gap-2 justify-start h-auto py-4"
                onClick={() => window.open("/api/admin/export/clients", "_blank")}
                data-testid="button-export-clients"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Export Clients</p>
                  <p className="text-xs text-muted-foreground">
                    Download as CSV
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="gap-2 justify-start h-auto py-4"
                onClick={() => window.open("/api/admin/export/orders", "_blank")}
                data-testid="button-export-orders"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Export Orders</p>
                  <p className="text-xs text-muted-foreground">
                    Download as CSV
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="gap-2 justify-start h-auto py-4 sm:col-span-2"
                onClick={exportAllData}
                data-testid="button-export-all"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Export All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Complete backup of all data (CSV zip)
                  </p>
                </div>
              </Button>
            </div>

            <Separator />

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h4 className="font-medium mb-2">Database Backup Instructions</h4>
              <p className="text-muted-foreground mb-3">
                For a complete database backup, you can use the following methods:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Use the "Export All Data" button above for a CSV backup</li>
                <li>For PostgreSQL dumps, use pg_dump from the command line</li>
                <li>Schedule regular backups using your hosting provider's tools</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Your designer account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{user?.name || "Designer"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
