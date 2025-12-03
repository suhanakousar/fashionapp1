import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PublicLayout } from "@/components/PublicLayout";
import type { ClientWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function ClientProfile() {
  const { data: clientData, isLoading } = useQuery<{ client: ClientWithDetails }>({
    queryKey: ["/api/client/me"],
  });
  const client = clientData?.client;

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading profile..." />
      </PublicLayout>
    );
  }

  if (!client) {
    return (
      <PublicLayout>
        <EmptyState
          title="Profile not found"
          description="Unable to load your profile information."
        />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <Link href="/client/dashboard">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              View and manage your account information
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </label>
                    <p className="text-lg font-medium">{client.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </label>
                    <p className="text-lg">{client.phone}</p>
                  </div>

                  {client.email && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </label>
                      <p className="text-lg">{client.email}</p>
                    </div>
                  )}

                  {client.whatsapp && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        WhatsApp
                      </label>
                      <p className="text-lg">{client.whatsapp}</p>
                    </div>
                  )}

                  {client.address && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </label>
                      <p className="text-lg">{client.address}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </label>
                    <p className="text-lg">
                      {format(new Date(client.createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">{client.orders?.length || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Orders</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{client.totalSpent?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Total Paid</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      ₹{client.outstandingBalance?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Outstanding</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Link href="/client/orders">
                    <Button variant="outline" className="w-full justify-start">
                      View All Orders
                    </Button>
                  </Link>
                  <Link href="/client/billing">
                    <Button variant="outline" className="w-full justify-start">
                      Billing & Payments
                    </Button>
                  </Link>
                  <Link href="/client/messages">
                    <Button variant="outline" className="w-full justify-start">
                      Messages
                    </Button>
                  </Link>
                  <Link href="/client/measurements">
                    <Button variant="outline" className="w-full justify-start">
                      My Measurements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

