import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search,
  Users,
  Phone,
  Mail,
  DollarSign,
  ChevronRight,
  Download,
  Trash2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminLayout } from "@/components/AdminLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ClientWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<ClientWithDetails[]>({
    queryKey: ["/api/admin/clients"],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/admin/clients/all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      toast({ title: "All clients deleted successfully" });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to delete clients", variant: "destructive" });
    },
  });

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportClientsCSV = () => {
    window.open("/api/admin/export/clients", "_blank");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading clients..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="text-muted-foreground">
              {clients.length} total clients
            </p>
          </div>
          <div className="flex gap-2">
            {clients.length > 0 && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="button-delete-all"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={exportClientsCSV}
              data-testid="button-export"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients found"
            description={
              searchQuery
                ? "Try adjusting your search"
                : "Clients will appear here when they book a design"
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                data-testid={`card-client-${client.id}`}
              >
                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {client.name}
                          </h3>
                          {client.outstandingBalance > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-transparent text-xs"
                            >
                              ₹{client.outstandingBalance.toLocaleString()} due
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone}
                          </span>
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Orders</p>
                          <p className="font-semibold">{client.orders?.length || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Total Spent</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            ₹{client.totalSpent?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Outstanding</p>
                          <p
                            className={`font-semibold ${
                              client.outstandingBalance > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            ₹{client.outstandingBalance?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {client.whatsapp && (
                          <a
                            href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-whatsapp-${client.id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-100"
                            >
                              <SiWhatsapp className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="sm:hidden grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Orders</p>
                        <p className="font-semibold">{client.orders?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          ₹{client.totalSpent?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due</p>
                        <p
                          className={`font-semibold ${
                            client.outstandingBalance > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          ₹{client.outstandingBalance?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Clients</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all {clients.length} clients? This will also delete all their orders, measurements, and billing entries. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteAllMutation.mutate()}
                disabled={deleteAllMutation.isPending}
              >
                {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
