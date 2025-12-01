import { useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Ruler,
  FileText,
  Upload,
  X,
  Check,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/PublicLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api";
import type { DesignWithImages } from "@shared/schema";
import { bookingFormSchema, type BookingFormData } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: "contact", title: "Contact", icon: User },
  { id: "measurements", title: "Measurements", icon: Ruler },
  { id: "details", title: "Details", icon: FileText },
];

export default function Booking() {
  const [, params] = useRoute("/book/:designId");
  const [, navigate] = useLocation();
  const designId = params?.designId;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: design, isLoading, error } = useQuery<DesignWithImages>({
    queryKey: ["/api/designs", designId],
    enabled: !!designId,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      whatsapp: "",
      preferredDate: "",
      notes: "",
      chest: "",
      waist: "",
      hips: "",
      shoulder: "",
      sleeve: "",
      length: "",
      measurementNotes: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const apiUrl = getApiUrl("/api/book");
      const response = await fetch(apiUrl, {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit booking");
      }
      return response.json();
    },
    onSuccess: (data) => {
      navigate(`/booking/confirm/${data.order.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof BookingFormData)[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ["name", "phone"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("designId", designId!);
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    uploadedFiles.forEach((file) => {
      formData.append("files", file);
    });

    bookingMutation.mutate(formData);
  };

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
            description="The design you're trying to book doesn't exist."
            action={{
              label: "Back to Gallery",
              onClick: () => navigate("/"),
            }}
          />
        </div>
      </PublicLayout>
    );
  }

  const primaryImage = design.images.sort((a, b) => a.sortOrder - b.sortOrder)[0];

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          className="gap-2 mb-6"
          onClick={() => navigate(`/design/${designId}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Design
        </Button>

        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
            Book This Design
          </h1>
          <p className="text-muted-foreground">
            Complete the form below to reserve "{design.title}"
          </p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 sm:w-20 h-0.5 mx-2 -mt-5",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 0 && (
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your full name"
                                {...field}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="9182720386"
                                {...field}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormDescription>
                              We'll use this to contact you about your order
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="WhatsApp number if different"
                                {...field}
                                data-testid="input-whatsapp"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {currentStep === 1 && (
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter your measurements in inches. These help us create
                        a perfect fit for you.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="chest"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chest</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="38"
                                  {...field}
                                  data-testid="input-chest"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="waist"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Waist</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="32"
                                  {...field}
                                  data-testid="input-waist"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hips"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hips</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="40"
                                  {...field}
                                  data-testid="input-hips"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shoulder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shoulder</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="18"
                                  {...field}
                                  data-testid="input-shoulder"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sleeve"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sleeve</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="25"
                                  {...field}
                                  data-testid="input-sleeve"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Length</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="30"
                                  {...field}
                                  data-testid="input-length"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="measurementNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Measurement Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any specific fit preferences or additional measurements..."
                                className="min-h-[100px]"
                                {...field}
                                data-testid="input-measurement-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {currentStep === 2 && (
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="preferredDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Preferred Completion Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="button-date-picker"
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value ? new Date(field.value) : undefined
                                  }
                                  onSelect={(date) =>
                                    field.onChange(date?.toISOString())
                                  }
                                  disabled={(date) =>
                                    date < new Date()
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When would you like your design ready?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any special requests, color preferences, or modifications..."
                                className="min-h-[120px]"
                                {...field}
                                data-testid="input-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <FormLabel className="mb-2 block">
                          Reference Images (Optional)
                        </FormLabel>
                        <div
                          {...getRootProps()}
                          className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                            isDragActive
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/50"
                          )}
                          data-testid="dropzone"
                        >
                          <input {...getInputProps()} />
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drag & drop images here, or click to select
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max 5 images, 5MB each
                          </p>
                        </div>

                        {uploadedFiles.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                            {uploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative aspect-square rounded-md overflow-hidden group"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-remove-file-${index}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next-step"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="button-submit-booking"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Booking"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          <div className="md:sticky md:top-24 md:self-start">
            <Card>
              <CardContent className="pt-6">
                {primaryImage && (
                  <div className="aspect-square rounded-md overflow-hidden mb-4">
                    <img
                      src={primaryImage.imageUrl}
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-serif text-lg font-semibold">{design.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {design.category}
                </p>
                <p className="text-xl font-bold text-primary mt-3">
                  ₹{parseFloat(design.price).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
