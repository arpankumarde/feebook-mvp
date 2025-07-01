"use client";

import { useState, useEffect } from "react";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SpinnerGapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  CalendarIcon,
  CurrencyInrIcon,
  UserIcon,
  BuildingOfficeIcon,
  ReceiptIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  WarningIcon,
  InfoIcon,
  CopyIcon,
  BankIcon,
} from "@phosphor-icons/react/dist/ssr";
import api from "@/lib/api";
import { toast } from "sonner";
import { PaymentStatus } from "@prisma/client";
import { formatAmount } from "@/utils/formatAmount";

interface PaymentHistoryItem {
  id: string;
  externalPaymentId: string | null;
  amount: number;
  status: PaymentStatus;
  paymentTime: string | null;
  paymentCurrency: string;
  paymentMessage: string | null;
  bankReference: string | null;
  paymentMethod: any;
  paymentGroup: string | null;
  paymentGateway: string;
  feePlan: {
    id: string;
    name: string;
    description: string | null;
    member: {
      id: string;
      uniqueId: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      provider: {
        id: string;
        name: string;
        category: string;
        type: string;
      };
    };
  } | null;
  order: {
    id: string;
    externalOrderId: string;
    orderTags: any;
  } | null;
  createdAt: string;
}

interface PaymentHistoryData {
  transactions: PaymentHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalTransactions: number;
    totalAmount: number;
    successfulPayments: number;
    successfulAmount: number;
  };
}

