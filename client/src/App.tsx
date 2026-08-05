import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Quotes from "./pages/Quotes";
import Orders from "./pages/Orders";
import PurchaseOrders from "./pages/PurchaseOrders";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/clients" component={Clients} />
      <Route path="/products" component={Products} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/quotes" component={Quotes} />
      <Route path="/orders" component={Orders} />
      <Route path="/purchase-orders" component={PurchaseOrders} />
      <Route path="/stock" component={Stock} />
      <Route path="/reports" component={Reports} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
