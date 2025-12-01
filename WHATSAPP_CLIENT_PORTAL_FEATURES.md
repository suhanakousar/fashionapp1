# WhatsApp Integration & Client Portal Features

## Overview

This document describes the newly implemented **WhatsApp Integration** and **Client Portal** features for the fashion design application.

---

## 🟢 WhatsApp Integration

### Features Implemented

1. **WhatsApp Service** (`server/whatsapp.ts`)
   - Supports multiple providers: Twilio, WhatsApp Business API, or URL-based fallback
   - Automatic phone number formatting
   - Message template generation for order status updates

2. **Auto-Notifications**
   - Automatically sends WhatsApp messages when order status changes
   - Customizable message templates based on order status
   - Messages are saved to database for tracking

3. **Admin UI Components**
   - WhatsApp send dialog component (`client/src/components/WhatsAppSendDialog.tsx`)
   - Integrated into Client Detail and Order Detail pages
   - Message history tracking

### Configuration

Add these environment variables to your `.env` file:

```env
# WhatsApp Provider (options: "twilio", "whatsapp-api", "url")
WHATSAPP_PROVIDER=url

# For Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890

# For WhatsApp Business API
WHATSAPP_API_URL=https://api.whatsapp.com/v1/messages
WHATSAPP_API_KEY=your_api_key

# Fallback WhatsApp number (for URL-based method)
WHATSAPP_NUMBER=+1234567890
```

### API Endpoints

- `POST /api/whatsapp/send` - Send WhatsApp message (admin only)
- `GET /api/whatsapp/messages/:clientId` - Get message history (admin only)

### Usage

1. **From Admin Panel:**
   - Go to Client Detail or Order Detail page
   - Click "Send WhatsApp Message" button
   - Type your message and send

2. **Automatic Notifications:**
   - When you update an order status, a WhatsApp notification is automatically sent to the client
   - Message includes order details and status update

---

## 🔵 Client Portal

### Features Implemented

1. **Client Authentication**
   - Phone-based login with OTP (One-Time Password)
   - Password-based login (optional)
   - Session management

2. **Client Dashboard** (`/client/dashboard`)
   - Overview of active orders
   - Completed orders count
   - Unread messages count
   - Quick action buttons

3. **Order Tracking** (`/client/orders`)
   - View all orders with filtering by status
   - Order detail page with full information
   - Status timeline visualization
   - Billing information

4. **Messaging System** (`/client/messages`)
   - Real-time chat interface with designer
   - Message history
   - Unread message indicators

5. **Additional Pages** (can be added):
   - Measurements history
   - Billing & invoices
   - Profile settings

### Client Portal Routes

- `/client/login` - Client login page
- `/client/dashboard` - Client dashboard
- `/client/orders` - Order list
- `/client/orders/:id` - Order details
- `/client/messages` - Messaging interface

### API Endpoints

**Authentication:**
- `POST /api/client/request-otp` - Request OTP for login
- `POST /api/client/login` - Client login (OTP or password)
- `POST /api/client/logout` - Client logout
- `GET /api/client/me` - Get current client

**Client Data:**
- `GET /api/client/orders` - Get client's orders
- `GET /api/client/orders/:id` - Get order details
- `GET /api/client/measurements` - Get measurements
- `GET /api/client/billing` - Get billing entries
- `GET /api/client/messages` - Get messages
- `GET /api/client/messages/unread` - Get unread count
- `POST /api/client/messages` - Send message
- `PATCH /api/client/profile` - Update profile

### How Clients Access the Portal

1. **First Time:**
   - Client books a design through the public booking form
   - Client account is automatically created
   - Client can then log in using their phone number

2. **Login Process:**
   - Go to `/client/login`
   - Enter phone number
   - Click "Request OTP" (OTP will be sent - in production, via SMS/WhatsApp)
   - Enter OTP and login
   - OR use password if previously set

3. **After Login:**
   - Client is redirected to dashboard
   - Can view orders, track status, message designer

### OTP Implementation

Currently, OTP is logged to console for development. In production:
- Integrate with SMS service (Twilio, AWS SNS, etc.)
- Or send OTP via WhatsApp using the WhatsApp service
- OTP expires after 10 minutes

---

## Database Schema Updates

### New Collections/Tables

1. **messages** - Stores messages between clients and designers
   - `clientId`, `designerId`, `orderId`, `sender`, `message`, `read`, `createdAt`

2. **whatsapp_messages** - Stores WhatsApp message history
   - `clientId`, `orderId`, `phone`, `message`, `status`, `sentAt`, `createdAt`

### Updated Collections

1. **clients** - Added fields:
   - `password` - For password-based login
   - `otp` - Current OTP
   - `otpExpires` - OTP expiration timestamp

---

## Implementation Details

### Files Created

**Backend:**
- `server/whatsapp.ts` - WhatsApp service
- Updated `server/routes.ts` - Added WhatsApp and client portal routes
- Updated `server/storage.ts` - Added message and WhatsApp message methods
- Updated `shared/schema.ts` - Added Message and WhatsAppMessage types

**Frontend:**
- `client/src/pages/client/Login.tsx` - Client login page
- `client/src/pages/client/Dashboard.tsx` - Client dashboard
- `client/src/pages/client/Orders.tsx` - Order list
- `client/src/pages/client/OrderDetail.tsx` - Order details
- `client/src/pages/client/Messages.tsx` - Messaging interface
- `client/src/components/WhatsAppSendDialog.tsx` - WhatsApp send dialog
- `client/src/lib/clientAuth.tsx` - Client authentication context
- Updated `client/src/App.tsx` - Added client routes

---

## Security Considerations

1. **Client Authentication:**
   - Sessions are separate from admin sessions
   - Clients can only access their own data
   - All client routes require authentication

2. **WhatsApp Integration:**
   - Admin-only access to send messages
   - Message history is tracked
   - Failed messages are logged

3. **OTP Security:**
   - OTP expires after 10 minutes
   - OTP is cleared after successful login
   - In production, use secure SMS/WhatsApp delivery

---

## Future Enhancements

1. **WhatsApp:**
   - Two-way messaging (receive messages from clients)
   - Message templates library
   - Bulk messaging
   - Message scheduling

2. **Client Portal:**
   - Email notifications
   - Push notifications
   - Order cancellation requests
   - Review/rating system
   - Payment integration
   - Profile photo upload

---

## Testing

### Test WhatsApp Integration:
1. Configure WhatsApp provider in `.env`
2. Go to admin panel → Client Detail
3. Click "Send WhatsApp Message"
4. Send a test message
5. Check order status update triggers auto-notification

### Test Client Portal:
1. Book a design (creates client account)
2. Go to `/client/login`
3. Enter phone number and request OTP
4. Check console for OTP (in development)
5. Login and explore dashboard

---

## Notes

- WhatsApp integration uses URL-based method by default (opens WhatsApp web)
- For production, configure Twilio or WhatsApp Business API
- OTP is currently logged to console - integrate SMS service for production
- Client portal requires clients to have placed at least one order
- Messages are polled every 5 seconds - consider WebSockets for real-time updates

---

## Support

For issues or questions:
1. Check environment variables are set correctly
2. Verify database collections exist
3. Check browser console for errors
4. Review server logs for API errors

