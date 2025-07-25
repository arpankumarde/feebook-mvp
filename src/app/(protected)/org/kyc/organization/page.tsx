"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BuildingOfficeIcon,
  IdentificationCardIcon,
  FileTextIcon,
  UserIcon,
  CheckCircleIcon,
  InfoIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import { REGIONS } from "@/data/common/regions";
import { Validator } from "format-utils";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import FileUpload from "@/components/ui/file-upload";
import { ENTITY_TYPES } from "@/data/provider/EntitityType";
import { APIResponse } from "@/types/common";
import { ProviderVerification } from "@prisma/client";
import api from "@/lib/api";
import { toast } from "sonner";
import { SLUGS } from "@/constants/slugs";
import { useRouter } from "next/navigation";

export interface BusinessKycFormData {
  organizationName: string;
  entityType: string;
  otherEntityType: string;
  cinNumber: string;
  llpinNumber: string;
  panNumber: string;
  gstNumber: string;
  registeredAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  contactPersonName: string;
  contactPersonPan: string;
  contactPersonAadhaar: string;
  // File uploads
  registrationCertificate: File | null;
  panDocument: File | null;
  gstDocument: File | null;
  contactPersonPanDocument: File | null;
  contactPersonAadhaarDocument: File | null;
}

const Page = () => {
  const { provider } = useProviderAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<BusinessKycFormData>({
    organizationName: "",
    entityType: "",
    otherEntityType: "",
    cinNumber: "",
    llpinNumber: "",
    panNumber: "",
    gstNumber: "",
    registeredAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
    contactPersonName: "",
    contactPersonPan: "",
    contactPersonAadhaar: "",
    registrationCertificate: null,
    panDocument: null,
    gstDocument: null,
    contactPersonPanDocument: null,
    contactPersonAadhaarDocument: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Helper functions for entity type validation
  const requiresCIN = () => {
    return ["PVT_LTD", "PUBLIC_LTD", "GOVT_ENTITY", "OPC"].includes(
      formData.entityType
    );
  };

  const requiresLLPIN = () => {
    return formData.entityType === "LLP";
  };

  const requiresGST = () => {
    return !["TRUST", "SOCIETY"].includes(formData.entityType);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BusinessKycFormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));

    // Clear error when file is uploaded
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    }

    if (!formData.entityType) {
      newErrors.entityType = "Entity type is required";
    }

    if (formData.entityType === "OTHERS" && !formData.otherEntityType.trim()) {
      newErrors.otherEntityType = "Please specify the entity type";
    }

    // CIN validation
    if (requiresCIN() && !formData.cinNumber.trim()) {
      newErrors.cinNumber = "CIN number is required for this entity type";
    } else if (
      requiresCIN() &&
      formData.cinNumber &&
      !Validator.cin(formData.cinNumber.toUpperCase())
    ) {
      newErrors.cinNumber = "Invalid CIN format";
    }

    // LLPIN validation
    if (requiresLLPIN() && !formData.llpinNumber.trim()) {
      newErrors.llpinNumber = "LLPIN number is required for LLP";
    } else if (
      requiresLLPIN() &&
      formData.llpinNumber &&
      !/^[A-Z]{3}-[0-9]{4}$/.test(formData.llpinNumber)
    ) {
      newErrors.llpinNumber = "Invalid LLPIN format (e.g., AAB-1234)";
    }

    // PAN validation
    if (!formData.panNumber.trim()) {
      newErrors.panNumber = "PAN number is required";
    } else if (!Validator.pan(formData.panNumber.toUpperCase())) {
      newErrors.panNumber = "Invalid PAN format";
    }

    // GST validation
    if (requiresGST() && !formData.gstNumber.trim()) {
      newErrors.gstNumber = "GST number is required for this entity type";
    } else if (
      requiresGST() &&
      formData.gstNumber &&
      !Validator.gst(formData.gstNumber)
    ) {
      newErrors.gstNumber = "Invalid GST format";
    }

    // Address validation
    if (!formData.registeredAddress.addressLine1.trim()) {
      newErrors["registeredAddress.addressLine1"] =
        "Address line 1 is required";
    }
    if (!formData.registeredAddress.city.trim()) {
      newErrors["registeredAddress.city"] = "City is required";
    }
    if (!formData.registeredAddress.state) {
      newErrors["registeredAddress.state"] = "State is required";
    }
    if (!formData.registeredAddress.pincode.trim()) {
      newErrors["registeredAddress.pincode"] = "Pincode is required";
    } else if (!Validator.pincode(formData.registeredAddress.pincode)) {
      newErrors["registeredAddress.pincode"] = "Invalid pincode format";
    }

    // Contact person validation
    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = "Contact person name is required";
    }

    if (!formData.contactPersonPan.trim()) {
      newErrors.contactPersonPan = "Contact person PAN is required";
    } else if (!Validator.pan(formData.contactPersonPan)) {
      newErrors.contactPersonPan = "Invalid PAN format";
    }

    if (!formData.contactPersonAadhaar.trim()) {
      newErrors.contactPersonAadhaar = "Contact person Aadhaar is required";
    } else if (!Validator.aadhaar(formData.contactPersonAadhaar)) {
      newErrors.contactPersonAadhaar = "Invalid Aadhaar format";
    }

    // File validations
    if (!formData.registrationCertificate) {
      newErrors.registrationCertificate =
        "Registration certificate is required";
    }
    if (!formData.panDocument) {
      newErrors.panDocument = "PAN document is required";
    }
    if (requiresGST() && !formData.gstDocument) {
      newErrors.gstDocument = "GST document is required";
    }
    if (!formData.contactPersonPanDocument) {
      newErrors.contactPersonPanDocument =
        "Contact person PAN document is required";
    }
    if (!formData.contactPersonAadhaarDocument) {
      newErrors.contactPersonAadhaarDocument =
        "Contact person Aadhaar document is required";
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

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value && typeof value === "string") {
          submitData.append(key, value);
        } else if (
          value &&
          typeof value === "object" &&
          !(value instanceof File)
        ) {
          // Handle nested objects like address
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue && typeof subValue === "string") {
              submitData.append(`${key}.${subKey}`, subValue);
            }
          });
        }
      });

      // Add files
      if (formData.registrationCertificate) {
        submitData.append(
          "registrationCertificate",
          formData.registrationCertificate
        );
      }
      if (formData.panDocument) {
        submitData.append("panDocument", formData.panDocument);
      }
      if (formData.gstDocument) {
        submitData.append("gstDocument", formData.gstDocument);
      }
      if (formData.contactPersonPanDocument) {
        submitData.append(
          "contactPersonPanDocument",
          formData.contactPersonPanDocument
        );
      }
      if (formData.contactPersonAadhaarDocument) {
        submitData.append(
          "contactPersonAadhaarDocument",
          formData.contactPersonAadhaarDocument
        );
      }

      // Submit to API
      const response = await api.post<APIResponse<ProviderVerification>>(
        `/api/v1/provider/kyc/organization?providerId=${provider?.id}`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Organization KYC submitted successfully!");
        router.push(`/${SLUGS.PROVIDER}/kyc`);
      } else {
        // Handle error
        toast.error(response.data.message || "Failed to submit KYC details");
      }
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("An error occurred while submitting KYC details");
    } finally {
      setLoading(false);
    }
  };

  // Initialize form with provider data
  useEffect(() => {
    if (provider?.name) {
      setFormData((prev) => ({
        ...prev,
        organizationName: provider.name,
      }));
    }
  }, [provider?.name]);

  return (
    <div className="p-4 space-y-4 lg:space-y-6 bg-primary/5">
      {/* Information Alert */}
      <Alert>
        <InfoIcon size={16} />
        <AlertTitle>Required Documents</AlertTitle>
        <AlertDescription>
          Please ensure all documents are clear, readable, and in PDF, JPG,
          JPEG, or PNG format (max 10MB each).
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingOfficeIcon
                size={20}
                className="text-primary"
                weight="duotone"
              />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organizationName">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) =>
                  handleInputChange("organizationName", e.target.value)
                }
                placeholder="Enter organization name"
                className={cn(
                  "font-mono",
                  errors.organizationName && "border-destructive"
                )}
              />
              {errors.organizationName && (
                <p className="text-xs text-destructive">
                  {errors.organizationName}
                </p>
              )}
            </div>

            {/* Entity Type */}
            <div className="space-y-2">
              <Label>
                Type of Entity <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.entityType}
                onValueChange={(value) =>
                  handleInputChange("entityType", value)
                }
              >
                <SelectTrigger
                  className={cn(
                    "font-mono max-md:text-base",
                    errors.entityType && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="font-mono"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entityType && (
                <p className="text-xs text-destructive">{errors.entityType}</p>
              )}
            </div>

            {/* Other Entity Type (conditional) */}
            {formData.entityType === "OTHERS" && (
              <div className="space-y-2">
                <Label htmlFor="otherEntityType">
                  Please specify entity type{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="otherEntityType"
                  value={formData.otherEntityType}
                  onChange={(e) =>
                    handleInputChange("otherEntityType", e.target.value)
                  }
                  placeholder="Specify your entity type"
                  className={cn(
                    "font-mono",
                    errors.otherEntityType && "border-destructive"
                  )}
                />
                {errors.otherEntityType && (
                  <p className="text-xs text-destructive">
                    {errors.otherEntityType}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CIN Number (conditional) */}
              {requiresCIN() && (
                <div className="space-y-2">
                  <Label htmlFor="cinNumber">
                    CIN Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cinNumber"
                    value={formData.cinNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "cinNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g., U12345AB1234ABC123456"
                    className={cn(
                      "font-mono",
                      errors.cinNumber && "border-destructive"
                    )}
                  />
                  {errors.cinNumber && (
                    <p className="text-xs text-destructive">
                      {errors.cinNumber}
                    </p>
                  )}
                </div>
              )}

              {/* LLPIN Number (conditional) */}
              {requiresLLPIN() && (
                <div className="space-y-2">
                  <Label htmlFor="llpinNumber">
                    LLPIN Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="llpinNumber"
                    value={formData.llpinNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "llpinNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g., AAB-1234"
                    className={cn(
                      "font-mono",
                      errors.llpinNumber && "border-destructive"
                    )}
                  />
                  {errors.llpinNumber && (
                    <p className="text-xs text-destructive">
                      {errors.llpinNumber}
                    </p>
                  )}
                </div>
              )}

              {/* PAN Number */}
              <div className="space-y-2">
                <Label htmlFor="panNumber">
                  PAN Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleInputChange("panNumber", e.target.value.toUpperCase())
                  }
                  placeholder="e.g., ABCDE1234F"
                  maxLength={10}
                  className={cn(
                    "font-mono",
                    errors.panNumber && "border-destructive"
                  )}
                />
                {errors.panNumber && (
                  <p className="text-xs text-destructive">{errors.panNumber}</p>
                )}
              </div>

              {/* GST Number (conditional) */}
              {requiresGST() && (
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">
                    GST Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "gstNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g., 12ABCDE3456F1Z5"
                    maxLength={15}
                    className={cn(
                      "font-mono",
                      errors.gstNumber && "border-destructive"
                    )}
                  />
                  {errors.gstNumber && (
                    <p className="text-xs text-destructive">
                      {errors.gstNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registered Address Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon size={20} className="text-primary" weight="duotone" />
              Registered Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">
                Address Line 1 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="addressLine1"
                value={formData.registeredAddress.addressLine1}
                onChange={(e) =>
                  handleInputChange(
                    "registeredAddress.addressLine1",
                    e.target.value
                  )
                }
                placeholder="Enter address line 1"
                className={cn(
                  "font-mono",
                  errors["registeredAddress.addressLine1"] &&
                    "border-destructive"
                )}
              />
              {errors["registeredAddress.addressLine1"] && (
                <p className="text-xs text-destructive">
                  {errors["registeredAddress.addressLine1"]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.registeredAddress.addressLine2}
                onChange={(e) =>
                  handleInputChange(
                    "registeredAddress.addressLine2",
                    e.target.value
                  )
                }
                placeholder="Enter address line 2 (optional)"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.registeredAddress.city}
                  onChange={(e) =>
                    handleInputChange("registeredAddress.city", e.target.value)
                  }
                  placeholder="Enter city"
                  className={cn(
                    "font-mono",
                    errors["registeredAddress.city"] && "border-destructive"
                  )}
                />
                {errors["registeredAddress.city"] && (
                  <p className="text-xs text-destructive">
                    {errors["registeredAddress.city"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.registeredAddress.state}
                  onValueChange={(value) =>
                    handleInputChange("registeredAddress.state", value)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "font-mono max-md:text-base",
                      errors["registeredAddress.state"] && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem
                        key={region.code}
                        value={region.code}
                        className="font-mono"
                      >
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["registeredAddress.state"] && (
                  <p className="text-xs text-destructive">
                    {errors["registeredAddress.state"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">
                  Pincode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pincode"
                  value={formData.registeredAddress.pincode}
                  onChange={(e) =>
                    handleInputChange(
                      "registeredAddress.pincode",
                      e.target.value
                    )
                  }
                  placeholder="Enter pincode"
                  maxLength={6}
                  className={cn(
                    "font-mono",
                    errors["registeredAddress.pincode"] && "border-destructive"
                  )}
                />
                {errors["registeredAddress.pincode"] && (
                  <p className="text-xs text-destructive">
                    {errors["registeredAddress.pincode"]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon
                size={20}
                className="text-primary"
                weight="duotone"
              />
              Business Document Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Registration Certificate */}
            <FileUpload
              label="Registration Certificate"
              description="Upload registration certificate document"
              accept=".pdf,.jpg,.jpeg,.png"
              file={formData.registrationCertificate}
              onFileChange={(file) =>
                handleFileChange("registrationCertificate", file)
              }
              icon={
                <FileTextIcon
                  size={16}
                  className="text-primary"
                  weight="duotone"
                />
              }
              required
            />
            {errors.registrationCertificate && (
              <p className="text-xs text-destructive">
                {errors.registrationCertificate}
              </p>
            )}

            {/* PAN Document */}
            <FileUpload
              label="Business PAN Document"
              description="Upload business PAN card document (mandatory for financial compliance)"
              accept=".pdf,.jpg,.jpeg,.png"
              file={formData.panDocument}
              onFileChange={(file) => handleFileChange("panDocument", file)}
              icon={
                <IdentificationCardIcon
                  size={16}
                  className="text-primary"
                  weight="duotone"
                />
              }
              required
            />
            {errors.panDocument && (
              <p className="text-xs text-destructive">{errors.panDocument}</p>
            )}

            {/* GST Document (conditional) */}
            {requiresGST() && (
              <>
                <FileUpload
                  label="GST Certificate"
                  description="Upload GST registration certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={formData.gstDocument}
                  onFileChange={(file) => handleFileChange("gstDocument", file)}
                  icon={
                    <FileTextIcon
                      size={16}
                      className="text-primary"
                      weight="duotone"
                    />
                  }
                  required
                />
                {errors.gstDocument && (
                  <p className="text-xs text-destructive">
                    {errors.gstDocument}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Authorized Signatory Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon size={20} className="text-primary" weight="duotone" />
              Authorized Signatory Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            {/* Contact Person Details */}
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">
                  Contact Person Name{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={(e) =>
                    handleInputChange("contactPersonName", e.target.value)
                  }
                  placeholder="Enter authorized signatory name"
                  className={cn(
                    "font-mono",
                    errors.contactPersonName && "border-destructive"
                  )}
                />
                {errors.contactPersonName && (
                  <p className="text-xs text-destructive">
                    {errors.contactPersonName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonPan">
                  Contact Person PAN <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactPersonPan"
                  value={formData.contactPersonPan}
                  onChange={(e) =>
                    handleInputChange(
                      "contactPersonPan",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="e.g., ABCDE1234F"
                  maxLength={10}
                  className={cn(
                    "font-mono",
                    errors.contactPersonPan && "border-destructive"
                  )}
                />
                {errors.contactPersonPan && (
                  <p className="text-xs text-destructive">
                    {errors.contactPersonPan}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonAadhaar">
                  Contact Person Aadhaar{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactPersonAadhaar"
                  value={formData.contactPersonAadhaar}
                  onChange={(e) =>
                    handleInputChange(
                      "contactPersonAadhaar",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="1234 5678 9012"
                  maxLength={12}
                  className={cn(
                    "font-mono",
                    errors.contactPersonAadhaar && "border-destructive"
                  )}
                />
                {errors.contactPersonAadhaar && (
                  <p className="text-xs text-destructive">
                    {errors.contactPersonAadhaar}
                  </p>
                )}
              </div>
            </div>

            <Separator className="md:hidden" />

            {/* Authorized Signatory Documents */}
            <div className="space-y-4 flex-1">
              <FileUpload
                label="Contact Person PAN Card"
                description="Upload authorized signatory PAN card (mandatory for financial compliance)"
                accept=".pdf,.jpg,.jpeg,.png"
                file={formData.contactPersonPanDocument}
                onFileChange={(file) =>
                  handleFileChange("contactPersonPanDocument", file)
                }
                icon={
                  <IdentificationCardIcon
                    size={16}
                    className="text-primary"
                    weight="duotone"
                  />
                }
                required
              />
              {errors.contactPersonPanDocument && (
                <p className="text-xs text-destructive">
                  {errors.contactPersonPanDocument}
                </p>
              )}

              <FileUpload
                label="Contact Person Aadhaar Card"
                description="Upload authorized signatory Aadhaar card (as proof of identity and address)"
                accept=".pdf,.jpg,.jpeg,.png"
                file={formData.contactPersonAadhaarDocument}
                onFileChange={(file) =>
                  handleFileChange("contactPersonAadhaarDocument", file)
                }
                icon={
                  <IdentificationCardIcon
                    size={16}
                    className="text-primary"
                    weight="duotone"
                  />
                }
                required
              />
              {errors.contactPersonAadhaarDocument && (
                <p className="text-xs text-destructive">
                  {errors.contactPersonAadhaarDocument}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

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
                <CheckCircleIcon size={16} weight="fill" />
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
