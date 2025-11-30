import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PublicLayout } from "@/components/PublicLayout";
import { ImageCarousel } from "@/components/ImageCarousel";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import type { DesignWithImages } from "@shared/schema";
import { format } from "date-fns";

export default function DesignDetail() {
  const [, params] = useRoute("/design/:id");
  const designId = params?.id;

  const { data: design, isLoading, error } = useQuery<DesignWithImages>({
    queryKey: ["/api/designs", designId],
    enabled: !!designId,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading design..." />
      </PublicLayout>
    );
  }

  if (error || !design) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <EmptyState
            title="Design not found"
            description="The design you're looking for doesn't exist or has been removed."
            action={{
              label: "Back to Gallery",
              onClick: () => window.history.back(),
            }}
          />
        </div>
      </PublicLayout>
    );
  }

  const sortedImages = [...design.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" data-testid="link-back">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <ImageCarousel images={sortedImages} title={design.title} />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Tag className="h-3 w-3 mr-1" />
                {design.category}
              </Badge>
              <h1
                className="font-serif text-3xl md:text-4xl font-semibold mb-4"
                data-testid="text-design-title"
              >
                {design.title}
              </h1>
              <p
                className="text-3xl font-bold text-primary"
                data-testid="text-design-price"
              >
                ₹{parseFloat(design.price).toLocaleString()}
              </p>
            </div>

            <Separator />

            {design.description && (
              <div>
                <h2 className="font-semibold mb-3">Description</h2>
                <p
                  className="text-muted-foreground leading-relaxed"
                  data-testid="text-design-description"
                >
                  {design.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Added {format(new Date(design.createdAt), "MMMM d, yyyy")}</span>
            </div>

            <Separator />

            <div className="space-y-4">
              <Link href={`/book/${design.id}`} data-testid="link-book-design">
                <Button size="lg" className="w-full text-base">
                  Book This Design
                </Button>
              </Link>
              <p className="text-sm text-center text-muted-foreground">
                Complete our booking form to reserve this design with your measurements
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">What's Included</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="h-3 w-3 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Custom measurements fitting</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="h-3 w-3 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Premium fabric selection</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="h-3 w-3 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">One fitting session included</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="h-3 w-3 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Minor alterations covered</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
