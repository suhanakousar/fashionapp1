import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminLayout } from "@/components/AdminLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DesignWithImages } from "@shared/schema";
import { format } from "date-fns";

export default function Designs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: designs = [], isLoading } = useQuery<DesignWithImages[]>({
    queryKey: ["/api/admin/designs"],
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return apiRequest("PATCH", `/api/admin/designs/${id}`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/designs"] });
      toast({ title: "Design updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update design", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/designs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/designs"] });
      toast({ title: "Design deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete design", variant: "destructive" });
    },
  });

  const filteredDesigns = designs.filter((design) =>
    design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    design.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading designs..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Designs</h1>
            <p className="text-muted-foreground">
              Manage your design collection
            </p>
          </div>
          <Link href="/admin/designs/new">
            <Button className="gap-2" data-testid="button-new-design">
              <Plus className="h-4 w-4" />
              Add Design
            </Button>
          </Link>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search designs..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {filteredDesigns.length === 0 ? (
          <EmptyState
            title="No designs found"
            description={
              searchQuery
                ? "Try adjusting your search"
                : "Create your first design to get started"
            }
            action={
              !searchQuery
                ? {
                    label: "Add Design",
                    onClick: () => window.location.href = "/admin/designs/new",
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDesigns.map((design) => {
              const primaryImage = design.images.sort(
                (a, b) => a.sortOrder - b.sortOrder
              )[0];

              return (
                <Card
                  key={design.id}
                  className="overflow-hidden"
                  data-testid={`card-design-${design.id}`}
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={design.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={design.isPublished ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {design.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{design.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {design.category}
                          </Badge>
                          <span className="text-sm font-semibold text-primary">
                            ₹{parseFloat(design.price).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {design.images.length} images ·{" "}
                          {format(new Date(design.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-menu-${design.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/design/${design.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Public
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/designs/${design.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: design.id,
                                isPublished: !design.isPublished,
                              })
                            }
                          >
                            {design.isPublished ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(design.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Design</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this design? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
