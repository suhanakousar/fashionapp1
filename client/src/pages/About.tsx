import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Heart, Sparkles, Users } from "lucide-react";

export default function About() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
            About Rajiya Fashion
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crafting bespoke fashion designs with passion, precision, and personalized attention to detail
          </p>
        </div>

        <div className="space-y-8 mb-12">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to <strong>Rajiya Fashion</strong>, where fashion meets artistry. 
                Founded by <strong>M. Rajiya</strong>, we specialize in creating custom, 
                tailor-made designs that reflect your unique style and personality.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                With years of experience in fashion designing and tailoring, we bring 
                your vision to life through meticulous craftsmanship and attention to detail. 
                Every piece is carefully designed and crafted to ensure the perfect fit and 
                exceptional quality.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Custom Tailoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Expert tailoring services with precise measurements and fittings to ensure 
                  the perfect fit for every client.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Bespoke Designs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Unique, one-of-a-kind designs tailored to your preferences, style, and 
                  special occasions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Quality Materials</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use only the finest fabrics and materials to ensure durability, 
                  comfort, and elegance in every creation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Personalized Service</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Dedicated one-on-one consultations to understand your needs and bring 
                  your fashion dreams to reality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Our Story</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              At Rajiya Fashion, we believe that fashion is a form of self-expression. 
              Our journey began with a passion for creating beautiful, custom-made garments 
              that make our clients feel confident and elegant. Located in the heart of 
              Tadipatri, we serve clients from near and far, bringing professional fashion 
              design and tailoring services to your doorstep.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Whether you're looking for traditional wear, modern designs, or something 
              completely unique, we work closely with you to create pieces that celebrate 
              your individuality. Every stitch, every detail, and every fitting is done 
              with care and precision to ensure you receive a garment that exceeds your 
              expectations.
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

