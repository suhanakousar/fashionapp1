import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ShoppingBag,
  Ruler,
  Receipt,
  MessageSquare,
  ArrowRight,
  Package,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { PublicLayout } from "@/components/PublicLayout";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { ORDER_STATUS_LABELS } from "@shared/schema";

export default function ClientDashboard() {
  const { data: client } = useQuery({
    queryKey: ["/api/client/me"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/client/orders"],
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/client/messages/unread"],
    select: (data: any) => data?.count || 0,
  });

  if (ordersLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading your dashboard..." />
      </PublicLayout>
    );
  }

  const recentOrders = orders.slice(0, 3);
  const activeOrders = orders.filter(
    (o) => o.status !== "delivered"
  );

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{client?.name ? `, ${client.name}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Track your orders and stay updated
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="hover-elevate cursor-pointer">
              <Link href="/client/orders">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Orders
                  </CardTitle>
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeOrders.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In progress
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover-elevate cursor-pointer">
              <Link href="/client/orders?status=delivered">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {orders.filter((o) => o.status === "delivered").length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delivered orders
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover-elevate cursor-pointer">
              <Link href="/client/messages">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Messages
                  </CardTitle>
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{unreadCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unread messages
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/client/orders">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="No orders yet"
                    description="Your orders will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/client/orders/${order.id}`}
                      >
                        <div className="flex items-center gap-4 p-3 rounded-lg border hover-elevate cursor-pointer">
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                            {order.design?.images?.[0]?.imageUrl ? (
                              <img
                                src={order.design.images[0].imageUrl}
                                alt={order.design.title}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {order.design?.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/client/orders">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    View All Orders
                  </Button>
                </Link>
                <Link href="/client/measurements">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Ruler className="h-4 w-4" />
                    My Measurements
                  </Button>
                </Link>
                <Link href="/client/billing">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Receipt className="h-4 w-4" />
                    Billing & Invoices
                  </Button>
                </Link>
                <Link href="/client/messages">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

