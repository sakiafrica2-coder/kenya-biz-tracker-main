import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total: number;
  paid_amount: number;
}

const Invoices = () => {
  const { selectedCompany } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    invoice_number: "",
    customer_name: "",
    customer_contact: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    subtotal: "",
    tax: "",
    notes: ""
  });

  useEffect(() => {
    fetchInvoices();
  }, [selectedCompany]);

  const fetchInvoices = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading invoices");
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    const subtotal = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || 0;
    const total = subtotal + tax;

    const { error } = await supabase
      .from("invoices")
      .insert([{
        ...form,
        company_id: selectedCompany.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        subtotal,
        tax,
        total,
        paid_amount: 0,
        items: [],
        status: "pending"
      }]);

    if (error) {
      toast.error("Error creating invoice");
      return;
    }

    toast.success("Invoice created successfully");
    setOpen(false);
    setForm({
      invoice_number: "",
      customer_name: "",
      customer_contact: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: "",
      subtotal: "",
      tax: "",
      notes: ""
    });
    fetchInvoices();
  };

  const exportToPDF = () => {
    if (invoices.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Invoices', 14, 15);
        doc.setFontSize(10);
        doc.text(`${selectedCompany?.name || ''}`, 14, 22);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);
        
        (autoTable as any).default(doc, {
          startY: 32,
          head: [['Invoice #', 'Customer', 'Date', 'Due Date', 'Status', 'Total', 'Paid']],
          body: invoices.map(invoice => [
            invoice.invoice_number,
            invoice.customer_name,
            new Date(invoice.invoice_date).toLocaleDateString(),
            new Date(invoice.due_date).toLocaleDateString(),
            invoice.status,
            formatCurrency(invoice.total),
            formatCurrency(invoice.paid_amount)
          ])
        });
        
        doc.save(`Invoices_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("PDF exported successfully");
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-success";
      case "partial": return "bg-warning";
      case "overdue": return "bg-destructive";
      case "cancelled": return "bg-muted";
      default: return "bg-info";
    }
  };

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
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage your invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>Add new invoice details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Invoice Number *</Label>
                    <Input
                      id="invoice_number"
                      value={form.invoice_number}
                      onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_contact">Customer Contact</Label>
                  <Input
                    id="customer_contact"
                    value={form.customer_contact}
                    onChange={(e) => setForm({ ...form, customer_contact: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={form.invoice_date}
                      onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subtotal">Subtotal *</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      value={form.subtotal}
                      onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={form.tax}
                      onChange={(e) => setForm({ ...form, tax: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">Create Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No invoices found. Create your first one!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(invoice.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(invoice.paid_amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
      )}
    </Layout>
  );
};

export default Invoices;