const PaymentHistoryPage = () => {
  const { consumer } = useConsumerAuth();
  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchPaymentHistory = async (page: number = 1) => {
    if (!consumer?.id) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        consumerId: consumer.id,
        page: page.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }

      const response = await api.get(
        `/api/v1/consumer/payment-history?${params}`
      );

      if (response.data.success) {
        setPaymentHistory(response.data.data);
      } else {
        throw new Error(
          response.data.error || "Failed to fetch payment history"
        );
      }
    } catch (err: any) {
      console.error("Error fetching payment history:", err);
      setError(err.response?.data?.error || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory(1);
    setCurrentPage(1);
  }, [consumer?.id, statusFilter, startDate, endDate]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPaymentHistory(page);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      SUCCESS: {
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700",
        icon: CheckCircleIcon,
        label: "Success",
      },
      FAILED: {
        variant: "destructive" as const,
        className: "",
        icon: XCircleIcon,
        label: "Failed",
      },
      PENDING: {
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: ClockIcon,
        label: "Pending",
      },
      USER_DROPPED: {
        variant: "outline" as const,
        className: "border-orange-200 text-orange-700",
        icon: WarningIcon,
        label: "Dropped",
      },
      CANCELLED: {
        variant: "outline" as const,
        className: "border-gray-200 text-gray-700",
        icon: XCircleIcon,
        label: "Cancelled",
      },
      NOT_ATTEMPTED: {
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: InfoIcon,
        label: "Not Attempted",
      },
      FLAGGED: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-200",
        icon: WarningIcon,
        label: "Flagged",
      },
      VOID: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XCircleIcon,
        label: "Void",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <IconComponent size={12} weight="fill" />
        {config.label}
      </Badge>
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getMemberName = (
    member: NonNullable<PaymentHistoryItem["feePlan"]>["member"]
  ) => {
    if (!member) return "N/A";
    return [member.firstName, member.middleName, member.lastName]
      .filter(Boolean)
      .join(" ");
  };

  const filteredTransactions =
    paymentHistory?.transactions.filter((transaction) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const memberName = transaction.feePlan
        ? getMemberName(transaction.feePlan.member)
        : "";
      const providerName = transaction.feePlan?.member.provider.name || "";
      const feePlanName = transaction.feePlan?.name || "";

      return (
        memberName.toLowerCase().includes(searchLower) ||
        providerName.toLowerCase().includes(searchLower) ||
        feePlanName.toLowerCase().includes(searchLower) ||
        transaction.externalPaymentId?.toLowerCase().includes(searchLower) ||
        transaction.bankReference?.toLowerCase().includes(searchLower)
      );
    }) || [];

  if (loading) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Payment History
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              View your payment transactions
            </p>
          </div>
        </ConsumerTopbar>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3">
            <SpinnerGapIcon size={24} className="animate-spin text-primary" />
            <span className="font-medium">Loading payment history...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Payment History</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            View your payment transactions
          </p>
        </div>
      </ConsumerTopbar>

      <div className="p-4 space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {paymentHistory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <ReceiptIcon
                      size={20}
                      className="text-blue-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold">
                      {paymentHistory.summary.totalTransactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircleIcon
                      size={20}
                      className="text-green-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Successful Payments
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {paymentHistory.summary.successfulPayments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <CurrencyInrIcon
                      size={20}
                      className="text-purple-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold">
                      {formatAmount(paymentHistory.summary.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <BankIcon
                      size={20}
                      className="text-emerald-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Paid Amount
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatAmount(paymentHistory.summary.successfulAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FunnelIcon size={20} />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <MagnifyingGlassIcon
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="USER_DROPPED">User Dropped</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ReceiptIcon size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Transactions Found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || startDate || endDate
                  ? "No transactions match your current filters."
                  : "You haven't made any payments yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Transaction Info */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {transaction.feePlan?.name || "Payment"}
                          </h3>
                          {transaction.feePlan?.description && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.feePlan.description}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>

                      {transaction.feePlan && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <UserIcon
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span>
                              {getMemberName(transaction.feePlan.member)}
                            </span>
                            <span className="text-muted-foreground">
                              (ID: {transaction.feePlan.member.uniqueId})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BuildingOfficeIcon
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span>
                              {transaction.feePlan.member.provider.name}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={14} />
                          {transaction.paymentTime ? (
                            <span>
                              {new Date(
                                transaction.paymentTime
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                              <span className="mx-1 text-muted-foreground">
                                |
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(
                                  transaction.paymentTime
                                ).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </span>
                          ) : (
                            <span>
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCardIcon size={14} />
                          {transaction.paymentGateway}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Details */}
                    <div className="lg:col-span-3 space-y-3">
                      <div className="text-right lg:text-left">
                        <p className="text-2xl font-bold">
                          {formatAmount(transaction.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.paymentCurrency}
                        </p>
                      </div>

                      {transaction.paymentMethod && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Payment Method:
                          </p>
                          <p className="font-medium capitalize">
                            {transaction.paymentGroup ||
                              Object.keys(transaction.paymentMethod)[0] ||
                              "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Transaction IDs */}
                    <div className="lg:col-span-3 space-y-2">
                      {transaction.externalPaymentId && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Payment ID:
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">
                              {transaction.externalPaymentId}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  transaction.externalPaymentId!,
                                  "Payment ID"
                                )
                              }
                            >
                              <CopyIcon size={12} />
                            </Button>
                          </div>
                        </div>
                      )}

                      {transaction.bankReference && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Bank Ref:
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">
                              {transaction.bankReference}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  transaction.bankReference!,
                                  "Bank Reference"
                                )
                              }
                            >
                              <CopyIcon size={12} />
                            </Button>
                          </div>
                        </div>
                      )}

                      {transaction.paymentMessage && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Message:</p>
                          <p className="text-xs">
                            {transaction.paymentMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {paymentHistory && paymentHistory.pagination.totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {(currentPage - 1) * paymentHistory.pagination.limit + 1} to{" "}
                  {Math.min(
                    currentPage * paymentHistory.pagination.limit,
                    paymentHistory.pagination.totalCount
                  )}{" "}
                  of {paymentHistory.pagination.totalCount} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paymentHistory.pagination.hasPrevPage}
                  >
                    <ArrowLeftIcon size={16} />
                    Previous
                  </Button>
                  <span className="text-sm font-medium px-2">
                    Page {currentPage} of {paymentHistory.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paymentHistory.pagination.hasNextPage}
                  >
                    Next
                    <ArrowRightIcon size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default PaymentHistoryPage;
