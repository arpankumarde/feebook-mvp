"use client";

import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import api from "@/lib/api";
import { AccountCategory, AccountType, Provider } from "@prisma/client";
import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { setProviderCookie } from "@/lib/auth-utils";
import { APIResponse } from "@/types/common";
import { REGIONS } from "@/data/common/regions";

const Page = () => {
  const { provider } = useProviderAuth();
  const [data, setData] = useState<Provider | null>(provider);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setData(provider);
  }, [provider]);

  const handleInputChange = (
    field: keyof Provider,
    value: string | AccountType | AccountCategory | null
  ) => {
    if (!data) return;

    setData((prev) => ({
      ...prev!,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const updateProfile = async () => {
    if (!data || !provider?.code) return;
    setIsLoading(true);

    try {
      const { data: newdata } = await api.post<APIResponse<Provider>>(
        `/api/v1/provider/by-code/${provider.code}`,
        {
          name: data.name,
          type: data.type,
          city: data.city,
          region: data.region,
          category: data.category,
        }
      );

      if (newdata?.data) setProviderCookie(newdata?.data);

      toast.success("Your profile has been successfully updated");

      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your institution{`'`}s profile here.
            </p>
          </div>
        </ProviderTopbar>
        <div className="p-2 sm:p-4 flex items-center justify-center">
          <CircleNotchIcon className="h-6 w-6 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your institution{`'`}s profile here.
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-2 sm:p-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Institution Information</CardTitle>
            <CardDescription>
              Update your institution's basic information and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Institution Code</Label>
              <Input
                id="code"
                value={data.code}
                readOnly
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                This is your unique institution code and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Institution Name *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter institution name"
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Account Type *</Label>
                <Select
                  value={data.type}
                  onValueChange={(value) =>
                    handleInputChange("type", value as AccountType)
                  }
                >
                  <SelectTrigger className="min-w-64">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AccountType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Account Category *</Label>
                <Select
                  value={data.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value as AccountCategory)
                  }
                >
                  <SelectTrigger className="min-w-64">
                    <SelectValue placeholder="Select account category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AccountCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={data.city || ""}
                  onChange={(e) =>
                    handleInputChange("city", e.target.value || null)
                  }
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region/State</Label>
                <Select
                  value={data.region || ""}
                  onValueChange={(value) =>
                    handleInputChange("region", value as string)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(REGIONS).map((reg) => (
                      <SelectItem key={reg?.code} value={reg.code}>
                        {reg.name
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={updateProfile}
                disabled={!hasChanges || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <CircleNotchIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon weight="fill" className="h-4 w-4" />
                )}
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setData(provider);
                  setHasChanges(false);
                }}
                disabled={!hasChanges || isLoading}
              >
                Cancel Changes
              </Button>
            </div>

            {hasChanges && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                You have unsaved changes. Make sure to save your changes before
                leaving this page.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Page;
