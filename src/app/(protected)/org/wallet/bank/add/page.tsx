"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BankIcon,
  // ShieldCheckIcon,
  InfoIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  PhoneIcon,
  UserIcon,
  WalletIcon,
  IdentificationBadgeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import { SLUGS } from "@/constants/slugs";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { BankAccount } from "@prisma/client";
import { Validator } from "format-utils";
import { toast } from "sonner";
import Link from "next/link";
import { HashIcon } from "@phosphor-icons/react/dist/ssr";

interface BankAccountFormData {
  accNumber: string;
  ifsc: string;
  accName: string;
  accPhone: string;
  vpa?: string;
  isDefault: boolean;
}

interface FormErrors {
  accNumber?: string;
  ifsc?: string;
  accName?: string;
  accPhone?: string;
  vpa?: string;
}

const Page = () => {
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<BankAccountFormData>({
    accNumber: "",
    ifsc: "",
    accName: "",
    accPhone: "",
    vpa: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Auto-fill account name and phone from provider data
  useEffect(() => {
    if (provider) {
      setFormData((prev) => ({
        ...prev,
        accName:
          provider.type === "INDIVIDUAL"
            ? provider.adminName
            : provider.name || "",
        accPhone: provider.phone || "",
      }));
    }
  }, [provider]);

  const handleInputChange = (
    field: keyof BankAccountFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Account number validation
    if (!formData.accNumber.trim()) {
      newErrors.accNumber = "Account number is required";
    } else if (!/^\d{9,18}$/.test(formData.accNumber)) {
      newErrors.accNumber = "Account number must be 9-18 digits";
    }

    // IFSC validation using Validator
    if (!formData.ifsc.trim()) {
      newErrors.ifsc = "IFSC code is required";
    } else if (!Validator.ifsc(formData.ifsc)) {
      newErrors.ifsc = "Invalid IFSC code format";
    }

    // Account name validation
    if (!formData.accName.trim()) {
      newErrors.accName = "Account holder name is required";
    } else if (formData.accName.trim().length < 2) {
      newErrors.accName = "Account holder name must be at least 2 characters";
    }

    // Phone validation
    if (!formData.accPhone.trim()) {
      newErrors.accPhone = "Phone number is required";
    } else if (!Validator.mobile(formData.accPhone)) {
      newErrors.accPhone = "Phone number must be exactly 10 digits";
    }

    // UPI ID validation (completely optional)
    if (
      formData.vpa &&
      formData.vpa.trim() &&
      !Validator.vpa(formData.vpa.trim())
    ) {
      newErrors.vpa = "Invalid UPI ID format (e.g., user@paytm)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !provider?.id) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<APIResponse<BankAccount>>(
        `/api/v1/provider/wallet/bank?providerId=${provider.id}`,
        {
          accNumber: formData.accNumber.trim(),
          ifsc: formData.ifsc.toUpperCase().trim(),
          accName: formData.accName.trim(),
          accPhone: formData.accPhone.trim(),
          vpa:
            formData.vpa && formData.vpa.trim()
              ? formData.vpa.trim()
              : undefined,
          isDefault: formData.isDefault,
        }
      );

      if (response.data.success) {
        toast.success("Bank account added successfully!");
        router.push(`/${SLUGS.PROVIDER}/wallet/bank`);
      } else {
        toast.error(response.data.error || "Failed to add bank account");
      }
    } catch (error: any) {
      console.error("Error adding bank account:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to add bank account. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Add Bank Account
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Add a new bank account to your wallet
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse">Loading...</div>
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
            Add Bank Account
          </h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Add a new bank account to your institution's wallet
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <InfoIcon size={16} className="text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important:</strong> Ensure all bank account details are
            accurate. This information will be used for fund transfers and
            withdrawals.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-muted-foreground/10 rounded-lg">
                  <BankIcon
                    size={20}
                    className="text-blue-600"
                    weight="duotone"
                  />
                </div>
                Bank Account Information
              </CardTitle>
              <CardDescription>
                Enter your bank account details for fund transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="accNumber">
                    Account Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <HashIcon
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="accNumber"
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="Enter account number"
                      value={formData.accNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        handleInputChange("accNumber", value);
                      }}
                      className={cn(
                        "font-mono pl-10",
                        errors.accNumber && "border-destructive"
                      )}
                    />
                  </div>
                  {errors.accNumber && (
                    <p className="text-xs text-destructive">
                      {errors.accNumber}
                    </p>
                  )}
                </div>

                {/* IFSC Code */}
                <div className="space-y-2">
                  <Label htmlFor="ifsc">
                    IFSC Code <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <BankIcon
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="ifsc"
                      type="text"
                      placeholder="Enter IFSC code"
                      value={formData.ifsc}
                      onChange={(e) =>
                        handleInputChange("ifsc", e.target.value.toUpperCase())
                      }
                      maxLength={11}
                      className={cn(
                        "font-mono uppercase pl-10",
                        errors.ifsc && "border-destructive"
                      )}
                    />
                  </div>
                  {errors.ifsc && (
                    <p className="text-xs text-destructive">{errors.ifsc}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="accName">
                    Account Holder Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="accName"
                      type="text"
                      placeholder="Enter account holder name"
                      value={formData.accName}
                      onChange={(e) =>
                        handleInputChange("accName", e.target.value)
                      }
                      className={cn(
                        "font-mono pl-10",
                        errors.accName && "border-destructive"
                      )}
                      disabled
                    />
                  </div>
                  {errors.accName && (
                    <p className="text-xs text-destructive">{errors.accName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Name as registered with the bank
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="accPhone">
                    Registered Phone Number{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <PhoneIcon
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="accPhone"
                      type="tel"
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="Enter phone number"
                      value={formData.accPhone}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleInputChange("accPhone", value);
                      }}
                      maxLength={10}
                      className={cn(
                        "pl-10 font-mono",
                        errors.accPhone && "border-destructive"
                      )}
                    />
                  </div>
                  {errors.accPhone && (
                    <p className="text-xs text-destructive">
                      {errors.accPhone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Phone number registered with the bank
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UPI Details (Completely Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-muted-foreground/10 rounded-lg">
                  <WalletIcon
                    size={20}
                    className="text-purple-600"
                    weight="duotone"
                  />
                </div>
                UPI Information
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  Optional
                </Badge>
              </CardTitle>
              <CardDescription>
                Add UPI ID for digital payments. This is completely optional and
                can be skipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vpa" className="text-muted-foreground">
                  UPI ID / VPA
                </Label>
                <div className="relative">
                  <IdentificationBadgeIcon
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="vpa"
                    type="text"
                    placeholder="Enter UPI ID (e.g., user@paytm) - Optional"
                    value={formData.vpa}
                    onChange={(e) =>
                      handleInputChange("vpa", e.target.value.toLowerCase())
                    }
                    className={cn(
                      "font-mono pl-10",
                      errors.vpa && "border-destructive"
                    )}
                  />
                </div>
                {errors.vpa && (
                  <p className="text-xs text-destructive">{errors.vpa}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty if you don't want to add UPI details. You can add
                  this later.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheckIcon
                    size={20}
                    className="text-green-600"
                    weight="duotone"
                  />
                </div>
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    handleInputChange("isDefault", !!checked)
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="isDefault" className="cursor-pointer">
                    Set as default account
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Default account will be used for automatic fund transfers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button type="button" variant="outline" className="gap-2" asChild>
              <Link href={`/${SLUGS.PROVIDER}/wallet`}>
                <ArrowLeftIcon size={16} />
                Back to Wallet
              </Link>
            </Button>

            <Button type="submit" className="gap-2 flex-1" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                  Adding Account...
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} weight="fill" />
                  Add Bank Account
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Page;
