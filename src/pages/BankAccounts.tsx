import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  branch: string | null;
  balance: number;
}

interface BankAccountForm {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch: string;
  balance: string;
}

const BankAccounts = () => {
  const { selectedCompany } = useCompany();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BankAccountForm>({
    account_name: "",
    account_number: "",
    bank_name: "",
    branch: "",
    balance: "0",
  });

  const fetchAccounts = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading bank accounts");
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [selectedCompany]);

  const resetForm = () => {
    setForm({
      account_name: "",
      account_number: "",
      bank_name: "",
      branch: "",
      balance: "0",
    });
    setEditingId(null);
  };

  const handleEdit = (account: BankAccount) => {
    setForm({
      account_name: account.account_name,
      account_number: account.account_number,
      bank_name: account.bank_name,
      branch: account.branch || "",
      balance: account.balance.toString(),
    });
    setEditingId(account.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    const data = {
      ...form,
      balance: parseFloat(form.balance),
      company_id: selectedCompany.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from("bank_accounts")
        .update(data)
        .eq("id", editingId);

      if (error) {
        toast.error("Error updating bank account");
        return;
      }
      toast.success("Bank account updated successfully");
    } else {
      const { error } = await supabase
        .from("bank_accounts")
        .insert([data]);

      if (error) {
        toast.error("Error creating bank account");
        return;
      }
      toast.success("Bank account created successfully");
    }

    setOpen(false);
    resetForm();
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) {
      return;
    }

    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting bank account");
      return;
    }

    toast.success("Bank account deleted successfully");
    fetchAccounts();
  };

  if (!selectedCompany) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Please select a company first</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage bank accounts for {selectedCompany.name}</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Create"} Bank Account</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update" : "Add"} bank account information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name *</Label>
                  <Input
                    id="account_name"
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name *</Label>
                  <Input
                    id="bank_name"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Opening Balance *</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Create"} Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>All bank accounts for {selectedCompany.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bank accounts found. Create your first one!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell>{account.account_number}</TableCell>
                      <TableCell>{account.bank_name}</TableCell>
                      <TableCell>{account.branch || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(account.balance))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BankAccounts;
