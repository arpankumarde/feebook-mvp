"use client";

import { useState, useEffect } from "react";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
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
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  UserIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  LockIcon,
  CheckCircleIcon,
  WarningIcon,
  SpinnerGapIcon,
  EyeIcon,
  EyeSlashIcon,
  FloppyDiskIcon,
  XCircleIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

interface ConsumerProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage = () => {
  const { consumer, refresh } = useConsumerAuth();
  const [profile, setProfile] = useState<ConsumerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!consumer?.id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/v1/consumer/profile", {
          params: { consumerId: consumer.id },
        });

        if (response.data.success) {
          const profileData = response.data.data;
          setProfile(profileData);

          // Populate form with existing data
          setFormData({
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            email: profileData.email || "",
            phone: profileData.phone || "",

            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          setError("Failed to load profile data");
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [consumer?.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation - only validate if any password field is filled
    if (
      formData.currentPassword ||
      formData.newPassword ||
      formData.confirmPassword
    ) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || null,
      };

      // Include password data only if changing password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await api.put("/api/v1/consumer/profile", updateData, {
        params: { consumerId: consumer?.id },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");

        // Refresh auth context
        refresh();

        // Reset password fields if they were used
        if (formData.currentPassword || formData.newPassword) {
          setFormData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        }

        // Refresh profile data
        setProfile(response.data.data);
      } else {
        throw new Error(response.data.error || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your profile settings
            </p>
          </div>
        </ConsumerTopbar>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3">
            <SpinnerGapIcon size={24} className="animate-spin text-primary" />
            <span className="font-medium">Loading profile...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your profile settings
          </p>
        </div>
      </ConsumerTopbar>

      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 flex-col lg:flex-row">
            {/* Personal Information */}
            <Card className="flex-1 border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon
                    size={20}
                    className="text-primary"
                    weight="duotone"
                  />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="flex items-center gap-2 h-6"
                    >
                      <EnvelopeSimpleIcon
                        size={16}
                        weight="duotone"
                        className="text-primary"
                      />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter your email address"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="flex items-center gap-2 h-6"
                    >
                      <PhoneIcon
                        size={16}
                        weight="duotone"
                        className="text-primary"
                      />
                      Phone Number
                      {profile?.isPhoneVerified ? (
                        <Badge className="gap-1 bg-green-600">
                          <CheckCircleIcon size={12} weight="fill" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <WarningIcon size={12} />
                          Not Verified
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      placeholder="Phone number"
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Phone number cannot be changed. Contact support if you
                      need to update it.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="flex-1 border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockIcon
                    size={20}
                    className="text-primary"
                    weight="duotone"
                  />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Change your password to keep your account secure (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) =>
                          handleInputChange("currentPassword", e.target.value)
                        }
                        placeholder="Enter current password"
                        className={
                          errors.currentPassword ? "border-destructive" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon size={16} />
                        ) : (
                          <EyeIcon size={16} />
                        )}
                      </Button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-xs text-destructive">
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) =>
                          handleInputChange("newPassword", e.target.value)
                        }
                        placeholder="Enter new password"
                        className={
                          errors.newPassword ? "border-destructive" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon size={16} />
                        ) : (
                          <EyeIcon size={16} />
                        )}
                      </Button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-destructive">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        placeholder="Confirm new password"
                        className={
                          errors.confirmPassword ? "border-destructive" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon size={16} />
                        ) : (
                          <EyeIcon size={16} />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Leave password fields empty if you don't want to change your
                    password
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Account Information */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon
                  size={20}
                  className="text-primary"
                  weight="duotone"
                />
                Account Information
              </CardTitle>
              <CardDescription>
                View your account details and creation date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Account Created
                  </Label>
                  <p>
                    {profile
                      ? new Date(profile.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Last Updated
                  </Label>
                  <p>
                    {profile
                      ? new Date(profile.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2 min-w-32">
              {saving ? (
                <SpinnerGapIcon size={16} className="animate-spin" />
              ) : (
                <FloppyDiskIcon size={16} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ProfilePage;
