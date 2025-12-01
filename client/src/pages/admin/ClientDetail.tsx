import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Download,
  Plus,
  Edit,
  Ruler,
  ShoppingBag,
  Receipt,
  ChevronRight,
  Save,
  X,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import type { ClientWithDetails, Measurement } from "@shared/schema";
import { format } from "date-fns";

export default function ClientDetail() {
  const [, params] = useRoute("/admin/clients/:id");
  const [, navigate] = useLocation();
  const clientId = params?.id;
  const { toast } = useToast();

  const [measurementDialog, setMeasurementDialog] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [whatsappDialog, setWhatsappDialog] = useState(false);

  const { data: client, isLoading } = useQuery<ClientWithDetails>({
    queryKey: ["/api/admin/clients", clientId],
    enabled: !!clientId,
  });

  const measurementForm = useForm({
    defaultValues: {
      label: "",
      chest: "",
      waist: "",
      hips: "",
      shoulder: "",
      sleeve: "",
      length: "",
      inseam: "",
      neck: "",
      notes: "",
    },
  });

  const saveMeasurementMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingMeasurement) {
        return apiRequest("PATCH", `/api/admin/measurements/${editingMeasurement.id}`, data);
      }
      return apiRequest("POST", `/api/admin/clients/${clientId}/measurements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Measurement saved" });
      setMeasurementDialog(false);
      setEditingMeasurement(null);
      measurementForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to save measurement", variant: "destructive" });
    },
  });

  const openMeasurementDialog = (measurement?: Measurement) => {
    if (measurement) {
      setEditingMeasurement(measurement);
      measurementForm.reset({
        label: measurement.label,
        chest: measurement.chest || "",
        waist: measurement.waist || "",
        hips: measurement.hips || "",
        shoulder: measurement.shoulder || "",
        sleeve: measurement.sleeve || "",
        length: measurement.length || "",
        inseam: measurement.inseam || "",
        neck: measurement.neck || "",
        notes: measurement.notes || "",
      });
    } else {
      setEditingMeasurement(null);
      measurementForm.reset({
        label: `Measurement ${(client?.measurements?.length || 0) + 1}`,
        chest: "",
        waist: "",
        hips: "",
        shoulder: "",
        sleeve: "",
        length: "",
        inseam: "",
        neck: "",
        notes: "",
      });
    }
    setMeasurementDialog(true);
  };

  const exportClientCSV = () => {
    window.open(`/api/admin/export/clients/${clientId}`, "_blank");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader text="Loading client..." />
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout>
        <EmptyState
          title="Client not found"
          description="This client doesn't exist or has been removed."
          action={{
            label: "Back to Clients",
            onClick: () => navigate("/admin/clients"),
          }}
        />
      </AdminLayout>
    );
  }

  const whatsappNumber = client.whatsapp || client.phone;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/clients")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Client Profile</h1>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportClientCSV}
            data-testid="button-export"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold" data-testid="text-client-name">
                  {client.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Client since {format(new Date(client.createdAt), "MMMM yyyy")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{client.totalSpent?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${
                      client.outstandingBalance > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    ₹{client.outstandingBalance?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                </div>
              </div>

              <Separator className="my-6" />

              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => setWhatsappDialog(true)}
                data-testid="button-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4" />
                Send WhatsApp Message
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Tabs defaultValue="orders">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="orders" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Orders</span>
                </TabsTrigger>
                <TabsTrigger value="measurements" className="gap-2">
                  <Ruler className="h-4 w-4" />
                  <span className="hidden sm:inline">Measurements</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!client.orders || client.orders.length === 0 ? (
                      <EmptyState
                        icon={ShoppingBag}
                        title="No orders yet"
                        description="This client hasn't placed any orders"
                      />
                    ) : (
                      <div className="space-y-3">
                        {client.orders.map((order) => (
                          <Link
                            key={order.id}
                            href={`/admin/orders/${order.id}`}
                            data-testid={`order-${order.id}`}
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
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="measurements" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Measurement History</CardTitle>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => openMeasurementDialog()}
                      data-testid="button-add-measurement"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!client.measurements || client.measurements.length === 0 ? (
                      <EmptyState
                        icon={Ruler}
                        title="No measurements"
                        description="Add measurements to keep track of sizing"
                        action={{
                          label: "Add Measurement",
                          onClick: () => openMeasurementDialog(),
                        }}
                      />
                    ) : (
                      <div className="space-y-4">
                        {client.measurements.map((measurement) => (
                          <div
                            key={measurement.id}
                            className="p-4 rounded-lg border"
                            data-testid={`measurement-${measurement.id}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{measurement.label}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(measurement.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openMeasurementDialog(measurement)}
                                data-testid={`button-edit-measurement-${measurement.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-sm">
                              {measurement.chest && (
                                <div>
                                  <p className="text-muted-foreground">Chest</p>
                                  <p className="font-medium">{measurement.chest}"</p>
                                </div>
                              )}
                              {measurement.waist && (
                                <div>
                                  <p className="text-muted-foreground">Waist</p>
                                  <p className="font-medium">{measurement.waist}"</p>
                                </div>
                              )}
                              {measurement.hips && (
                                <div>
                                  <p className="text-muted-foreground">Hips</p>
                                  <p className="font-medium">{measurement.hips}"</p>
                                </div>
                              )}
                              {measurement.shoulder && (
                                <div>
                                  <p className="text-muted-foreground">Shoulder</p>
                                  <p className="font-medium">{measurement.shoulder}"</p>
                                </div>
                              )}
                              {measurement.sleeve && (
                                <div>
                                  <p className="text-muted-foreground">Sleeve</p>
                                  <p className="font-medium">{measurement.sleeve}"</p>
                                </div>
                              )}
                              {measurement.length && (
                                <div>
                                  <p className="text-muted-foreground">Length</p>
                                  <p className="font-medium">{measurement.length}"</p>
                                </div>
                              )}
                            </div>
                            {measurement.notes && (
                              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                                {measurement.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Billing Ledger</CardTitle>
                    {client.billingEntries && client.billingEntries.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          window.open(`/api/admin/clients/${clientId}/billing/invoice`, "_blank");
                        }}
                        data-testid="button-download-all-invoices"
                      >
                        <Download className="h-4 w-4" />
                        Download All
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!client.billingEntries || client.billingEntries.length === 0 ? (
                      <EmptyState
                        icon={Receipt}
                        title="No billing entries"
                        description="Billing entries will appear here when added to orders"
                      />
                    ) : (
                      <div className="space-y-2">
                        {client.billingEntries.map((entry) => (
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
                            <div className="flex items-center gap-3">
                              <p className="font-semibold">
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  window.open(`/api/admin/billing/${entry.id}/invoice`, "_blank");
                                }}
                                className="h-8 w-8"
                                title="Download Invoice PDF"
                                data-testid={`button-download-invoice-${entry.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <p className="font-semibold">Outstanding Balance</p>
                          <p className="text-xl font-bold text-primary">
                            ₹{client.outstandingBalance?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={measurementDialog} onOpenChange={setMeasurementDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMeasurement ? "Edit Measurement" : "Add Measurement"}
            </DialogTitle>
          </DialogHeader>
          <Form {...measurementForm}>
            <form
              onSubmit={measurementForm.handleSubmit((data) =>
                saveMeasurementMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={measurementForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Wedding Dress" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={measurementForm.control}
                  name="chest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chest</FormLabel>
                      <FormControl>
                        <Input placeholder="38" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={measurementForm.control}
                  name="waist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waist</FormLabel>
                      <FormControl>
                        <Input placeholder="32" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={measurementForm.control}
                  name="hips"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hips</FormLabel>
                      <FormControl>
                        <Input placeholder="40" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={measurementForm.control}
                  name="shoulder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shoulder</FormLabel>
                      <FormControl>
                        <Input placeholder="18" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={measurementForm.control}
                  name="sleeve"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sleeve</FormLabel>
                      <FormControl>
                        <Input placeholder="25" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={measurementForm.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input placeholder="30" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={measurementForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMeasurementDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveMeasurementMutation.isPending}
                  className="gap-2"
                >
                  {saveMeasurementMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <WhatsAppSendDialog
        open={whatsappDialog}
        onOpenChange={setWhatsappDialog}
        clientId={client.id}
        clientName={client.name}
        clientPhone={whatsappNumber || client.phone}
      />
    </AdminLayout>
  );
}
