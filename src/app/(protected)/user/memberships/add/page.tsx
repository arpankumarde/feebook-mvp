"use client";

import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
import { toast } from "sonner";
import { SLUGS } from "@/constants/slugs";
import { REGIONS } from "@/data/common/regions";
import { AccountCategory, FeePlan, Member, Provider } from "@prisma/client";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  SpinnerGapIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  GraduationCapIcon,
  BarbellIcon,
  UsersThreeIcon,
  StorefrontIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { APIResponse } from "@/types/common";

interface ProviderSearchResult {
  id: string;
  name: string;
  code: string;
  category: AccountCategory;
  region: string;
  type: string;
  city: string;
  country: string;
}

interface MemberDetails {
  id: string;
  uniqueId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  category?: string;
  subcategory?: string;
  provider: {
    name: string;
    category: string;
  };
}

interface ClaimMembershipResponse {
  id: string;
  member: Member & { provider?: Provider } & { feePlans?: FeePlan[] };
  claimedAt: Date;
  pendingFeePlans?: number;
}

type Step = "category" | "region" | "provider" | "member" | "review";

const CATEGORY_OPTIONS = [
  {
    value: "EDUCATIONAL" as AccountCategory,
    label: "Schools",
    description: "K-12 education institutions",
    icon: <GraduationCapIcon size={24} weight="duotone" />,
  },
  {
    value: "HIGHER_EDUCATION" as AccountCategory,
    label: "Colleges & Universities",
    description: "Higher education institutions",
    icon: <GraduationCapIcon size={24} weight="duotone" />,
  },
  {
    value: "COACHING" as AccountCategory,
    label: "Coaching & Test Prep",
    description: "Exam preparation & tutoring",
    icon: <UsersThreeIcon size={24} weight="duotone" />,
  },
  {
    value: "FITNESS_SPORTS" as AccountCategory,
    label: "Fitness & Sports",
    description: "Physical training & activities",
    icon: <BarbellIcon size={24} weight="duotone" />,
  },
  {
    value: "OTHER" as AccountCategory,
    label: "Other Institutions",
    description: "Other institutions or organizations",
    icon: <StorefrontIcon size={24} weight="duotone" />,
  },
];

