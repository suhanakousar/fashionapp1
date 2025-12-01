import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { PublicLayout } from "@/components/PublicLayout";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { ORDER_STATUS_LABELS } from "@shared/schema";

export default function ClientOrders() {
  const [location] = useLocation();
  const statusFilter = new URLSearchParams(location.split("?")[1] || "").get("status");

  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/client/orders"],
  });

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading orders..." />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Orders</h1>
              <p className="text-muted-foreground">
                Track all your orders in one place
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/client/orders">
                <Button variant={!statusFilter ? "default" : "outline"} size="sm">
                  All
                </Button>
              </Link>
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <Link key={key} href={`/client/orders?status=${key}`}>
                  <Button variant={statusFilter === key ? "default" : "outline"} size="sm">
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={ShoppingBag}
                  title={statusFilter ? `No ${ORDER_STATUS_LABELS[statusFilter]} orders` : "No orders yet"}
                  description={
                    statusFilter
                      ? "You don't have any orders with this status"
                      : "Your orders will appear here once you place a booking"
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <Link key={order.id} href={`/client/orders/${order.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                          {order.design?.images?.[0]?.imageUrl ? (
                            <img
                              src={order.design.images[0].imageUrl}
                              alt={order.design.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">
                            {order.design?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Order #{order.id.slice(0, 8)} • {format(new Date(order.createdAt), "MMM d, yyyy")}
                          </p>
                          {order.preferredDate && (
                            <p className="text-xs text-muted-foreground">
                              Preferred date: {format(new Date(order.preferredDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={order.status} />
                          <p className="text-lg font-bold text-primary mt-2">
                            ₹{order.design?.price ? parseFloat(order.design.price).toLocaleString() : 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

