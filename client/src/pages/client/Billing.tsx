import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Receipt,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { PublicLayout } from "@/components/PublicLayout";
import type { BillingEntry, ClientWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function ClientBilling() {
  const { data: clientData } = useQuery<{ client: ClientWithDetails }>({
    queryKey: ["/api/client/me"],
  });
  const client = clientData?.client;

  const { data: billingEntries = [], isLoading } = useQuery<BillingEntry[]>({
    queryKey: ["/api/client/billing"],
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading billing information..." />
      </PublicLayout>
    );
  }

  const paidEntries = billingEntries.filter((e) => e.paid);
  const unpaidEntries = billingEntries.filter((e) => !e.paid);
  const totalPaid = paidEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalOutstanding = unpaidEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Link href="/client/dashboard">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Billing & Payments</h1>
            <p className="text-muted-foreground">
              View your payment history and outstanding balances
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{totalPaid.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidEntries.length} payment{paidEntries.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{totalOutstanding.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {unpaidEntries.length} pending{unpaidEntries.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Billing
                </CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{(totalPaid + totalOutstanding).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {billingEntries.length} total entry{billingEntries.length !== 1 ? "ies" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Paid Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paidEntries.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No payments yet"
                    description="Paid payments will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {paidEntries
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{entry.description}</p>
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700">
                                Paid
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-700 dark:text-green-400">
                              ₹{parseFloat(entry.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unpaidEntries.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No pending payments"
                    description="All payments are up to date!"
                  />
                ) : (
                  <div className="space-y-3">
                    {unpaidEntries
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{entry.description}</p>
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                              ₹{parseFloat(entry.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Entries Table */}
          {billingEntries.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>All Billing Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Description</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingEntries
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((entry) => (
                          <tr key={entry.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <p className="font-medium">{entry.description}</p>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {format(new Date(entry.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="p-3 text-right font-medium">
                              ₹{parseFloat(entry.amount).toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={entry.paid ? "default" : "outline"}
                                className={
                                  entry.paid
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                }
                              >
                                {entry.paid ? "Paid" : "Pending"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

