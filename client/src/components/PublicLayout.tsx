import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { PWAInstallButton } from "./PWAInstallButton";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" data-testid="link-home">
              <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight cursor-pointer">
                Rajiya Fashion
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" data-testid="link-nav-gallery">
                <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === "/" ? "text-primary" : "text-muted-foreground"
                }`}>
                  Gallery
                </span>
              </Link>
              <Link href="/about" data-testid="link-nav-about">
                <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === "/about" ? "text-primary" : "text-muted-foreground"
                }`}>
                  About
                </span>
              </Link>
              <Link href="/contact" data-testid="link-nav-contact">
                <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === "/contact" ? "text-primary" : "text-muted-foreground"
                }`}>
                  Contact
                </span>
              </Link>
              <Link href="/client/login" data-testid="link-client-login">
                <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === "/client/login" ? "text-primary" : "text-muted-foreground"
                }`}>
                  Track Order
                </span>
              </Link>
              <PWAInstallButton />
              <ThemeToggle />
              <Link href="/admin/login" data-testid="link-admin-login">
                <Button variant="outline" size="sm">
                  Designer Login
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <PWAInstallButton />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" data-testid="link-mobile-gallery">
                <span className="block py-2 text-base font-medium cursor-pointer">Gallery</span>
              </Link>
              <Link href="/about" data-testid="link-mobile-about">
                <span className="block py-2 text-base font-medium cursor-pointer">About</span>
              </Link>
              <Link href="/contact" data-testid="link-mobile-contact">
                <span className="block py-2 text-base font-medium cursor-pointer">Contact</span>
              </Link>
              <Link href="/client/login" data-testid="link-mobile-client-login">
                <span className="block py-2 text-base font-medium cursor-pointer">Track Order</span>
              </Link>
              <div className="pt-2">
                <PWAInstallButton />
              </div>
              <Link href="/admin/login" data-testid="link-mobile-admin">
                <Button variant="outline" className="w-full">
                  Designer Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16 md:pt-20">{children}</main>

      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-xl font-semibold mb-4">Rajiya Fashion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bespoke fashion designs crafted with passion and precision. 
                Each piece tells a unique story.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/" data-testid="link-footer-gallery">
                  <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Gallery
                  </span>
                </Link>
                <Link href="/about" data-testid="link-footer-about">
                  <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    About
                  </span>
                </Link>
                <Link href="/contact" data-testid="link-footer-contact">
                  <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Contact
                  </span>
                </Link>
                <Link href="/client/login" data-testid="link-footer-client-login">
                  <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Track Order
                  </span>
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Phone: 9182720386</p>
                <p>D.No. 7/394, Rayachur Street</p>
                <p>Main Bazar, Tadipatri-515411</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Rajiya Fashion. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
