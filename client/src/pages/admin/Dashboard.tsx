import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Palette,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import type { OrderWithDetails, Client } from "@shared/schema";
import { format } from "date-fns";

interface DashboardStats {
  newOrders: number;
  totalClients: number;
  pendingPayments: number;
  totalDesigns: number;
  recentOrders: OrderWithDetails[];
  upcomingDeliveries: OrderWithDetails[];
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading dashboard..." />
      </AdminLayout>
    );
  }

  const defaultStats: DashboardStats = {
    newOrders: 0,
    totalClients: 0,
    pendingPayments: 0,
    totalDesigns: 0,
    recentOrders: [],
    upcomingDeliveries: [],
  };

  const dashboardData = stats || defaultStats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <Link href="/admin/designs/new">
            <Button className="gap-2" data-testid="button-new-design">
              <Palette className="h-4 w-4" />
              New Design
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate cursor-pointer" data-testid="card-new-orders">
            <Link href="/admin/orders?status=requested">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Orders
                </CardTitle>
                <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardData.newOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting review
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover-elevate cursor-pointer" data-testid="card-clients">
            <Link href="/admin/clients">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Clients
                </CardTitle>
                <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardData.totalClients}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active customers
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover-elevate cursor-pointer" data-testid="card-payments">
            <Link href="/admin/orders?filter=outstanding">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payments
                </CardTitle>
                <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{dashboardData.pendingPayments.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Outstanding balance
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover-elevate cursor-pointer" data-testid="card-designs">
            <Link href="/admin/designs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Designs
                </CardTitle>
                <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardData.totalDesigns}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In your collection
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Fusion Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Real-time metrics for AI-powered fusion system
            </p>
          </div>
          <AnalyticsDashboard />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData.recentOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No orders yet"
                  description="Orders will appear here once clients start booking"
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentOrders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      data-testid={`order-item-${order.id}`}
                    >
                      <div className="flex items-center gap-4 p-3 rounded-lg border hover-elevate cursor-pointer">
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                          {order.design?.images?.[0]?.imageUrl ? (
                            <img
                              src={order.design.images[0].imageUrl}
                              alt={order.design.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Palette className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {order.client?.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.design?.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={order.status} size="sm" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(order.createdAt), "MMM d")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Deliveries</CardTitle>
              <Link href="/admin/orders?status=ready_for_delivery">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingDeliveries.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming deliveries"
                  description="Orders ready for delivery will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.upcomingDeliveries.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      data-testid={`delivery-item-${order.id}`}
                    >
                      <div className="flex items-center gap-4 p-3 rounded-lg border hover-elevate cursor-pointer">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {order.client?.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.design?.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {order.preferredDate ? (
                            <p className="text-sm font-medium">
                              {format(new Date(order.preferredDate), "MMM d")}
                            </p>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No date
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
