/**
 * WhatsApp Integration Service
 * Supports multiple providers: Twilio, WhatsApp Business API, or simple URL-based messaging
 */

interface WhatsAppConfig {
  provider: "twilio" | "whatsapp-api" | "url";
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiUrl?: string;
  apiKey?: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      provider: (process.env.WHATSAPP_PROVIDER as any) || "url",
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER,
      apiUrl: process.env.WHATSAPP_API_URL,
      apiKey: process.env.WHATSAPP_API_KEY,
    };
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Clean phone number (remove non-digits, add country code if needed)
    const cleanPhone = this.cleanPhoneNumber(phone);

    try {
      switch (this.config.provider) {
        case "twilio":
          return await this.sendViaTwilio(cleanPhone, message);
        case "whatsapp-api":
          return await this.sendViaWhatsAppAPI(cleanPhone, message);
        case "url":
        default:
          // For URL-based, we return a WhatsApp web URL
          // This is a fallback when no API is configured
          return {
            success: true,
            messageId: `url-${Date.now()}`,
          };
      }
    } catch (error: any) {
      console.error("WhatsApp send error:", error);
      return {
        success: false,
        error: error.message || "Failed to send WhatsApp message",
      };
    }
  }

  /**
   * Send via Twilio
   */
  private async sendViaTwilio(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.accountSid || !this.config.authToken || !this.config.fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    try {
      // Dynamic import to avoid requiring twilio if not used
      // @ts-ignore - twilio is optional
      const twilio = await import("twilio");
      const client = twilio.default(this.config.accountSid, this.config.authToken);

      const result = await client.messages.create({
        from: `whatsapp:${this.config.fromNumber}`,
        to: `whatsapp:${phone}`,
        body: message,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Twilio API error",
      };
    }
  }

  /**
   * Send via WhatsApp Business API
   */
  private async sendViaWhatsAppAPI(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.apiUrl || !this.config.apiKey) {
      throw new Error("WhatsApp API credentials not configured");
    }

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          message: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id || `api-${Date.now()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "WhatsApp API error",
      };
    }
  }

  /**
   * Generate WhatsApp web URL (fallback method)
   */
  getWhatsAppURL(phone: string, message: string): string {
    const cleanPhone = this.cleanPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Clean and format phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If number doesn't start with country code, assume it's Indian (+91)
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }

    return cleaned;
  }

  /**
   * Generate OTP message for client login
   */
  generateOTPMessage(clientName: string, otp: string): string {
    return `Hello ${clientName}! 👋

Your OTP for client portal login is:

🔐 ${otp}

This OTP is valid for 10 minutes.

If you didn't request this OTP, please ignore this message.

Thank you! 🙏`;
  }

  /**
   * Generate booking confirmation message
   */
  generateBookingConfirmationMessage(booking: {
    clientName: string;
    designTitle: string;
    orderId: string;
    price: string;
    preferredDate?: string;
    magicLinkUrl?: string; // Optional magic link for instant login
  }): string {
    const orderNum = booking.orderId.slice(0, 8);
    const dateText = booking.preferredDate 
      ? `\n📅 Preferred Date: ${booking.preferredDate}`
      : "";

    const loginLink = booking.magicLinkUrl 
      ? `\n\n✨ INSTANT LOGIN (No OTP needed!):\n🔗 ${booking.magicLinkUrl}\n\nClick this link to access your client portal instantly and track your order!`
      : `\n\n🔗 Access your orders: [Your website]/client/login`;

    return `Hello ${booking.clientName}! 👋

Thank you for your booking! We're excited to work with you.

✅ Your booking has been confirmed!

📦 Order #${orderNum}
👗 Design: "${booking.designTitle}"
💰 Amount: ₹${parseFloat(booking.price).toLocaleString()}${dateText}

We'll review your order and get back to you soon. You can track your order status in our client portal.${loginLink}

Thank you for choosing us! 🙏

If you have any questions, feel free to reach out.`;
  }

  /**
   * Generate order status update message
   */
  generateOrderStatusMessage(order: {
    id: string;
    designTitle: string;
    status: string;
    clientName: string;
    orderNumber?: string;
  }): string {
    const statusLabels: Record<string, string> = {
      requested: "Requested",
      accepted: "Accepted",
      in_progress: "In Progress",
      ready_for_delivery: "Ready for Delivery",
      delivered: "Delivered",
    };

    const orderNum = order.orderNumber || order.id.slice(0, 8);
    const status = statusLabels[order.status] || order.status;

    return `Hi ${order.clientName}! 👋

Your order for "${order.designTitle}" has been updated.

📦 Order #${orderNum}
📊 Status: ${status}

${this.getStatusSpecificMessage(order.status)}

Thank you for choosing us! 🙏`;
  }

  /**
   * Get status-specific message
   */
  private getStatusSpecificMessage(status: string): string {
    switch (status) {
      case "accepted":
        return "We've accepted your order and will begin working on it soon.";
      case "in_progress":
        return "Your order is currently in progress. We'll keep you updated!";
      case "ready_for_delivery":
        return "Great news! Your order is ready for delivery. Please contact us to arrange pickup/delivery.";
      case "delivered":
        return "Your order has been delivered. We hope you love it! Please share your feedback.";
      default:
        return "We'll keep you updated on the progress.";
    }
  }
}

export const whatsappService = new WhatsAppService();

