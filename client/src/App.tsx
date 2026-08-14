import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Quotes from "./pages/Quotes";
import Orders from "./pages/Orders";
import Purchases from "./pages/Purchases";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import CounterSale from "./pages/CounterSale";

function Router() {
  return (
    <Switch>
      {/* Login page - standalone, no DashboardLayout */}
      <Route path={"/login"} component={LoginPage} />
      {/* All other routes require DashboardLayout (auth handled inside) */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path={"/"} component={Dashboard} />
            <Route path={"/quotes"} component={Quotes} />
            <Route path={"/orders"} component={Orders} />
            <Route path={"/counter-sale"} component={CounterSale} />
            <Route path={"/purchases"} component={Purchases} />
            <Route path={"/stock"} component={Stock} />
            <Route path={"/reports"} component={Reports} />
            <Route path={"/clients"} component={Clients} />
            <Route path={"/products"} component={Products} />
            <Route path={"/suppliers"} component={Suppliers} />
            <Route path={"/404"} component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
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
