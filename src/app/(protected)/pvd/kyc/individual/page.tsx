"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  UserIcon,
  MapPinIcon,
  IdentificationCardIcon,
  FileTextIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { REGIONS } from "@/data/common/regions";
import { Validator } from "format-utils";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import FileUpload from "@/components/ui/file-upload";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { ProviderVerification } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SLUGS } from "@/constants/slugs";

export interface PersonalKycFormData {
  fullName: string;
  dateOfBirth: Date | string;
  permanentAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  panCard: {
    panNumber: string;
    documentFile: File | null;
  };
  aadhaarCard: {
    aadhaarNumber: string;
    documentFile: File | null;
  };
}

const Page = () => {
  const { provider } = useProviderAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<PersonalKycFormData>({
    fullName: "",
    dateOfBirth: "",
    permanentAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
    panCard: {
      panNumber: "",
      documentFile: null,
    },
    aadhaarCard: {
      aadhaarNumber: "",
      documentFile: null,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const parentKey = keys[0] as keyof PersonalKycFormData;
        const parentValue = prev[parentKey];

        // Ensure the parent property is an object before spreading
        if (typeof parentValue === "object" && parentValue !== null) {
          return {
            ...prev,
            [keys[0]]: {
              ...parentValue,
              [keys[1]]: value,
            },
          };
        }
      }
      return prev;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Date of Birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const age =
        new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = "Must be at least 18 years old";
      }
    }

    // Address validation
    if (!formData.permanentAddress.addressLine1.trim()) {
      newErrors["permanentAddress.addressLine1"] = "Address line 1 is required";
    }
    if (!formData.permanentAddress.city.trim()) {
      newErrors["permanentAddress.city"] = "City is required";
    }
    if (!formData.permanentAddress.state.trim()) {
      newErrors["permanentAddress.state"] = "State is required";
    }
    if (!formData.permanentAddress.pincode.trim()) {
      newErrors["permanentAddress.pincode"] = "Pincode is required";
    } else if (!Validator.pincode(formData.permanentAddress.pincode)) {
      newErrors["permanentAddress.pincode"] = "Invalid pincode format";
    }

    // PAN validation
    if (!formData.panCard.panNumber.trim()) {
      newErrors["panCard.panNumber"] = "PAN number is required";
    } else if (!Validator.pan(formData.panCard.panNumber.toUpperCase())) {
      newErrors["panCard.panNumber"] = "Invalid PAN format (e.g., ABCDE1234F)";
    }
    if (!formData.panCard.documentFile) {
      newErrors["panCard.documentFile"] = "PAN card document is required";
    }

    // Aadhaar validation
    if (!formData.aadhaarCard.aadhaarNumber.trim()) {
      newErrors["aadhaarCard.aadhaarNumber"] = "Aadhaar number is required";
    } else if (!Validator.aadhaar(formData.aadhaarCard.aadhaarNumber)) {
      newErrors["aadhaarCard.aadhaarNumber"] = "Invalid Aadhaar format";
    }
    if (!formData.aadhaarCard.documentFile) {
      newErrors["aadhaarCard.documentFile"] =
        "Aadhaar card document is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add text fields to FormData
      submitData.append("fullName", formData.fullName);
      submitData.append("dateOfBirth", formData.dateOfBirth.toString());

      // Add address fields
      submitData.append(
        "permanentAddress.addressLine1",
        formData.permanentAddress.addressLine1
      );
      submitData.append(
        "permanentAddress.addressLine2",
        formData.permanentAddress.addressLine2
      );
      submitData.append(
        "permanentAddress.city",
        formData.permanentAddress.city
      );
      submitData.append(
        "permanentAddress.state",
        formData.permanentAddress.state
      );
      submitData.append(
        "permanentAddress.pincode",
        formData.permanentAddress.pincode
      );

      // Add PAN details
      submitData.append("panCard.panNumber", formData.panCard.panNumber);
      if (formData.panCard.documentFile) {
        submitData.append(
          "panCard.documentFile",
          formData.panCard.documentFile
        );
      }

      // Add Aadhaar details
      submitData.append(
        "aadhaarCard.aadhaarNumber",
        formData.aadhaarCard.aadhaarNumber
      );
      if (formData.aadhaarCard.documentFile) {
        submitData.append(
          "aadhaarCard.documentFile",
          formData.aadhaarCard.documentFile
        );
      }

      const response = await api.post<APIResponse<ProviderVerification>>(
        `/provider/kyc/individual?providerId=${provider?.id}`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("KYC details submitted successfully!");
        router.push(`/${SLUGS.PROVIDER}/kyc`);
      } else {
        toast.error(
          response.data.message ||
            "Failed to submit KYC details. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("Failed to submit KYC details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Pre-fill form data if provider admin name is available
    if (provider?.adminName) {
      setFormData((prev) => ({
        ...prev,
        fullName: provider.adminName,
      }));
    }
  }, [provider?.adminName]);

  return (
    <div className="p-4 space-y-4 lg:space-y-6 bg-primary/5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="w-full lg:w-1/3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size={20} className="text-primary" weight="duotone" />
                Personal Information
              </CardTitle>
              <CardDescription>Provide your personal details</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row lg:flex-col gap-4">
              {/* Full Name */}
              <div className="space-y-2 flex-1">
                <Label htmlFor="fullName">
                  Full Name (as per PAN/Aadhaar){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter your full name as per documents"
                  className={cn(
                    "font-mono",
                    errors.fullName ? "border-destructive" : ""
                  )}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2 flex-1">
                <Label htmlFor="dateOfBirth">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth?.toString()}
                  max={
                    new Date(
                      new Date().getFullYear() - 13,
                      new Date().getMonth(),
                      new Date().getDate()
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  min={"1900-01-01"}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  placeholder="Enter your date of birth"
                  className={cn(
                    "font-mono",
                    errors.dateOfBirth ? "border-destructive" : ""
                  )}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-destructive">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card className="w-full lg:w-2/3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon
                  size={20}
                  className="text-primary"
                  weight="duotone"
                />
                Permanent Address
              </CardTitle>
              <CardDescription>
                Provide your permanent address with proof
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-12 gap-4">
              {/* Address Line 1 */}
              <div className="space-y-2 col-span-12 md:col-span-6">
                <Label htmlFor="addressLine1">
                  Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addressLine1"
                  value={formData.permanentAddress.addressLine1}
                  onChange={(e) =>
                    handleInputChange(
                      "permanentAddress.addressLine1",
                      e.target.value
                    )
                  }
                  placeholder="House/Flat No., Building Name, Street"
                  className={cn(
                    "font-mono",
                    errors["permanentAddress.addressLine1"] &&
                      "border-destructive"
                  )}
                />
                {errors["permanentAddress.addressLine1"] && (
                  <p className="text-xs text-destructive">
                    {errors["permanentAddress.addressLine1"]}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2 col-span-12 md:col-span-6">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.permanentAddress.addressLine2}
                  onChange={(e) =>
                    handleInputChange(
                      "permanentAddress.addressLine2",
                      e.target.value
                    )
                  }
                  placeholder="Area, Locality, Landmark (Optional)"
                  className="font-mono"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-3 col-span-12 md:col-span-9 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.permanentAddress.city}
                    onChange={(e) =>
                      handleInputChange("permanentAddress.city", e.target.value)
                    }
                    placeholder="City"
                    className={cn(
                      "font-mono",
                      errors["permanentAddress.city"]
                        ? "border-destructive"
                        : ""
                    )}
                  />
                  {errors["permanentAddress.city"] && (
                    <p className="text-xs text-destructive">
                      {errors["permanentAddress.city"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.permanentAddress.state}
                    onValueChange={(value) =>
                      handleInputChange("permanentAddress.state", value)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "font-mono max-md:text-base",
                        errors["permanentAddress.state"]
                          ? "border-destructive"
                          : "w-full"
                      )}
                    >
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((state) => (
                        <SelectItem
                          key={state.code}
                          value={state.code}
                          className="font-mono"
                        >
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors["permanentAddress.state"] && (
                    <p className="text-xs text-destructive">
                      {errors["permanentAddress.state"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">
                    Pincode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    value={formData.permanentAddress.pincode}
                    onChange={(e) =>
                      handleInputChange(
                        "permanentAddress.pincode",
                        e.target.value
                      )
                    }
                    placeholder="400001"
                    maxLength={6}
                    className={cn(
                      "font-mono",
                      errors["permanentAddress.pincode"]
                        ? "border-destructive"
                        : ""
                    )}
                  />
                  {errors["permanentAddress.pincode"] && (
                    <p className="text-xs text-destructive">
                      {errors["permanentAddress.pincode"]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon
                size={20}
                className="text-primary"
                weight="duotone"
              />
              Documents Required
            </CardTitle>
            <CardDescription>
              Upload clear, readable copies of your identity documents
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            {/* PAN Card Section */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <IdentificationCardIcon
                  size={18}
                  className="text-orange-600"
                  weight="duotone"
                />
                <h4 className="font-medium">PAN Card Details</h4>
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              </div>

              {/* Important Note for PAN */}
              <Alert className="border-orange-200 bg-orange-50">
                <WarningIcon size={16} className="text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Important:</strong> PAN Card is mandatory for
                  financial compliance. Upload the front side of your PAN card
                  in a clear image.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="panNumber">
                  PAN Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="panNumber"
                  value={formData.panCard.panNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "panCard.panNumber",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={cn(
                    "font-mono",
                    errors["panCard.panNumber"] ? "border-destructive" : ""
                  )}
                />
                {errors["panCard.panNumber"] && (
                  <p className="text-xs text-destructive">
                    {errors["panCard.panNumber"]}
                  </p>
                )}
              </div>

              <FileUpload
                label="PAN Card Document (Both Sides)"
                description="Upload a clear copy of your PAN card showing both front and back sides (PDF, JPG, PNG)"
                accept=".pdf,.jpg,.jpeg,.png"
                file={formData.panCard.documentFile}
                onFileChange={(file) =>
                  handleInputChange("panCard.documentFile", file)
                }
                icon={
                  <IdentificationCardIcon
                    size={16}
                    className="text-orange-600"
                  />
                }
                required
              />
              {errors["panCard.documentFile"] && (
                <p className="text-xs text-destructive">
                  {errors["panCard.documentFile"]}
                </p>
              )}
            </div>

            <Separator className="md:hidden" />

            {/* Aadhaar Card Section */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <IdentificationCardIcon
                  size={18}
                  className="text-blue-600"
                  weight="duotone"
                />
                <h4 className="font-medium">Aadhaar Card Details</h4>
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              </div>

              {/* Important Note for Aadhaar */}
              <Alert className="border-blue-200 bg-blue-50">
                <WarningIcon size={16} className="text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> Aadhaar Card is required as proof
                  of identity and address. Upload both front and back sides of
                  your Aadhaar card in a single file.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">
                  Aadhaar Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="aadhaarNumber"
                  value={formData.aadhaarCard.aadhaarNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "aadhaarCard.aadhaarNumber",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="1234 5678 9012"
                  maxLength={12}
                  className={cn(
                    "font-mono",
                    errors["aadhaarCard.aadhaarNumber"]
                      ? "border-destructive"
                      : ""
                  )}
                />
                {errors["aadhaarCard.aadhaarNumber"] && (
                  <p className="text-xs text-destructive">
                    {errors["aadhaarCard.aadhaarNumber"]}
                  </p>
                )}
              </div>

              <FileUpload
                label="Aadhaar Card Document (Both Sides)"
                description="Upload a clear copy of your Aadhaar card showing both front and back sides (PDF, JPG, PNG)"
                accept=".pdf,.jpg,.jpeg,.png"
                file={formData.aadhaarCard.documentFile}
                onFileChange={(file) =>
                  handleInputChange("aadhaarCard.documentFile", file)
                }
                icon={
                  <IdentificationCardIcon size={16} className="text-blue-600" />
                }
                required
              />
              {errors["aadhaarCard.documentFile"] && (
                <p className="text-xs text-destructive">
                  {errors["aadhaarCard.documentFile"]}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Alert>
          <InfoIcon size={16} />
          <AlertDescription>
            <strong>Important:</strong> Ensure all information matches exactly
            with your government documents. Any discrepancy may result in
            verification failure. All uploaded documents should be clear and
            readable.{" "}
            <strong>
              Both sides of PAN and Aadhaar cards must be uploaded.
            </strong>
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full sm:w-auto mb-8"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircleIcon size={16} className="mr-2" weight="bold" />
                Submit KYC Details
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Page;
