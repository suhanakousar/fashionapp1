import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import DesignDetail from "@/pages/DesignDetail";
import Booking from "@/pages/Booking";
import BookingConfirmation from "@/pages/BookingConfirmation";
import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Designs from "@/pages/admin/Designs";
import DesignEditor from "@/pages/admin/DesignEditor";
import Clients from "@/pages/admin/Clients";
import ClientDetail from "@/pages/admin/ClientDetail";
import Orders from "@/pages/admin/Orders";
import OrderDetail from "@/pages/admin/OrderDetail";
import Settings from "@/pages/admin/Settings";
import ClientLogin from "@/pages/client/Login";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientOrders from "@/pages/client/Orders";
import ClientOrderDetail from "@/pages/client/OrderDetail";
import ClientMessages from "@/pages/client/Messages";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/design/:id" component={DesignDetail} />
      <Route path="/book/:designId" component={Booking} />
      <Route path="/booking/confirm/:orderId" component={BookingConfirmation} />
      
      {/* Auth Route */}
      <Route path="/admin/login" component={Login} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/designs">
        <ProtectedRoute>
          <Designs />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/designs/:id">
        <ProtectedRoute>
          <DesignEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/clients/:id">
        <ProtectedRoute>
          <ClientDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders/:id">
        <ProtectedRoute>
          <OrderDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      
      {/* Client Portal Routes */}
      <Route path="/client/login" component={ClientLogin} />
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/orders" component={ClientOrders} />
      <Route path="/client/orders/:id" component={ClientOrderDetail} />
      <Route path="/client/messages" component={ClientMessages} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
