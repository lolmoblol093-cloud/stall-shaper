import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { paymentsService, tenantsService } from "@/lib/directusService";

interface Tenant {
  id: string;
  business_name: string;
  monthly_rent: number | null;
}

interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
  tenant_name?: string;
}

const PaymentsPage = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    tenant_id: "",
    amount: "",
    payment_date: new Date(),
    payment_method: "cash",
    status: "completed",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsData, tenantsData] = await Promise.all([
        paymentsService.getAll(),
        tenantsService.getAll()
      ]);

      const activeTenants = tenantsData?.filter((t: any) => t.status === "active") || [];
      setTenants(activeTenants);

      // Map tenant names to payments
      const paymentsWithNames = paymentsData?.map((payment: any) => ({
        ...payment,
        tenant_name: tenantsData?.find((t: any) => t.id === payment.tenant_id)?.business_name || "Unknown"
      })) || [];

      setPayments(paymentsWithNames);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const selectedTenant = tenants?.find(t => t.id === tenantId);
    setFormData({
      ...formData,
      tenant_id: tenantId,
      amount: selectedTenant?.monthly_rent?.toString() || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsService.create({
        tenant_id: formData.tenant_id,
        amount: parseFloat(formData.amount),
        payment_date: format(formData.payment_date, "yyyy-MM-dd"),
        payment_method: formData.payment_method,
        status: formData.status,
        notes: formData.notes || null,
      });

      toast({
        title: "Payment recorded",
        description: "Payment has been successfully recorded",
      });

      setIsDialogOpen(false);
      setFormData({
        tenant_id: "",
        amount: "",
        payment_date: new Date(),
        payment_method: "cash",
        status: "completed",
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record payment: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground">Track and manage tenant payments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select
                    value={formData.tenant_id}
                    onValueChange={handleTenantChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.payment_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.payment_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.payment_date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, payment_date: date })
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Optional payment notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full">
                  Record Payment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-lg border border-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading payments...
            </div>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {payment.tenant_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <span className="mr-1">₱</span>
                        {parseFloat(String(payment.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method?.replace("_", " ") || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status || "pending")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <span className="text-4xl text-muted-foreground mb-4 block">₱</span>
              <p className="text-muted-foreground">
                No payments recorded yet. Start by recording your first payment.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;