import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { useCompany } from "@/contexts/CompanyContext";
import {
  ShoppingCart,
  FileText,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Stats {
  totalSales: number;
  totalExpenses: number;
  totalInvoices: number;
  unpaidInvoices: number;
  pendingPurchaseOrders: number;
  profit: number;
}

const Dashboard = () => {
  const { selectedCompany } = useCompany();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalExpenses: 0,
    totalInvoices: 0,
    unpaidInvoices: 0,
    pendingPurchaseOrders: 0,
    profit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedCompany) {
        setLoading(false);
        return;
      }

      const [salesOrders, expenses, invoices, purchaseOrders, saleReceipts] = await Promise.all([
        supabase.from("sales_orders").select("total").eq("company_id", selectedCompany.id),
        supabase.from("expenses").select("total").eq("company_id", selectedCompany.id),
        supabase.from("invoices").select("total, status").eq("company_id", selectedCompany.id),
        supabase.from("purchase_orders").select("status").eq("company_id", selectedCompany.id).eq("status", "pending"),
        supabase.from("sale_receipts").select("total").eq("company_id", selectedCompany.id),
      ]);

      const totalSales = (salesOrders.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0) +
        (saleReceipts.data?.reduce((sum, receipt) => sum + Number(receipt.total), 0) || 0);
      const totalExpenses = expenses.data?.reduce((sum, expense) => sum + Number(expense.total), 0) || 0;
      const totalInvoices = invoices.data?.length || 0;
      const unpaidInvoices = invoices.data?.filter(inv => inv.status === "unpaid" || inv.status === "partial").length || 0;
      const pendingPurchaseOrders = purchaseOrders.data?.length || 0;
      const profit = totalSales - totalExpenses;

      setStats({
        totalSales,
        totalExpenses,
        totalInvoices,
        unpaidInvoices,
        pendingPurchaseOrders,
        profit,
      });
      setLoading(false);
    };

    fetchStats();
  }, [selectedCompany]);

  if (!selectedCompany) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Please select a company to view the dashboard</p>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: "Total Sales",
      value: formatCurrency(stats.totalSales),
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      icon: CreditCard,
      color: "text-destructive",
    },
    {
      title: "Net Profit",
      value: formatCurrency(stats.profit),
      icon: stats.profit >= 0 ? TrendingUp : TrendingDown,
      color: stats.profit >= 0 ? "text-accent" : "text-destructive",
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices.toString(),
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Unpaid Invoices",
      value: stats.unpaidInvoices.toString(),
      icon: Receipt,
      color: "text-warning",
    },
    {
      title: "Pending Purchase Orders",
      value: stats.pendingPurchaseOrders.toString(),
      icon: ShoppingCart,
      color: "text-info",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of {selectedCompany.name} finances</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
