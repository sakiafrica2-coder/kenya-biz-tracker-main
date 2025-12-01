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

interface SalesOrder {
  id: string;
  so_number: string;
  customer_name: string;
  order_date: string;
  status: string;
  total: number;
}

const SalesOrders = () => {
  const { selectedCompany } = useCompany();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    so_number: "",
    customer_name: "",
    customer_contact: "",
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: "",
    subtotal: "",
    tax: "",
    notes: ""
  });

  useEffect(() => {
    fetchOrders();
  }, [selectedCompany]);

  const fetchOrders = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("sales_orders")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading sales orders");
    } else {
      setOrders(data || []);
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
      .from("sales_orders")
      .insert([{
        ...form,
        company_id: selectedCompany.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        subtotal,
        tax,
        total,
        items: [],
        status: "pending"
      }]);

    if (error) {
      toast.error("Error creating sales order");
      return;
    }

    toast.success("Sales order created successfully");
    setOpen(false);
    setForm({
      so_number: "",
      customer_name: "",
      customer_contact: "",
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: "",
      subtotal: "",
      tax: "",
      notes: ""
    });
    fetchOrders();
  };

  const exportToPDF = () => {
    if (orders.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Sales Orders', 14, 15);
        doc.setFontSize(10);
        doc.text(`${selectedCompany?.name || ''}`, 14, 22);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);
        
        (autoTable as any).default(doc, {
          startY: 32,
          head: [['SO #', 'Customer', 'Date', 'Status', 'Total']],
          body: orders.map(order => [
            order.so_number,
            order.customer_name,
            new Date(order.order_date).toLocaleDateString(),
            order.status,
            formatCurrency(order.total)
          ])
        });
        
        doc.save(`Sales_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("PDF exported successfully");
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-info";
      case "shipped": return "bg-warning";
      case "delivered": return "bg-success";
      case "cancelled": return "bg-destructive";
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
            <h1 className="text-3xl font-bold">Sales Orders</h1>
            <p className="text-muted-foreground">Track your sales orders</p>
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
                New Sales Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Sales Order</DialogTitle>
                <DialogDescription>Add new sales order details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="so_number">SO Number *</Label>
                    <Input
                      id="so_number"
                      value={form.so_number}
                      onChange={(e) => setForm({ ...form, so_number: e.target.value })}
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
                    <Label htmlFor="order_date">Order Date *</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={form.order_date}
                      onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_date">Delivery Date</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={form.delivery_date}
                      onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
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
                <Button type="submit" className="w-full">Create Sales Order</Button>
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
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No sales orders found. Create your first one!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.so_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(order.total))}
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

export default SalesOrders;
