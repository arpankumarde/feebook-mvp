"use client";

import { useState, useEffect } from "react";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatAmount } from "@/utils/formatAmount";
import {
  DownloadIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DotsThreeIcon,
  ReceiptIcon,
  EyeIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  CurrencyInrIcon,
  FunnelIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  FlagPennantIcon,
  CaretRightIcon,
  CaretLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PaymentStatus, Transaction } from "@prisma/client";

interface PaymentData extends Transaction {
  feePlan: {
    id: string;
    name: string;
    description?: string;
    member: {
      id: string;
      uniqueId: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      phone?: string;
      email?: string;
    };
  };
  order: {
    id: string;
    externalOrderId: string;
  };
}

interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  successfulPayments: number;
  successfulAmount: number;
  pendingPayments: number;
  failedPayments: number;
}

const Page = () => {
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats>({
    totalTransactions: 0,
    totalAmount: 0,
    successfulPayments: 0,
    successfulAmount: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchPayments = async () => {
    if (!provider?.id) return;

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        providerId: provider.id,
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (dateFilter !== "all") {
        const now = new Date();
        switch (dateFilter) {
          case "today":
            params.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            params.endDate = new Date(
              now.setHours(23, 59, 59, 999)
            ).toISOString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            params.startDate = weekAgo.toISOString();
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            params.startDate = monthAgo.toISOString();
            break;
        }
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get("/api/v1/provider/payments", { params });

      if (response.data.success) {
        setPayments(response.data.data.payments);
        setStats(response.data.data.stats);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        throw new Error(response.data.error || "Failed to fetch payments");
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to fetch payments";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && provider?.id) {
      fetchPayments();
    }
  }, [
    provider?.id,
    isAuthLoading,
    currentPage,
    statusFilter,
    dateFilter,
    searchTerm,
  ]);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="gap-1 bg-green-600">
            <CheckCircleIcon size={12} weight="fill" />
            {status}
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircleIcon size={12} weight="fill" />
            {status}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="secondary"
            className="gap-1 border-yellow-500 text-yellow-600"
          >
            <ClockIcon size={12} weight="fill" />
            {status}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircleIcon size={12} weight="fill" />
            {status}
          </Badge>
        );
      case "FLAGGED":
        return (
          <Badge variant="outline" className="gap-1 bg-yellow-800 text-white">
            <FlagPennantIcon size={12} weight="fill" />
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="border-primary/50">
            {status}
          </Badge>
        );
    }
  };

  const getMemberName = (member: PaymentData["feePlan"]["member"]) => {
    return [member.firstName, member.middleName, member.lastName]
      .filter(Boolean)
      .join(" ");
  };

  const handleExportPayments = () => {
    toast.info("Export functionality will be available soon");
  };

  const handleViewReceipt = (paymentId: string) => {
    // Implement receipt viewing logic
    toast.info("Receipt viewing will be available soon");
  };

  if (isAuthLoading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Payments</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              View payments made to your institution
            </p>
          </div>
        </ProviderTopbar>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3">
            <SpinnerGapIcon size={20} className="animate-spin text-primary" />
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Payment Management
          </h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track and manage all payments
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-4 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <WarningCircleIcon size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(stats.successfulAmount)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CurrencyInrIcon
                    size={24}
                    className="text-green-700"
                    weight="bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Successful Payments
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.successfulPayments}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircleIcon
                    size={24}
                    className="text-blue-700"
                    weight="bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingPayments}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ClockIcon
                    size={24}
                    className="text-yellow-700"
                    weight="bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Failed Payments
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failedPayments}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircleIcon
                    size={24}
                    className="text-red-700"
                    weight="bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FunnelIcon size={20} className="text-primary" weight="duotone" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <MagnifyingGlassIcon
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="search"
                    placeholder="Search by member name or payment ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.keys(PaymentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchPayments}
                    disabled={loading}
                    className="gap-2"
                  >
                    <SpinnerGapIcon
                      size={16}
                      className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportPayments}
                    className="gap-2"
                  >
                    <DownloadIcon size={16} />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptIcon
                size={20}
                className="text-primary"
                weight="duotone"
              />
              Payment History
            </CardTitle>
            <CardDescription>
              {stats.totalTransactions} total transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <SpinnerGapIcon
                    size={20}
                    className="animate-spin text-primary"
                  />
                  <span>Loading payments...</span>
                </div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <ReceiptIcon
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                  weight="duotone"
                />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No payments found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Payments will appear here once members start making payments."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Details</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Fee Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {payment.externalPaymentId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                via {payment.paymentGateway}
                              </p>
                              {payment.bankReference && (
                                <p className="text-xs text-muted-foreground">
                                  Ref: {payment.bankReference}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {getMemberName(payment.feePlan.member)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {payment.feePlan.member.uniqueId}
                              </p>
                              {payment.feePlan.member.phone && (
                                <p className="text-xs text-muted-foreground">
                                  +91{payment.feePlan.member.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {payment.feePlan.name}
                              </p>
                              {payment.feePlan.description && (
                                <p className="text-xs text-muted-foreground">
                                  {payment.feePlan.description}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="font-medium">
                              {formatAmount(Number(payment.amount))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.paymentCurrency}
                            </p>
                          </TableCell>

                          <TableCell className="flex gap-2 items-center my-auto h-full">
                            {getStatusBadge(payment.status)}
                            {payment.paymentMessage &&
                              payment.status !== "SUCCESS" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <InfoIcon
                                        size={14}
                                        className="text-muted-foreground"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{payment.paymentMessage}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">
                                {new Date(
                                  payment.paymentTime ?? ""
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  payment.paymentTime ?? ""
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <DotsThreeIcon size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleViewReceipt(payment.id)}
                                  className="gap-2"
                                >
                                  <EyeIcon size={16} />
                                  View Details
                                </DropdownMenuItem>
                                {payment.status === "SUCCESS" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewReceipt(payment.id)
                                    }
                                    className="gap-2"
                                  >
                                    <ReceiptIcon size={16} />
                                    Download Receipt
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1 || loading}
                      >
                        <CaretLeftIcon />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages || loading}
                      >
                        Next <CaretRightIcon />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Page;
