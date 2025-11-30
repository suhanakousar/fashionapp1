import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import {
  Search,
  ShoppingBag,
  Filter,
  Download,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/AdminLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderWithDetails } from "@shared/schema";
import { ORDER_STATUS_LABELS } from "@shared/schema";
import { format } from "date-fns";

export default function Orders() {
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "all");

  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders"],
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.design?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportOrdersCSV = () => {
    window.open("/api/admin/export/orders", "_blank");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading orders..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Orders</h1>
            <p className="text-muted-foreground">
              {orders.length} total orders
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportOrdersCSV}
            data-testid="button-export"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, design, or order ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Orders will appear here when clients book designs"
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const primaryImage = order.design?.images?.sort(
                (a, b) => a.sortOrder - b.sortOrder
              )[0];

              const orderTotal = order.billingEntries?.reduce(
                (sum, entry) => sum + parseFloat(entry.amount),
                0
              ) || 0;

              const paidAmount = order.billingEntries
                ?.filter((e) => e.paid)
                .reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0;

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  data-testid={`card-order-${order.id}`}
                >
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                          {primaryImage?.imageUrl ? (
                            <img
                              src={primaryImage.imageUrl}
                              alt={order.design?.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">
                              {order.client?.name}
                            </h3>
                            <StatusBadge status={order.status} size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.design?.title}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-6 text-sm">
                          {order.preferredDate && (
                            <div className="text-center">
                              <p className="text-muted-foreground">Due</p>
                              <p className="font-medium">
                                {format(new Date(order.preferredDate), "MMM d")}
                              </p>
                            </div>
                          )}
                          <div className="text-center">
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold">
                              ₹{orderTotal.toLocaleString()}
                            </p>
                          </div>
                          {orderTotal > 0 && (
                            <div className="text-center">
                              <p className="text-muted-foreground">Balance</p>
                              <p
                                className={`font-semibold ${
                                  orderTotal - paidAmount > 0
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                ₹{(orderTotal - paidAmount).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>

                      <div className="sm:hidden grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center text-sm">
                        <div>
                          <p className="text-muted-foreground">Due</p>
                          <p className="font-medium">
                            {order.preferredDate
                              ? format(new Date(order.preferredDate), "MMM d")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">
                            ₹{orderTotal.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p
                            className={`font-semibold ${
                              orderTotal - paidAmount > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            ₹{(orderTotal - paidAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