const AddMembershipPage = () => {
  const { consumer } = useConsumerAuth();
  const router = useRouter();

  // Form state
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] =
    useState<AccountCategory | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [providerSearch, setProviderSearch] = useState<string>("");
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderSearchResult | null>(null);
  const [memberUniqueId, setMemberUniqueId] = useState<string>("");
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(
    null
  );

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ProviderSearchResult[]>(
    []
  );

  // Search providers when search term changes
  useEffect(() => {
    const searchProviders = async () => {
      if (!selectedCategory || !selectedRegion || !providerSearch.trim()) {
        setSearchResults([]);
        return;
      }

      if (providerSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await api.get("/api/v1/provider/search", {
          params: {
            category: selectedCategory,
            region: selectedRegion,
            search: providerSearch.trim(),
            limit: 10,
          },
        });

        if (response.data.success) {
          setSearchResults(response.data.data.providers || []);
        }
      } catch (err) {
        console.error("Error searching providers:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProviders, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, selectedRegion, providerSearch]);

  // Fetch member details
  const fetchMemberDetails = async () => {
    if (!selectedProvider || !memberUniqueId.trim()) return;

    try {
      setMemberLoading(true);
      setError(null);

      const response = await api.get("/api/v1/provider/member/by-uniqueid", {
        params: {
          providerId: selectedProvider.id,
          uniqueId: memberUniqueId.trim().toUpperCase(),
        },
      });

      setMemberDetails(response.data.member);
      setStep("review");
    } catch (err: any) {
      setError(err.response?.data?.message || "Member not found");
      setMemberDetails(null);
    } finally {
      setMemberLoading(false);
    }
  };

  // Submit membership claim
  const handleSubmitMembership = async () => {
    if (!consumer?.id || !selectedProvider || !memberDetails) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post<APIResponse<ClaimMembershipResponse>>(
        "/api/v1/consumer/claim-membership",
        {
          consumerId: consumer.id,
          providerId: selectedProvider.id,
          memberUniqueId: memberDetails.uniqueId,
        }
      );

      if (response.data.success) {
        toast.success("Membership linked successfully!");
        router.push(
          `/${SLUGS.CONSUMER}/memberships/${response?.data?.data?.id}/schedule`
        );
      } else {
        throw new Error(response.data.error || "Failed to link membership");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to link membership";
      setError(errorMessage);
      // if status code is 409, it means membership already exists
      if (err.response?.status === 409) {
        toast.error("Membership already exists. Redirecting...");
        const existingMembership = err.response.data.data;
        setTimeout(() => {
          router.push(
            `/${SLUGS.CONSUMER}/memberships/${existingMembership.membershipId}/schedule`
          );
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "category":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose a Category</CardTitle>
              <CardDescription>
                Select what you{`'`}re looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCategory === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedCategory(option.value)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-primary">{option.icon}</div>
                      <h3 className="font-semibold">{option.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep("region")}
                  disabled={!selectedCategory}
                  className="gap-2"
                >
                  Continue
                  <ArrowRightIcon size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "region":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon size={20} className="text-primary" />
                Select State
              </CardTitle>
              <CardDescription>
                Choose your state to find nearby institutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region">State</Label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger className="w-full !h-12">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep("category")}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("provider")}
                  disabled={!selectedRegion}
                  className="gap-2"
                >
                  Continue
                  <ArrowRightIcon size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "provider":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingOfficeIcon size={20} className="text-primary" />
                Find Your Institution
              </CardTitle>
              <CardDescription>
                Search and select your institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider-search">Institution Name</Label>
                <div className="relative">
                  <MagnifyingGlassIcon
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="provider-search"
                    placeholder="Type institution name..."
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    className="pl-10"
                  />
                  {searchLoading && (
                    <SpinnerGapIcon
                      size={16}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-muted-foreground"
                    />
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedProvider?.id === provider.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Address: {provider.city}, {provider.region},{" "}
                            {provider.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Provider Preview */}
              {selectedProvider && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Institution</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon size={16} />
                      <span>{selectedProvider.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon size={16} />
                      <span>
                        Address: {selectedProvider?.city},{" "}
                        {selectedProvider?.region}, {selectedProvider?.country}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep("region")}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("member")}
                  disabled={!selectedProvider}
                  className="gap-2"
                >
                  Continue
                  <ArrowRightIcon size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "member":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size={20} className="text-primary" />
                Enter Member ID
              </CardTitle>
              <CardDescription>
                {selectedProvider?.name} - Enter your member ID to verify your
                membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-id">Member ID</Label>
                <Input
                  id="member-id"
                  placeholder="Enter your member ID"
                  value={memberUniqueId}
                  onChange={(e) => setMemberUniqueId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The unique ID provided by your institution
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <WarningIcon size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep("provider")}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button
                  onClick={fetchMemberDetails}
                  disabled={!memberUniqueId.trim() || memberLoading}
                  className="gap-2"
                >
                  {memberLoading ? (
                    <SpinnerGapIcon size={16} className="animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon size={16} />
                  )}
                  Fetch Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "review":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon size={20} className="text-primary" />
                Review & Confirm
              </CardTitle>
              <CardDescription>
                Please review the details before linking your membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Member Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Member Details</h4>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span>
                      {[
                        memberDetails?.firstName,
                        memberDetails?.middleName,
                        memberDetails?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member ID:</span>
                    <span>{memberDetails?.uniqueId}</span>
                  </div>
                  {memberDetails?.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category:</span>
                      <span>
                        {memberDetails.category}
                        {memberDetails.subcategory &&
                          ` - ${memberDetails.subcategory}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Institution Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Institution Details</h4>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span>{selectedProvider?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Address:</span>
                    <span>
                      {selectedProvider?.city}, {selectedProvider?.region},{" "}
                      {selectedProvider?.country}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <WarningIcon size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep("member")}
                  className="gap-2"
                  disabled={loading}
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button onClick={handleSubmitMembership} disabled={loading}>
                  {loading ? (
                    <SpinnerGapIcon size={16} className="animate-spin" />
                  ) : (
                    <CheckCircleIcon size={16} weight="fill" />
                  )}
                  Add Membership
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "category":
        return "Step 1: Choose Category";
      case "region":
        return "Step 2: Select State";
      case "provider":
        return "Step 3: Find Institution";
      case "member":
        return "Step 4: Enter Student ID";
      case "review":
        return "Step 5: Review & Confirm";
      default:
        return "";
    }
  };

  return (
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Add Membership</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Link your membership to pay fees
          </p>
        </div>
      </ConsumerTopbar>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Progress Indicator */}
        <div className="text-center">
          <h2 className="text-lg font-medium mb-4">{getStepTitle()}</h2>
          <div className="flex items-center justify-center gap-2">
            {["category", "region", "provider", "member", "review"].map(
              (stepName, index) => {
                const isCompleted =
                  (stepName === "category" && selectedCategory) ||
                  (stepName === "region" && selectedRegion) ||
                  (stepName === "provider" && selectedProvider) ||
                  (stepName === "member" && memberDetails) ||
                  (stepName === "review" && step === "review");
                const isCurrent = step === stepName;

                return (
                  <div key={stepName} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon size={16} weight="fill" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 4 && (
                      <div
                        className={`w-8 h-0.5 ${
                          isCompleted ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </>
  );
};

export default AddMembershipPage;
