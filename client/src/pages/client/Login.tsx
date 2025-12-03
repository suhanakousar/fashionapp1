import { useState, useEffect } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Link as LinkIcon, Sparkles, ArrowLeft } from "lucide-react";
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
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const { toast } = useToast();
  const [isRequestingMagicLink, setIsRequestingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);

  // Generate device fingerprint on mount
  useEffect(() => {
    const generateFingerprint = () => {
      try {
        const userAgent = navigator.userAgent;
        const language = navigator.language;
        const platform = navigator.platform;
        const screenSize = `${window.screen.width}x${window.screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fingerprint = `${userAgent}-${language}-${platform}-${screenSize}-${timezone}`;
        // Simple hash
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36).substring(0, 32);
      } catch (error) {
        // Fallback if fingerprint generation fails
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
    };
    setDeviceFingerprint(generateFingerprint());
  }, []);

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

  // Check for magic link token in URL
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Error processing URL parameters:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
    },
  });

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
        
        // Store the magic link URL to display on page
        if (data.magicLinkUrl) {
          setMagicLinkUrl(data.magicLinkUrl);
          
          toast({
            title: "Magic Link Generated! ✨",
            description: data.whatsappSent 
              ? "Check your WhatsApp for the link, or click the button below to login instantly!"
              : "Click the button below to login instantly (no OTP needed)!",
          });
        }
        
        // Also try to open WhatsApp if URL is available
        if (data.whatsappUrl && !data.whatsappSent) {
          // Open WhatsApp in new tab after a short delay
          setTimeout(() => {
            window.open(data.whatsappUrl, "_blank");
          }, 500);
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


  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center relative">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Sign in to track your orders and communicate with us
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                      <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-center font-medium">
                          ✅ Magic link generated!
                        </p>
                        <p className="text-xs text-center text-muted-foreground">
                          {magicLinkUrl 
                            ? "Click the button below to login instantly (no OTP needed)!"
                            : "Check your WhatsApp for the magic link."}
                        </p>
                        {magicLinkUrl && (
                          <Button
                            type="button"
                            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            onClick={() => {
                              window.location.href = magicLinkUrl;
                            }}
                          >
                            <LinkIcon className="h-4 w-4" />
                            🔗 Login Instantly (No OTP!)
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setMagicLinkSent(false);
                              setMagicLinkUrl(null);
                              form.setValue("phone", "");
                            }}
                          >
                            Try different number
                          </Button>
                          {magicLinkUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                navigator.clipboard.writeText(magicLinkUrl);
                                toast({
                                  title: "Link copied!",
                                  description: "Magic link copied to clipboard",
                                });
                              }}
                            >
                              Copy Link
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </form>
                </Form>
            </div>

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

