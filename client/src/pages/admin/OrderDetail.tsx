import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Download,
  Plus,
  FileText,
  Ruler,
  Receipt,
  CheckCircle2,
  Image,
  ExternalLink,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AdminLayout } from "@/components/AdminLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppSendDialog } from "@/components/WhatsAppSendDialog";
import type { OrderWithDetails, BillingEntry } from "@shared/schema";
import { ORDER_STATUS_LABELS } from "@shared/schema";
import { format } from "date-fns";

const statusSteps = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "ready_for_delivery", label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id;
  const { toast } = useToast();

  const [billingDialog, setBillingDialog] = useState(false);
  const [whatsappDialog, setWhatsappDialog] = useState(false);

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/admin/orders", orderId],
    enabled: !!orderId,
  });

  const billingForm = useForm({
    defaultValues: {
      description: "",
      amount: "",
      paid: false,
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
      toast({ title: "Order status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const addBillingMutation = useMutation({
    mutationFn: async (data: { description: string; amount: string; paid: boolean }) => {
      return apiRequest("POST", `/api/admin/orders/${orderId}/billing`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
      toast({ title: "Billing entry added" });
      setBillingDialog(false);
      billingForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add billing entry", variant: "destructive" });
    },
  });

  const togglePaymentMutation = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      return apiRequest("PATCH", `/api/admin/billing/${id}`, { paid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
      toast({ title: "Payment status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update payment", variant: "destructive" });
    },
  });

  const generateInvoice = () => {
    window.open(`/api/admin/orders/${orderId}/invoice`, "_blank");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading order..." />
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <EmptyState
          title="Order not found"
          description="This order doesn't exist or has been removed."
          action={{
            label: "Back to Orders",
            onClick: () => navigate("/admin/orders"),
          }}
        />
      </AdminLayout>
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

  const whatsappNumber = order.client?.whatsapp || order.client?.phone;
  const whatsappMessage = encodeURIComponent(
    `Hi ${order.client?.name}! This is regarding your order for "${order.design?.title}".\n\n` +
      `Order ID: ${order.id}\n` +
      `Status: ${ORDER_STATUS_LABELS[order.status]}\n\n` +
      `Please let us know if you have any questions!`
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/orders")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Order Details</h1>
            <p className="text-muted-foreground font-mono text-sm">
              #{order.id.slice(0, 8)}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={generateInvoice}
            data-testid="button-invoice"
          >
            <Download className="h-4 w-4" />
            Invoice
          </Button>
        </div>

        <Card>
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
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
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

            <div className="flex items-center justify-between">
              <Select
                value={order.status}
                onValueChange={(value) => updateStatusMutation.mutate(value)}
              >
                <SelectTrigger className="w-48" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setWhatsappDialog(true)}
                data-testid="button-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4" />
                Send WhatsApp Message
              </Button>
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
                  <Link href={`/design/${order.design?.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
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
                    <Image className="h-5 w-5" />
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Billing
                </CardTitle>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setBillingDialog(true)}
                  data-testid="button-add-billing"
                >
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </CardHeader>
              <CardContent>
                {!order.billingEntries || order.billingEntries.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="No billing entries"
                    description="Add billing entries to track payments"
                    action={{
                      label: "Add Entry",
                      onClick: () => setBillingDialog(true),
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {order.billingEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`billing-${entry.id}`}
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
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={entry.paid}
                              onCheckedChange={(paid) =>
                                togglePaymentMutation.mutate({ id: entry.id, paid })
                              }
                              data-testid={`switch-paid-${entry.id}`}
                            />
                            <span className="text-sm">
                              {entry.paid ? "Paid" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium">
                          ₹{orderTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ₹{paidAmount.toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
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
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/admin/clients/${order.client?.id}`}>
                  <div className="flex items-center gap-3 hover-elevate p-2 -m-2 rounded-lg cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {order.client?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{order.client?.name}</p>
                      <p className="text-sm text-muted-foreground">View profile</p>
                    </div>
                  </div>
                </Link>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.client?.phone}</span>
                  </div>
                  {order.client?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{order.client?.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>

      <Dialog open={billingDialog} onOpenChange={setBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Billing Entry</DialogTitle>
          </DialogHeader>
          <Form {...billingForm}>
            <form
              onSubmit={billingForm.handleSubmit((data) =>
                addBillingMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={billingForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fabric cost" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={billingForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={billingForm.control}
                name="paid"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-base">Mark as paid</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBillingDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addBillingMutation.isPending}
                >
                  {addBillingMutation.isPending ? "Adding..." : "Add Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <WhatsAppSendDialog
        open={whatsappDialog}
        onOpenChange={setWhatsappDialog}
        clientId={order.client?.id || ""}
        clientName={order.client?.name || "Client"}
        clientPhone={whatsappNumber || order.client?.phone || ""}
        orderId={order.id}
        defaultMessage={whatsappMessage ? decodeURIComponent(whatsappMessage) : undefined}
      />
    </AdminLayout>
  );
}
