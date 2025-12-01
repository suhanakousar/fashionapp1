import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Calendar,
  User,
  Phone,
  FileText,
  Ruler,
  ArrowLeft,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PublicLayout } from "@/components/PublicLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function BookingConfirmation() {
  const [, params] = useRoute("/booking/confirm/:orderId");
  const orderId = params?.orderId;

  const { data: order, isLoading, error } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading order details..." />
      </PublicLayout>
    );
  }

  if (error || !order) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <EmptyState
            title="Order not found"
            description="The order you're looking for doesn't exist."
            action={{
              label: "Back to Gallery",
              onClick: () => window.history.back(),
            }}
          />
        </div>
      </PublicLayout>
    );
  }

  const primaryImage = order.design?.images?.sort(
    (a, b) => a.sortOrder - b.sortOrder
  )[0];

  const whatsappMessage = encodeURIComponent(
    `Hi! I've just booked the "${order.design?.title}" design.\n\n` +
      `Order ID: ${order.id}\n` +
      `Name: ${order.client?.name}\n` +
      (order.preferredDate
        ? `Preferred Date: ${format(new Date(order.preferredDate), "PPP")}\n`
        : "") +
      (order.measurement
        ? `\nMeasurements:\n` +
          `- Chest: ${order.measurement.chest || "N/A"}\n` +
          `- Waist: ${order.measurement.waist || "N/A"}\n` +
          `- Hips: ${order.measurement.hips || "N/A"}\n`
        : "") +
      `\nPlease confirm my booking. Thank you!`
  );

  const designerPhone = "919182720386";

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Thank you for your booking. We'll review your request and get back
            to you soon.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Summary</CardTitle>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {primaryImage && (
                <div className="h-24 w-24 rounded-md overflow-hidden shrink-0">
                  <img
                    src={primaryImage.imageUrl}
                    alt={order.design?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-serif text-lg font-semibold">
                  {order.design?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {order.design?.category}
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  ₹{order.design?.price ? parseFloat(order.design.price).toLocaleString() : "0"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium" data-testid="text-client-name">
                    {order.client?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.client?.phone}</p>
                </div>
              </div>
              {order.preferredDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Preferred Date
                    </p>
                    <p className="font-medium">
                      {format(new Date(order.preferredDate), "PPP")}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium font-mono text-sm">{order.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            {order.measurement && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">Measurements</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
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
                </div>
              </>
            )}

            {order.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">WhatsApp Confirmation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                A WhatsApp message has been automatically sent to your number with booking details. 
                If you didn't receive it, you can send it again using the button below.
              </p>
              <a
                href={`https://wa.me/${designerPhone}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-whatsapp"
              >
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <SiWhatsapp className="h-5 w-5" />
                  Open WhatsApp Again
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/" data-testid="link-back-gallery">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
