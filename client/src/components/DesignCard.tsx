import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { DesignWithImages } from "@shared/schema";

interface DesignCardProps {
  design: DesignWithImages;
}

export function DesignCard({ design }: DesignCardProps) {
  const primaryImage = design.images.sort((a, b) => a.sortOrder - b.sortOrder)[0];

  return (
    <Link href={`/design/${design.id}`} data-testid={`card-design-${design.id}`}>
      <article className="group cursor-pointer">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage.imageUrl}
              alt={design.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className="text-white/90 text-sm font-medium">View Details</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {design.title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {design.category}
            </Badge>
          </div>
          <p className="text-lg font-semibold text-primary">
            ₹{parseFloat(design.price).toLocaleString()}
          </p>
          {design.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {design.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
