import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiWhatsapp } from "react-icons/si";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface WhatsAppSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientPhone: string;
  orderId?: string;
  defaultMessage?: string;
}

export function WhatsAppSendDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientPhone,
  orderId,
  defaultMessage = "",
}: WhatsAppSendDialogProps) {
  const { toast } = useToast();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: defaultMessage,
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      return apiRequest("POST", "/api/whatsapp/send", {
        clientId,
        message: data.message,
        orderId: orderId || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "WhatsApp message has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages", clientId] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    sendMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="h-5 w-5 text-green-600" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {clientName} ({clientPhone})
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendMutation.isPending}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
                {sendMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

