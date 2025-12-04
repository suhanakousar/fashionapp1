import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Sparkles, ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="font-serif text-6xl md:text-8xl font-bold text-primary">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/fusion">
              <Button size="lg" variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Try Fusion
              </Button>
            </Link>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Or go back to where you came from
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2 mt-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
