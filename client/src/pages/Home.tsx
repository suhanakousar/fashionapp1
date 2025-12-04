import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { Hero } from "@/components/Hero";
import { DesignCard } from "@/components/DesignCard";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Sparkles } from "lucide-react";
import type { DesignWithImages, Category } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const { data: designs = [], isLoading: designsLoading } = useQuery<DesignWithImages[]>({
    queryKey: ["/api/designs"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filteredDesigns = designs
    .filter((design) => {
      const matchesSearch =
        searchQuery === "" ||
        design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === null || design.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-desc":
          return parseFloat(b.price) - parseFloat(a.price);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const allCategories = [
    ...new Set([
      ...categories.map((c) => c.name),
      ...designs.map((d) => d.category),
    ]),
  ].filter(Boolean);

  return (
    <PublicLayout>
      {/* Hero Section with Before/After Carousel */}
      <Hero
        headline="Stitch the Impossible — Create couture fusions in seconds."
        subheadline="Frankenstein Fusion Outfit Designer: Where traditional meets gothic, powered by AI."
        ctaText="Try FrankenStitch"
        ctaLink="/fusion"
      />

      {/* Fusion Feature Section */}
      <section className="bg-gradient-to-b from-background to-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              AI-Powered Fashion Fusion
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Combine traditional Indian wear with gothic aesthetics using our revolutionary fusion technology
            </p>
            <Link href="/fusion">
              <Button size="lg" className="gap-2 kiro-glow">
                <Sparkles className="h-5 w-5" />
                Create Your Fusion
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              Our Collection
            </h2>
            <p className="text-muted-foreground mt-2">
              Browse through our curated selection of designs
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search designs..."
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
                aria-label="Search designs"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-sort">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSortBy("newest")}
                  data-testid="sort-newest"
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("price-asc")}
                  data-testid="sort-price-asc"
                >
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("price-desc")}
                  data-testid="sort-price-desc"
                >
                  Price: High to Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedCategory(null)}
              data-testid="filter-all"
            >
              All
            </Badge>
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedCategory(category)}
                data-testid={`filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {designsLoading ? (
          <PageLoader text="Loading designs..." />
        ) : filteredDesigns.length === 0 ? (
          <EmptyState
            title="No designs found"
            description={
              searchQuery || selectedCategory
                ? "Try adjusting your search or filter criteria"
                : "Check back soon for new designs"
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredDesigns.map((design) => (
              <DesignCard key={design.id} design={design} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold">Bespoke Design</h3>
              <p className="text-muted-foreground">
                Each piece is uniquely crafted to match your style and measurements
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold">Premium Quality</h3>
              <p className="text-muted-foreground">
                We use only the finest fabrics and materials for lasting elegance
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold">Timely Delivery</h3>
              <p className="text-muted-foreground">
                We respect your time with clear timelines and consistent updates
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
