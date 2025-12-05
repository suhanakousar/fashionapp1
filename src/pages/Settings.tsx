import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Image as ImageIcon,
  Palette,
  Settings as SettingsIcon,
  HardDrive,
  HelpCircle,
  LogOut,
  Zap,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-white via-pearl-cream to-opal-lavender-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-semibold text-royal-plum">
            Settings & Profile
          </h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-royal-plum" />
                <CardTitle>Account Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-royal-plum to-opal-lavender flex items-center justify-center">
                  <User className="w-8 h-8 text-pearl-white" />
                </div>
                <div>
                  <p className="font-semibold text-royal-plum">User Name</p>
                  <p className="text-sm text-muted-foreground">
                    user@example.com
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* My Saved Outfits */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-royal-plum" />
                <CardTitle>My Saved Outfits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View and manage your saved designs
              </p>
              <Button variant="outline" className="w-full">
                View All Outfits
              </Button>
            </CardContent>
          </Card>

          {/* Fabrics Library */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-royal-plum" />
                <CardTitle>Fabrics Library</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage your fabric collection
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/fabric-library")}
              >
                Open Fabric Library
              </Button>
            </CardContent>
          </Card>

          {/* AI Quality Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-royal-plum" />
                <CardTitle>AI Quality Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-opal-lavender/10">
                <div>
                  <p className="font-medium text-royal-plum">Fast Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Quick results, lower quality
                  </p>
                </div>
                <input type="radio" name="quality" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gold-soft/10">
                <div>
                  <p className="font-medium text-royal-plum">High Quality</p>
                  <p className="text-sm text-muted-foreground">
                    Slower processing, premium results
                  </p>
                </div>
                <input type="radio" name="quality" />
              </div>
            </CardContent>
          </Card>

          {/* Storage Used */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-royal-plum" />
                <CardTitle>Storage Used</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium text-royal-plum">2.4 GB</span>
                </div>
                <div className="w-full h-2 bg-opal-lavender/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-royal-plum to-opal-lavender"
                    style={{ width: "60%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  4 GB total storage
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-royal-plum" />
                <CardTitle>Help & Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

