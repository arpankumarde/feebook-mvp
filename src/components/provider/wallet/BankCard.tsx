"use client";

import { useEffect, useState } from "react";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BankIcon,
  PlusIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  InfoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { BankAccount, VerificationStatus } from "@prisma/client";
import { APIResponse } from "@/types/common";
import { SLUGS } from "@/constants/slugs";
import api from "@/lib/api";
import Link from "next/link";

const BankCard = () => {
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const [defaultBankAccount, setDefaultBankAccount] =
    useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefaultBankAccount = async () => {
      if (!provider?.id) {
        if (!isAuthLoading) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<APIResponse<BankAccount[]>>(
          `/api/v1/provider/wallet/bank?providerId=${provider.id}&default=true`
        );

        if (data.success && data.data) {
          // Get the first (default) bank account or null if none exists
          setDefaultBankAccount(data.data[0] || null);
        } else {
          throw new Error(data.error || "Failed to fetch bank account");
        }
      } catch (err: any) {
        console.error("Error fetching default bank account:", err);
        setError(err.response?.data?.error || "Failed to load bank account");
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultBankAccount();
  }, [provider?.id, isAuthLoading]);

  const getVerificationBadge = (status: VerificationStatus) => {
    const statusConfig = {
      VERIFIED: {
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700 text-white",
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

  if (isAuthLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BankIcon size={20} className="text-primary" weight="duotone" />
            Default Bank Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading bank account...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BankIcon size={20} className="text-primary" weight="duotone" />
            Bank Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${SLUGS.PROVIDER}/wallet/bank/add`}>
                <PlusIcon size={14} className="mr-1" />
                Add Bank Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!defaultBankAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BankIcon size={20} className="text-primary" weight="duotone" />
            Bank Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <BankIcon size={24} className="text-blue-600" weight="duotone" />
            </div>
            <h3 className="font-medium mb-2">No Bank Account Added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your bank account to receive fund transfers from your wallet.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="gap-2" asChild>
                <Link href={`/${SLUGS.PROVIDER}/wallet/bank/add`}>
                  <PlusIcon size={16} weight="bold" />
                  Add Bank Account
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BankIcon size={20} className="text-primary" weight="duotone" />
            Bank Account
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 bg-green-600">
              <StarIcon size={12} weight="fill" />
              Default
            </Badge>
            {getVerificationBadge(defaultBankAccount.verificationStatus)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Bank Name</span>
            <span className="font-mono text-sm font-medium">
              {defaultBankAccount.bankName || "Not Available"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Account Number
            </span>
            <span className="font-mono text-sm font-medium">
              {maskAccountNumber(defaultBankAccount.accNumber)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IFSC Code</span>
            <span className="font-mono text-sm font-medium">
              {defaultBankAccount.ifsc}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button className="gap-2" asChild>
            <Link href={`/${SLUGS.PROVIDER}/wallet/bank`}>
              <BankIcon size={16} />
              View All Accounts
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/${SLUGS.PROVIDER}/wallet/bank/add`}>
              <PlusIcon size={16} />
              Add Account
            </Link>
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default BankCard;
