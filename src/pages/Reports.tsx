import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { useCompany } from "@/contexts/CompanyContext";
import { TrendingUp, TrendingDown, Download, FileText } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/reportExport";

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

const Reports = () => {
  const { selectedCompany } = useCompany();
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [selectedCompany]);

  const fetchReportData = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    const [salesOrders, expenses, saleReceipts, invoices] = await Promise.all([
      supabase.from("sales_orders").select("total").eq("company_id", selectedCompany.id),
      supabase.from("expenses").select("total").eq("company_id", selectedCompany.id),
      supabase.from("sale_receipts").select("total").eq("company_id", selectedCompany.id),
      supabase.from("invoices").select("total, paid_amount").eq("company_id", selectedCompany.id),
    ]);

    const totalSalesOrders = salesOrders.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const totalReceipts = saleReceipts.data?.reduce((sum, receipt) => sum + Number(receipt.total), 0) || 0;
    const totalInvoicePaid = invoices.data?.reduce((sum, invoice) => sum + Number(invoice.paid_amount), 0) || 0;
    
    const totalRevenue = totalSalesOrders + totalReceipts + totalInvoicePaid;
    const totalExpenses = expenses.data?.reduce((sum, expense) => sum + Number(expense.total), 0) || 0;
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit; // Simplified for now
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    setReportData({
      totalRevenue,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
    });
    setLoading(false);
  };

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
      {!selectedCompany ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Please select a company first</p>
        </div>
      ) : (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profit & Loss Report</h1>
            <p className="text-muted-foreground">Detailed financial statement for {selectedCompany.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToPDF(reportData, selectedCompany.name)}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => exportToExcel(reportData, selectedCompany.name)}>
              <FileText className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-3">
                <span className="font-medium">Total Revenue</span>
                <span className="font-bold text-accent">{formatCurrency(reportData.totalRevenue)}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-medium">Total Expenses</span>
                <span className="font-bold text-destructive">{formatCurrency(reportData.totalExpenses)}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-medium">Gross Profit</span>
                <span className={`font-bold ${reportData.grossProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatCurrency(reportData.grossProfit)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-lg font-semibold">Net Profit</span>
                <span className={`text-xl font-bold ${reportData.netProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatCurrency(reportData.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Profit Margin</span>
                  {reportData.profitMargin >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-accent" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className={`text-3xl font-bold ${reportData.profitMargin >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {reportData.profitMargin.toFixed(2)}%
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Performance Indicator
                </div>
                <div className="h-3 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      reportData.profitMargin >= 20
                        ? 'bg-accent'
                        : reportData.profitMargin >= 10
                        ? 'bg-warning'
                        : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(Math.abs(reportData.profitMargin), 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportData.profitMargin >= 20
                    ? 'Excellent performance'
                    : reportData.profitMargin >= 10
                    ? 'Good performance'
                    : reportData.profitMargin >= 0
                    ? 'Needs improvement'
                    : 'Operating at a loss'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(reportData.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Less: Operating Expenses</span>
                <span className="font-medium">({formatCurrency(reportData.totalExpenses)})</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between font-semibold">
                <span>Net Income</span>
                <span className={reportData.netProfit >= 0 ? 'text-accent' : 'text-destructive'}>
                  {formatCurrency(reportData.netProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </Layout>
  );
};

export default Reports;
