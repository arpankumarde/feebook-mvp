"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import api from "@/lib/api";
import { toast } from "sonner";
import { SLUGS } from "@/constants/slugs";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Gender, Member } from "@prisma/client";
import { APIResponse } from "@/types/common";

interface MemberFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  uniqueId: string;
  phone: string;
  email?: string;
  category?: string;
  subcategory?: string;
  guardianName?: string;
  relationship?: string;
}

const EditMemberPage = () => {
  const params = useParams();
  const router = useRouter();
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const memberId = params.memberId as string;

  const [formData, setFormData] = useState<MemberFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    uniqueId: "",
    phone: "",
    email: "",
    category: "",
    subcategory: "",
    guardianName: "",
    relationship: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    const fetchMemberDetails = async () => {
      try {
        if (!provider?.id || !memberId) {
          setError("Required information not found");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const response = await api.get<APIResponse<Member>>(
          "/api/v1/provider/member",
          {
            params: {
              providerId: provider.id,
              memberId: memberId,
            },
          }
        );

        if (response.data.success && response.data.data) {
          const member: Member = response.data.data;
          setFormData({
            firstName: member.firstName || "",
            middleName: member.middleName || "",
            lastName: member.lastName || "",
            dateOfBirth: member.dateOfBirth
              ? new Date(member.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: member.gender || "",
            uniqueId: member.uniqueId || "",
            phone: member.phone || "",
            email: member.email || "",
            category: member.category || "",
            subcategory: member.subcategory || "",
            guardianName: member.guardianName || "",
            relationship: member.relationship || "",
          });
        } else {
          throw new Error("Member not found");
        }
      } catch (err: any) {
        console.error("Error fetching member details:", err);
        setError(err.response?.data?.error || "Failed to load member details");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberDetails();
  }, [provider?.id, memberId, isAuthLoading]);

  const handleChange = (field: keyof MemberFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider?.id) {
      setError("Provider information not found");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth)
          : null,
        providerId: provider.id,
        id: memberId,
      };

      await api.put("/api/v1/provider/member", { member: updateData });

      setSuccess(true);
      toast.success("Member updated successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/${SLUGS.PROVIDER}/members/view/${memberId}`);
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update member";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Edit Member</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Update member information
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <SpinnerGapIcon size={20} className="animate-spin text-primary" />
            <span className="text-muted-foreground">
              Loading member details...
            </span>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error && !formData.firstName) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Edit Member</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Update member information
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeftIcon size={16} />
            Go Back
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Edit Member</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Update member information
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
            size={"sm"}
          >
            <ArrowLeftIcon size={16} />
            Back
          </Button>
        </div>
      </ProviderTopbar>

      <div className="p-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <XCircleIcon size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircleIcon size={16} className="text-green-600" />
                <AlertDescription className="text-green-800">
                  Member updated successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name*</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) =>
                        handleChange("middleName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name*</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uniqueId">Member ID*</Label>
                    <Input
                      id="uniqueId"
                      value={formData.uniqueId}
                      onChange={(e) => handleChange("uniqueId", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleChange("dateOfBirth", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleChange("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.MALE}>
                          {Gender.MALE}
                        </SelectItem>
                        <SelectItem value={Gender.FEMALE}>
                          {Gender.FEMALE}
                        </SelectItem>
                        <SelectItem value={Gender.OTHER}>
                          {Gender.OTHER}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone*</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Phone (10 digits)"
                      pattern="[0-9]{10}"
                      minLength={10}
                      maxLength={10}
                      title="Please enter exactly 10 digits"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Category Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Category Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) =>
                        handleChange("subcategory", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) =>
                        handleChange("guardianName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Input
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) =>
                        handleChange("relationship", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <SpinnerGapIcon size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon size={16} />
                      Update Member
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EditMemberPage;
