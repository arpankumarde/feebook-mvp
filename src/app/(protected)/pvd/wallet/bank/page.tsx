"use client";

import { useEffect, useState } from "react";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BankIcon,
  PlusIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  StarIcon,
  DotsThreeIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { BankAccount, VerificationStatus } from "@prisma/client";
import { SLUGS } from "@/constants/slugs";
import Link from "next/link";
import { toast } from "sonner";

const Page = () => {
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider?.id) {
      if (!isAuthLoading) {
        setError("Provider not found");
        setLoading(false);
      }
      return;
    }

    const fetchBankAccounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<APIResponse<BankAccount[]>>(
          `/api/v1/provider/wallet/bank?providerId=${provider.id}`
        );

        if (data.success && data.data) {
          setBankAccounts(data.data);
        } else {
          throw new Error(data.error || "Failed to fetch bank accounts");
        }
      } catch (err: any) {
        console.error("Error fetching bank accounts:", err);
        setError(err.response?.data?.error || "Failed to load bank accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();
  }, [provider?.id, isAuthLoading]);

  const getVerificationBadge = (status: VerificationStatus) => {
    const statusConfig = {
      VERIFIED: {
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700",
        icon: CheckCircleIcon,
        label: "Verified",
      },
      PROCESSING: {
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: ClockIcon,
        label: "Processing",
      },
      PENDING: {
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: ClockIcon,
        label: "Pending",
      },
      REJECTED: {
        variant: "destructive" as const,
        className: "",
        icon: XCircleIcon,
        label: "Rejected",
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

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return "•••• " + accountNumber.slice(-4);
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      toast.info("Setting as default account...");

      const response = await api.patch<APIResponse<BankAccount>>(
        `/api/v1/provider/wallet/bank`,
        {
          providerId: provider?.id,
          bankAccountId: accountId,
        }
      );
      if (response.data.success && response.data.data) {
        setBankAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId
              ? { ...acc, isDefault: true }
              : { ...acc, isDefault: false }
          )
        );
        toast.success("Bank account set as default successfully");
      } else {
        throw new Error(response.data.error || "Failed to set as default");
      }
    } catch (error) {
      toast.error("Failed to set as default account");
    }
  };

  if (isAuthLoading || loading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Bank Accounts</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your bank accounts
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-muted-foreground">
              Loading bank accounts...
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Bank Accounts</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your bank accounts for fund transfers
            </p>
          </div>

          <Button className="gap-2 max-md:hidden" asChild>
            <Link href={`/${SLUGS.PROVIDER}/wallet/bank/add`}>
              <PlusIcon size={16} weight="bold" />
              Add Bank Account
            </Link>
          </Button>
        </div>
      </ProviderTopbar>

      <div className="p-4 space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <ShieldCheckIcon size={16} className="text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Secure Banking:</strong> Your bank account details are
            encrypted and stored securely. Default account will be used for
            automatic fund transfers.
          </AlertDescription>
        </Alert>

        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <BankIcon size={32} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
              <p className="text-muted-foreground mb-6">
                Add your first bank account to start receiving fund transfers
                from your wallet.
              </p>
              <Button className="gap-2" asChild>
                <Link href={`/${SLUGS.PROVIDER}/wallet/bank/add`}>
                  <PlusIcon size={16} weight="bold" />
                  Add Bank Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bankAccounts.map((account) => (
              <Card
                key={account.id}
                className={`transition-all hover:shadow-md ${
                  account.isDefault
                    ? "border-green-200 bg-green-50/30"
                    : "border-gray-200"
                }`}
              >
                <CardContent>
                  <div className="flex items-center justify-between">
                    {/* Left side - Bank info */}
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted-foreground/10 rounded-lg">
                        <BankIcon
                          size={24}
                          className="text-primary"
                          weight="duotone"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {account.bankName || "Bank Account"}
                            </h3>
                            {account.isDefault && (
                              <Badge
                                variant="default"
                                className="gap-1 bg-green-600"
                              >
                                <StarIcon size={12} weight="fill" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {account.branchName || "Branch"}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              Account Number
                            </p>
                            <p className="font-mono text-sm font-medium">
                              {maskAccountNumber(account.accNumber)}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              IFSC Code
                            </p>
                            <p className="font-mono text-sm font-medium">
                              {account.ifsc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status and actions */}
                    <div className="flex items-center gap-3">
                      {getVerificationBadge(account.verificationStatus)}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <DotsThreeIcon size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!account.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(account.id)}
                            >
                              <StarIcon size={14} className="mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <TrashIcon size={14} className="mr-2" />
                            Remove Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Account CTA */}
        {bankAccounts.length > 0 && (
          <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <PlusIcon size={24} className="text-primary" weight="bold" />
              </div>
              <h3 className="font-semibold mb-2">Add Another Bank Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add multiple bank accounts for flexible fund management
              </p>
              <Button variant="outline" className="gap-2" asChild>
                <Link href={`/${SLUGS.PROVIDER}/wallet/bank/add`}>
                  <PlusIcon size={16} />
                  Add Bank Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default Page;
