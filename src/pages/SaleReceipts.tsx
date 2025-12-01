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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SaleReceipt {
  id: string;
  receipt_number: string;
  customer_name: string;
  sale_date: string;
  payment_method: string;
  total: number;
}

const SaleReceipts = () => {
  const { selectedCompany } = useCompany();
  const [receipts, setReceipts] = useState<SaleReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    receipt_number: "",
    customer_name: "",
    sale_date: new Date().toISOString().split('T')[0],
    payment_method: "cash",
    subtotal: "",
    tax: "",
    notes: ""
  });

  useEffect(() => {
    fetchReceipts();
  }, [selectedCompany]);

  const fetchReceipts = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("sale_receipts")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading sale receipts");
    } else {
      setReceipts(data || []);
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
      .from("sale_receipts")
      .insert([{
        ...form,
        company_id: selectedCompany.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        subtotal,
        tax,
        total,
        items: []
      }]);

    if (error) {
      toast.error("Error creating sale receipt");
      return;
    }

    toast.success("Sale receipt created successfully");
    setOpen(false);
    setForm({
      receipt_number: "",
      customer_name: "",
      sale_date: new Date().toISOString().split('T')[0],
      payment_method: "cash",
      subtotal: "",
      tax: "",
      notes: ""
    });
    fetchReceipts();
  };

  const exportToPDF = () => {
    if (receipts.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Sale Receipts', 14, 15);
        doc.setFontSize(10);
        doc.text(`${selectedCompany?.name || ''}`, 14, 22);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);
        
        (autoTable as any).default(doc, {
          startY: 32,
          head: [['Receipt #', 'Customer', 'Date', 'Payment Method', 'Total']],
          body: receipts.map(receipt => [
            receipt.receipt_number,
            receipt.customer_name,
            new Date(receipt.sale_date).toLocaleDateString(),
            receipt.payment_method,
            formatCurrency(receipt.total)
          ])
        });
        
        doc.save(`Sale_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("PDF exported successfully");
      });
    });
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "mpesa": return "bg-accent";
      case "cash": return "bg-success";
      case "card": return "bg-info";
      default: return "bg-muted";
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
            <h1 className="text-3xl font-bold">Sale Receipts</h1>
            <p className="text-muted-foreground">Record your sales</p>
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
                New Sale Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Sale Receipt</DialogTitle>
                <DialogDescription>Add new sale receipt details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt_number">Receipt Number *</Label>
                    <Input
                      id="receipt_number"
                      value={form.receipt_number}
                      onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_date">Sale Date *</Label>
                    <Input
                      id="sale_date"
                      type="date"
                      value={form.sale_date}
                      onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method *</Label>
                    <Select
                      value={form.payment_method}
                      onValueChange={(value) => setForm({ ...form, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
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
                <Button type="submit" className="w-full">Create Sale Receipt</Button>
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
            ) : receipts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No sale receipts found. Create your first one!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                      <TableCell>{receipt.customer_name}</TableCell>
                      <TableCell>{new Date(receipt.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(receipt.payment_method)}>
                          {receipt.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(receipt.total))}
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

export default SaleReceipts;
