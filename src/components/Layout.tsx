import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Receipt,
  CreditCard,
  TrendingUp,
  LogOut,
  Menu,
  Building2,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CompanySelector } from "./CompanySelector";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/companies", icon: Building2, label: "Companies" },
  { path: "/bank-accounts", icon: Wallet, label: "Bank Accounts" },
  { path: "/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
  { path: "/sales-orders", icon: FileText, label: "Sales Orders" },
  { path: "/invoices", icon: FileText, label: "Invoices" },
  { path: "/sale-receipts", icon: Receipt, label: "Sale Receipts" },
  { path: "/expenses", icon: CreditCard, label: "Expenses" },
  { path: "/reports", icon: TrendingUp, label: "Reports" },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/login");
    }
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            location.pathname === item.path
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-primary">FinanceFlow</h1>
            <p className="text-sm text-muted-foreground">Business Management</p>
            <div className="mt-4">
              <CompanySelector />
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <NavLinks />
          </nav>
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-card lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary">FinanceFlow</h1>
              <div className="hidden sm:block">
                <CompanySelector />
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="border-b p-6">
                    <h1 className="text-2xl font-bold text-primary">FinanceFlow</h1>
                    <p className="text-sm text-muted-foreground">Business Management</p>
                    <div className="mt-4">
                      <CompanySelector />
                    </div>
                  </div>
                  <nav className="flex-1 space-y-1 p-4">
                    <NavLinks />
                  </nav>
                  <div className="border-t p-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
