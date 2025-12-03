import { useState, useEffect } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, MessageSquare, Link as LinkIcon, QrCode, Sparkles, Mail } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PublicLayout } from "@/components/PublicLayout";

const loginSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  otp: z.string().optional(),
  password: z.string().optional(),
}).refine((data) => data.phone || (data.email && data.email !== ""), {
  message: "Phone number or email is required",
  path: ["phone"],
}).refine((data) => {
  // If using email, need password
  if (data.email && data.email !== "" && !data.phone) {
    return !!data.password;
  }
  // If using phone only, OTP or password is recommended but not required
  // (backend will check for trusted device if both are empty)
  return true;
}, {
  message: "Password is required for email login",
  path: ["password"],
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const { toast } = useToast();
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isRequestingMagicLink, setIsRequestingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);

  // Generate device fingerprint on mount
  useEffect(() => {
    const generateFingerprint = () => {
      const userAgent = navigator.userAgent;
      const language = navigator.language;
      const platform = navigator.platform;
      const screen = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fingerprint = `${userAgent}-${language}-${platform}-${screen}-${timezone}`;
      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36).substring(0, 32);
    };
    setDeviceFingerprint(generateFingerprint());
  }, []);

  // Check for magic link token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    const phone = searchParams.get("phone");
    const qrTokenParam = searchParams.get("qrToken");
    
    if (token && phone) {
      // Auto-login with magic link
      handleMagicLinkLogin(phone, token);
    } else if (qrTokenParam && phone) {
      // Auto-login with QR token
      handleQRLogin(phone, qrTokenParam);
    }
  }, [searchString]);

  const handleMagicLinkLogin = async (phone: string, token: string) => {
    try {
      const response = await apiRequest("POST", "/api/client/login", {
        phone,
        magicLinkToken: token,
      });
      const result = await response.json();
      
      if (result.client) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/client/dashboard");
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid magic link",
        variant: "destructive",
      });
    }
  };

  const handleQRLogin = async (phone: string, token: string) => {
    try {
      const response = await apiRequest("POST", "/api/client/login", {
        phone,
        qrToken: token,
      });
      const result = await response.json();
      
      if (result.client) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/client/dashboard");
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid QR code",
        variant: "destructive",
      });
    }
  };

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      email: "",
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

  const requestMagicLink = async () => {
    const phone = form.getValues("phone");
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingMagicLink(true);
    try {
      const response = await apiRequest("POST", "/api/client/request-magic-link", { phone });
      const data = await response.json();
      if (data.success) {
        setMagicLinkSent(true);
        
        if (data.whatsappSent) {
          toast({
            title: "Magic Link Sent! ✨",
            description: "Check your WhatsApp and click the link to login instantly - no OTP needed!",
          });
        } else if (data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank");
          toast({
            title: "Magic Link Ready",
            description: "Check WhatsApp for your magic link. Click it to login instantly!",
          });
        }
        
        // Also show the link directly if available
        if (data.magicLinkUrl) {
          toast({
            title: "Or click here",
            description: "You can also click this link directly",
            action: (
              <Button
                size="sm"
                onClick={() => window.open(data.magicLinkUrl, "_self")}
              >
                Open Link
              </Button>
            ),
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to send magic link",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRequestingMagicLink(false);
    }
  };

  const generateQRCode = async () => {
    const phone = form.getValues("phone");
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQR(true);
    try {
      const response = await apiRequest("POST", "/api/client/generate-qr-login", { phone });
      const data = await response.json();
      if (data.success) {
        setQrData(data.qrData);
        setQrToken(data.qrToken);
        toast({
          title: "QR Code Generated",
          description: "Scan the QR code with your phone to login",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to generate QR code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginData: any = { ...data };
      if (rememberDevice && deviceFingerprint) {
        loginData.rememberDevice = true;
        loginData.deviceFingerprint = deviceFingerprint;
      }
      const response = await apiRequest("POST", "/api/client/login", loginData);
      const result = await response.json();
      
      if (result.client) {
        toast({
          title: "Login successful",
          description: rememberDevice ? "Welcome back! This device is now trusted." : "Welcome back!",
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
            <Tabs defaultValue="magic-link" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="magic-link" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Magic Link
                </TabsTrigger>
                <TabsTrigger value="email" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="otp" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  OTP
                </TabsTrigger>
                <TabsTrigger value="password" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Password
                </TabsTrigger>
              </TabsList>

              {/* Magic Link Tab - Easiest, No OTP */}
              <TabsContent value="magic-link" className="space-y-4">
                <Form {...form}>
                  <form className="space-y-4">
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
                                disabled={magicLinkSent}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!magicLinkSent ? (
                      <>
                        <Button
                          type="button"
                          className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          onClick={requestMagicLink}
                          disabled={isRequestingMagicLink}
                        >
                          <LinkIcon className="h-4 w-4" />
                          {isRequestingMagicLink ? "Sending..." : "Get Magic Link (No OTP!)"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          ✨ Click the link sent to your WhatsApp to login instantly - no OTP needed!
                        </p>
                      </>
                    ) : (
                      <div className="space-y-2 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-center font-medium">
                          ✅ Magic link sent to your WhatsApp!
                        </p>
                        <p className="text-xs text-center text-muted-foreground">
                          Check your WhatsApp and click the link to login instantly.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setMagicLinkSent(false);
                            form.setValue("phone", "");
                          }}
                        >
                          Try different number
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </TabsContent>

              {/* Email Login Tab - No OTP Needed! */}
              <TabsContent value="email" className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="Enter your email address"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
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

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember-device"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="remember-device" className="text-sm text-muted-foreground cursor-pointer">
                        Remember this device (no OTP needed next time!)
                      </label>
                    </div>

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Signing in..." : "Sign In with Email"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      💡 Tip: Check "Remember this device" to skip OTP on future logins!
                    </p>
                  </form>
                </Form>
              </TabsContent>

              {/* OTP Tab */}
              <TabsContent value="otp" className="space-y-4">
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
                        {deviceFingerprint && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full gap-2 text-xs"
                            onClick={async () => {
                              const phone = form.getValues("phone");
                              if (!phone || phone.length < 10) {
                                toast({
                                  title: "Invalid phone number",
                                  description: "Please enter a valid phone number",
                                  variant: "destructive",
                                });
                                return;
                              }
                              // Try trusted device login
                              try {
                                const loginData = {
                                  phone,
                                  deviceFingerprint,
                                };
                                const response = await apiRequest("POST", "/api/client/login", loginData);
                                const result = await response.json();
                                if (result.client) {
                                  toast({
                                    title: "Login successful",
                                    description: "Welcome back!",
                                  });
                                  navigate("/client/dashboard");
                                  window.location.reload();
                                }
                              } catch (error: any) {
                                // If trusted device login fails, show OTP option
                                toast({
                                  title: "Device not trusted",
                                  description: "Please request OTP or use password",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            🔐 Try Quick Login (if device is trusted)
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
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
                                  Change number
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
                                  Resend
                                </Button>
                              </div>
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="remember-device-otp"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor="remember-device-otp" className="text-sm text-muted-foreground cursor-pointer">
                            Remember this device (no OTP needed next time!)
                          </label>
                        </div>
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
                        </Button>
                      </>
                    )}
                  </form>
                </Form>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password" className="space-y-4">
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
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
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

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember-device-password"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="remember-device-password" className="text-sm text-muted-foreground cursor-pointer">
                        Remember this device (no OTP needed next time!)
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            {/* QR Code Option */}
            {qrData && (
              <div className="mt-4 p-4 border rounded-lg space-y-2">
                <p className="text-sm font-medium text-center">Scan QR Code to Login</p>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    {/* Simple QR code representation - in production, use a QR library */}
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-gray-400" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Or click this link: <a href={JSON.parse(qrData).url} className="text-primary underline">Login Link</a>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setQrData(null);
                    setQrToken(null);
                  }}
                >
                  Close
                </Button>
              </div>
            )}

            {!qrData && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={generateQRCode}
                  disabled={isGeneratingQR}
                >
                  <QrCode className="h-4 w-4" />
                  {isGeneratingQR ? "Generating..." : "Generate QR Code Login"}
                </Button>
              </div>
            )}

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

