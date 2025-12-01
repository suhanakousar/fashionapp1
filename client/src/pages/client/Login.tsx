import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PublicLayout } from "@/components/PublicLayout";

const loginSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number"),
  otp: z.string().optional(),
  password: z.string().optional(),
}).refine((data) => data.otp || data.password, {
  message: "Either OTP or password is required",
  path: ["otp"],
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      otp: "",
      password: "",
    },
  });

  const requestOTP = async () => {
    const phone = form.getValues("phone");
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingOTP(true);
    try {
      const response = await apiRequest("POST", "/api/client/request-otp", { phone });
      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        
        if (data.whatsappSent) {
          // OTP was sent automatically via API
          toast({
            title: "OTP Sent",
            description: "OTP has been sent to your WhatsApp automatically. Please check and enter it below.",
          });
        } else if (data.whatsappUrl) {
          // Fallback: Open WhatsApp if API not configured
          window.open(data.whatsappUrl, "_blank");
          toast({
            title: "OTP Ready",
            description: "Please check WhatsApp for your OTP and enter it below.",
          });
        } else {
          toast({
            title: "OTP Generated",
            description: "Please check your WhatsApp for the OTP",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRequestingOTP(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiRequest("POST", "/api/client/login", data);
      const result = await response.json();
      
      if (result.client) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/client/dashboard");
        // Reload to update auth state
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Sign in to track your orders and communicate with us
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your phone number"
                            className="pl-10"
                            {...field}
                            disabled={otpSent}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!otpSent ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={requestOTP}
                      disabled={isRequestingOTP}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isRequestingOTP ? "Sending..." : "Request OTP via WhatsApp"}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or
                        </span>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password (if set)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP (from WhatsApp)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            {...field}
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setOtpSent(false);
                              form.setValue("otp", "");
                            }}
                          >
                            Change phone number
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={requestOTP}
                            disabled={isRequestingOTP}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Resend OTP
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <Link href="/" className="text-primary hover:underline">
                  Book a design to get started
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

