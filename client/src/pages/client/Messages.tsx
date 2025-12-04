import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PublicLayout } from "@/components/PublicLayout";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, Client } from "@shared/schema";
import { format } from "date-fns";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function ClientMessages() {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: client } = useQuery<Client | null>({
    queryKey: ["/api/client/me"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/client/orders"],
  });

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/client/messages"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      return apiRequest("POST", "/api/client/messages", {
        ...data,
        orderId: orderId || null,
      });
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages"] });
      toast({ title: "Message sent" });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = (data: MessageFormData) => {
    sendMessageMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <PageLoader text="Loading messages..." />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/client/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with your designer
            </p>
          </div>

          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat with Designer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      icon={MessageSquare}
                      title="No messages yet"
                      description="Start a conversation with your designer"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isClient = msg.sender === "client";
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isClient ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={isClient ? "bg-primary" : "bg-muted"}>
                              {isClient
                                ? (client && typeof client === 'object' && 'name' in client ? client.name : "C")[0]?.toUpperCase() || "C"
                                : "D"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col ${isClient ? "items-end" : ""} max-w-[70%]`}>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isClient
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 px-2">
                              {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <div className="border-t p-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex gap-2"
                  >
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Type your message..."
                              {...field}
                              disabled={sendMessageMutation.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={sendMessageMutation.isPending}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}

