"use client";

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
import { toast } from "sonner";
import { REGIONS } from "@/data/common/regions";
import { AccountCategory } from "@prisma/client";
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
  CreditCardIcon,
} from "@phosphor-icons/react/dist/ssr";

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

type DirectPayStep = "category" | "region" | "provider" | "member";

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

const Page = () => {
  const router = useRouter();

  // Form state management
  const [currentStep, setCurrentStep] = useState<DirectPayStep>("category");
  const [selectedCategory, setSelectedCategory] =
    useState<AccountCategory | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [providerSearchTerm, setProviderSearchTerm] = useState<string>("");
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderSearchResult | null>(null);
  const [memberUniqueId, setMemberUniqueId] = useState<string>("");

  // Loading and error states
  const [isProviderSearchLoading, setIsProviderSearchLoading] = useState(false);
  const [isMemberVerificationLoading, setIsMemberVerificationLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerSearchResults, setProviderSearchResults] = useState<
    ProviderSearchResult[]
  >([]);

  // Search providers with debouncing
  useEffect(() => {
    const searchProviders = async () => {
      if (!selectedCategory || !selectedRegion || !providerSearchTerm.trim()) {
        setProviderSearchResults([]);
        return;
      }

      if (providerSearchTerm.trim().length < 2) {
        setProviderSearchResults([]);
        return;
      }

      try {
        setIsProviderSearchLoading(true);
        const response = await api.get("/api/v1/provider/search", {
          params: {
            category: selectedCategory,
            region: selectedRegion,
            search: providerSearchTerm.trim(),
            limit: 10,
          },
        });

        if (response.data.success) {
          setProviderSearchResults(response.data.data.providers || []);
        }
      } catch (error) {
        console.error("Error searching providers:", error);
        setProviderSearchResults([]);
      } finally {
        setIsProviderSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProviders, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, selectedRegion, providerSearchTerm]);

  // Verify member and redirect to payment page
  const handleMemberVerification = async () => {
    if (!selectedProvider || !memberUniqueId.trim()) return;

    try {
      setIsMemberVerificationLoading(true);
      setErrorMessage(null);

      const response = await api.get("/api/v1/provider/member/by-uniqueid", {
        params: {
          providerId: selectedProvider.id,
          uniqueId: memberUniqueId.trim().toUpperCase(),
        },
      });

      const memberDetails = response.data.member;

      if (memberDetails) {
        toast.success("Member verified! Redirecting to payment...");
        // Redirect to payment page with member ID
        router.push(`/direct-pay/${memberDetails.id}`);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        "Member not found with the provided ID";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsMemberVerificationLoading(false);
    }
  };

  // Navigation helpers
  const handleStepNavigation = (targetStep: DirectPayStep) => {
    setCurrentStep(targetStep);
    setErrorMessage(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "category":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon size={20} className="text-primary" />
                Choose Institution Category
              </CardTitle>
              <CardDescription>
                Select the type of institution you want to pay fees to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORY_OPTIONS.map((categoryOption) => (
                  <div
                    key={categoryOption.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedCategory === categoryOption.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedCategory(categoryOption.value)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-primary">{categoryOption.icon}</div>
                      <h3 className="font-semibold">{categoryOption.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categoryOption.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleStepNavigation("region")}
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
                Select Your State
              </CardTitle>
              <CardDescription>
                Choose your state to find institutions in your area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region-select">State</Label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger id="region-select" className="w-full !h-12">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((regionData) => (
                      <SelectItem key={regionData.code} value={regionData.code}>
                        {regionData.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleStepNavigation("category")}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button
                  onClick={() => handleStepNavigation("provider")}
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
                <Label htmlFor="provider-search-input">Institution Name</Label>
                <div className="relative">
                  <MagnifyingGlassIcon
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="provider-search-input"
                    placeholder="Type institution name..."
                    value={providerSearchTerm}
                    onChange={(e) => setProviderSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {isProviderSearchLoading && (
                    <SpinnerGapIcon
                      size={16}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-muted-foreground"
                    />
                  )}
                </div>
              </div>

              {/* Provider Search Results */}
              {providerSearchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {providerSearchResults.map((providerResult) => (
                    <div
                      key={providerResult.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedProvider?.id === providerResult.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedProvider(providerResult)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{providerResult.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Address: {providerResult.city},{" "}
                            {providerResult.region}, {providerResult.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Provider Information */}
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
                        Address: {selectedProvider.city},{" "}
                        {selectedProvider.region}, {selectedProvider.country}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleStepNavigation("region")}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button
                  onClick={() => handleStepNavigation("member")}
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
                Enter Your Member ID
              </CardTitle>
              <CardDescription>
                {selectedProvider?.name} - Enter your member ID to proceed with
                payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-id-input">Member ID</Label>
                <Input
                  id="member-id-input"
                  placeholder="Enter your member ID"
                  value={memberUniqueId}
                  onChange={(e) => setMemberUniqueId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The unique ID provided by your institution
                </p>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <WarningIcon size={16} />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleStepNavigation("provider")}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Back
                </Button>
                <Button
                  onClick={handleMemberVerification}
                  disabled={
                    !memberUniqueId.trim() || isMemberVerificationLoading
                  }
                  className="gap-2"
                >
                  {isMemberVerificationLoading ? (
                    <SpinnerGapIcon size={16} className="animate-spin" />
                  ) : (
                    <CreditCardIcon size={16} />
                  )}
                  Proceed to Payment
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
    switch (currentStep) {
      case "category":
        return "Step 1: Choose Category";
      case "region":
        return "Step 2: Select State";
      case "provider":
        return "Step 3: Find Institution";
      case "member":
        return "Step 4: Enter Member ID";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Direct Fee Payment
            </h1>
            <p className="text-gray-600">
              Pay your institution fees directly without creating an account
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress Indicator */}
        <div className="text-center">
          <h2 className="text-lg font-medium mb-4">{getStepTitle()}</h2>
          <div className="flex items-center justify-center gap-2">
            {["category", "region", "provider", "member"].map(
              (stepName, stepIndex) => {
                const isStepCompleted =
                  (stepName === "category" && selectedCategory) ||
                  (stepName === "region" && selectedRegion) ||
                  (stepName === "provider" && selectedProvider) ||
                  (stepName === "member" && currentStep === "member");
                const isCurrentStep = currentStep === stepName;

                return (
                  <div key={stepName} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isStepCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrentStep
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isStepCompleted ? (
                        <CheckCircleIcon size={16} weight="fill" />
                      ) : (
                        stepIndex + 1
                      )}
                    </div>
                    {stepIndex < 3 && (
                      <div
                        className={`w-8 h-0.5 ${
                          isStepCompleted ? "bg-primary" : "bg-muted"
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
    </div>
  );
};

export default Page;
