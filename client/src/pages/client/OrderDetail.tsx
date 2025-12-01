import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ruler,
  Receipt,
  FileText,
  Image as ImageIcon,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PublicLayout } from "@/components/PublicLayout";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { ORDER_STATUS_LABELS } from "@shared/schema";

const statusSteps = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "ready_for_delivery", label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

export default function ClientOrderDetail() {
  const [, params] = useRoute("/client/orders/:id");
  const orderId = params?.id;

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/client/orders", orderId],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading order details..." />
      </PublicLayout>
    );
  }

  if (!order) {
    return (
      <PublicLayout>
        <EmptyState
          title="Order not found"
          description="This order doesn't exist or you don't have access to it."
          action={{
            label: "Back to Orders",
            onClick: () => window.history.back(),
          }}
        />
      </PublicLayout>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);
  const primaryImage = order.design?.images?.sort((a, b) => a.sortOrder - b.sortOrder)[0];

  const orderTotal = order.billingEntries?.reduce(
    (sum, entry) => sum + parseFloat(entry.amount),
    0
  ) || 0;

  const paidAmount = order.billingEntries
    ?.filter((e) => e.paid)
    .reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0;

  const outstandingBalance = orderTotal - paidAmount;

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <Link href="/client/orders">
              <Button variant="ghost" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-muted-foreground font-mono text-sm">
              #{order.id.slice(0, 8)}
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span
                          className={`text-xs mt-2 text-center ${
                            isCurrent ? "font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-8 sm:w-16 h-0.5 mx-1 -mt-5 ${
                            index < currentStatusIndex ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="h-24 w-24 rounded-md overflow-hidden bg-muted shrink-0">
                      {primaryImage?.imageUrl ? (
                        <img
                          src={primaryImage.imageUrl}
                          alt={order.design?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{order.design?.title}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {order.design?.category}
                      </Badge>
                      <p className="text-xl font-bold text-primary mt-2">
                        ₹{order.design?.price ? parseFloat(order.design.price).toLocaleString() : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {order.measurement && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="h-5 w-5" />
                      Measurements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-sm">
                      {order.measurement.chest && (
                        <div>
                          <p className="text-muted-foreground">Chest</p>
                          <p className="font-medium">{order.measurement.chest}"</p>
                        </div>
                      )}
                      {order.measurement.waist && (
                        <div>
                          <p className="text-muted-foreground">Waist</p>
                          <p className="font-medium">{order.measurement.waist}"</p>
                        </div>
                      )}
                      {order.measurement.hips && (
                        <div>
                          <p className="text-muted-foreground">Hips</p>
                          <p className="font-medium">{order.measurement.hips}"</p>
                        </div>
                      )}
                      {order.measurement.shoulder && (
                        <div>
                          <p className="text-muted-foreground">Shoulder</p>
                          <p className="font-medium">{order.measurement.shoulder}"</p>
                        </div>
                      )}
                      {order.measurement.sleeve && (
                        <div>
                          <p className="text-muted-foreground">Sleeve</p>
                          <p className="font-medium">{order.measurement.sleeve}"</p>
                        </div>
                      )}
                      {order.measurement.length && (
                        <div>
                          <p className="text-muted-foreground">Length</p>
                          <p className="font-medium">{order.measurement.length}"</p>
                        </div>
                      )}
                    </div>
                    {order.measurement.notes && (
                      <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                        {order.measurement.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {order.files && order.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Reference Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {order.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={file.fileUrl}
                            alt={file.fileName || "Reference image"}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{order.notes}</p>
                  </CardContent>
                </Card>
              )}

              {order.billingEntries && order.billingEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.billingEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{entry.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-semibold text-lg">
                              ₹{parseFloat(entry.amount).toLocaleString()}
                            </p>
                            <Badge
                              variant={entry.paid ? "secondary" : "outline"}
                              className={
                                entry.paid
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-transparent"
                              }
                            >
                              {entry.paid ? "Paid" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-medium">₹{orderTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            ₹{paidAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold">Outstanding</span>
                          <span
                            className={`text-xl font-bold ${
                              outstandingBalance > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            ₹{outstandingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono">{order.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  {order.preferredDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preferred Date</span>
                      <span>{format(new Date(order.preferredDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </CardContent>
              </Card>

              <Link href="/client/messages">
                <Button className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Message Designer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

