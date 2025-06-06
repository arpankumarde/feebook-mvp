"use client";

import React, { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  IdentificationCardIcon,
  FileTextIcon,
  UploadIcon,
  CheckCircleIcon,
  XCircleIcon,
  WarningIcon,
  InfoIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { REGIONS } from "@/data/common/regions";

interface PersonalKycFormData {
  fullName: string;
  dateOfBirth: Date | undefined;
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

interface FileUploadProps {
  label: string;
  description: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
  required?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept,
  file,
  onFileChange,
  icon,
  required = false,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleRemoveFile = () => {
    onFileChange(null);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>

      {!file ? (
        <div className="space-y-2">
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, JPG, PNG (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <CheckCircleIcon
              size={20}
              className="text-green-600"
              weight="fill"
            />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

const PersonalKycForm: React.FC = () => {
  const [formData, setFormData] = useState<PersonalKycFormData>({
    fullName: "",
    dateOfBirth: undefined,
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

  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  const validateAadhaar = (aadhaar: string): boolean => {
    const aadhaarRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
    return aadhaarRegex.test(aadhaar);
  };

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

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
      const age = new Date().getFullYear() - formData.dateOfBirth.getFullYear();
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
    } else if (!validatePincode(formData.permanentAddress.pincode)) {
      newErrors["permanentAddress.pincode"] = "Invalid pincode format";
    }

    // PAN validation
    if (!formData.panCard.panNumber.trim()) {
      newErrors["panCard.panNumber"] = "PAN number is required";
    } else if (!validatePAN(formData.panCard.panNumber)) {
      newErrors["panCard.panNumber"] = "Invalid PAN format (e.g., ABCDE1234F)";
    }
    if (!formData.panCard.documentFile) {
      newErrors["panCard.documentFile"] = "PAN card document is required";
    }

    // Aadhaar validation
    if (!formData.aadhaarCard.aadhaarNumber.trim()) {
      newErrors["aadhaarCard.aadhaarNumber"] = "Aadhaar number is required";
    } else if (!validateAadhaar(formData.aadhaarCard.aadhaarNumber)) {
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
      // TODO: Implement API call to submit KYC data
      console.log("Submitting KYC data:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Handle success
      alert("KYC details submitted successfully!");
    } catch (error) {
      console.error("Error submitting KYC:", error);
      alert("Failed to submit KYC details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Personal KYC Details</h2>
        <p className="text-muted-foreground">
          Complete your personal verification to access all features
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon size={20} className="text-primary" weight="duotone" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Provide your personal details as per government documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name (as per PAN/Aadhaar){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter your full name as per documents"
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label>
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfBirth && "text-muted-foreground",
                      errors.dateOfBirth && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfBirth ? (
                      format(formData.dateOfBirth, "PPP")
                    ) : (
                      <span>Select date of birth</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfBirth || new Date("2010-01-01")}
                    onSelect={(date) => handleInputChange("dateOfBirth", date)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon size={20} className="text-primary" weight="duotone" />
              Permanent Address
            </CardTitle>
            <CardDescription>
              Provide your permanent address with proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address Line 1 */}
            <div className="space-y-2">
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
                className={
                  errors["permanentAddress.addressLine1"]
                    ? "border-destructive"
                    : ""
                }
              />
              {errors["permanentAddress.addressLine1"] && (
                <p className="text-xs text-destructive">
                  {errors["permanentAddress.addressLine1"]}
                </p>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="space-y-2">
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
              />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className={
                    errors["permanentAddress.city"] ? "border-destructive" : ""
                  }
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
                    className={
                      errors["permanentAddress.state"]
                        ? "border-destructive"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
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
                  className={
                    errors["permanentAddress.pincode"]
                      ? "border-destructive"
                      : ""
                  }
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
          <CardContent className="space-y-6">
            {/* PAN Card Section */}
            <div className="space-y-4">
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
                label="PAN Card Document"
                description="Upload a clear copy of your PAN card (PDF, JPG, PNG)"
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

            <Separator />

            {/* Aadhaar Card Section */}
            <div className="space-y-4">
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
                label="Aadhaar Card Document"
                description="Upload a clear copy of your Aadhaar card (PDF, JPG, PNG)"
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
            readable.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={loading} className="px-8">
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

export default PersonalKycForm;
