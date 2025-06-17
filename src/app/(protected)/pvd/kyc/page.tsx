"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CalendarIcon,
  InfoIcon,
  SparkleIcon,
  ConfettiIcon,
  HandHeartIcon,
  XCircleIcon,
  WarningIcon,
  UserPlusIcon,
  FileTextIcon,
  EyeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import { SLUGS } from "@/constants/slugs";
import Link from "next/link";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import {
  Provider,
  ProviderVerification,
  VerificationStatus,
} from "@prisma/client";
import { BRAND_SUPPORT_EMAIL, BRAND_SUPPORT_PHONE } from "@/data/common/brand";
import { setProviderCookie } from "@/lib/auth-utils";

interface ExtendedProvider extends Provider {
  verification?: ProviderVerification | null;
}

// Status configuration for different verification states
const STATUS_CONFIG = {
  PROCESSING: {
    icon: ClockIcon,
    iconColor: "text-yellow-600",
    iconBgColor: "bg-yellow-100",
    gradientFrom: "from-yellow-50",
    gradientTo: "to-orange-50",
    cardHeaderBg: "bg-yellow-600",
    cardBorderColor: "border-yellow-200",
    title: "KYC Under Review",
    subtitle: "Your application is being processed",
    badgeVariant: "secondary" as const,
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
    statusText: "Under Review",
    message:
      "Thank you for submitting your KYC documents. Our team is currently reviewing your application.",
    timelineText:
      "Our team will review your application within 3-4 business days",
    showNextSteps: true,
    showContactInfo: true,
    actionButtons: [
      {
        href: `/${SLUGS.PROVIDER}/dashboard`,
        variant: "default" as const,
        icon: ArrowLeftIcon,
        text: "Back to Dashboard",
        bgColor: "bg-yellow-600 hover:bg-yellow-700",
      },
    ],
  },
  PENDING: {
    icon: InfoIcon,
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-100",
    gradientFrom: "from-blue-50",
    gradientTo: "to-indigo-50",
    cardHeaderBg: "bg-blue-600",
    cardBorderColor: "border-blue-200",
    title: "Action Required",
    subtitle: "Additional information needed",
    badgeVariant: "secondary" as const,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    statusText: "Pending Action",
    message:
      "We've reviewed your KYC submission and need additional information or clarification to proceed.",
    timelineText:
      "Please provide the requested information to continue verification",
    showNextSteps: false,
    showContactInfo: true,
    actionButtons: [
      {
        href: `/${SLUGS.PROVIDER}/kyc/individual`,
        variant: "default" as const,
        icon: FileTextIcon,
        text: "Update Documents",
        bgColor: "bg-blue-600 hover:bg-blue-700",
      },
      {
        href: `/${SLUGS.PROVIDER}/dashboard`,
        variant: "outline" as const,
        icon: ArrowLeftIcon,
        text: "Back to Dashboard",
        bgColor: "",
      },
    ],
  },
  VERIFIED: {
    icon: CheckCircleIcon,
    iconColor: "text-green-600",
    iconBgColor: "bg-green-100",
    gradientFrom: "from-green-50",
    gradientTo: "to-emerald-50",
    cardHeaderBg: "bg-green-600",
    cardBorderColor: "border-green-200",
    title: "KYC Verified Successfully!",
    subtitle: "Your account is fully activated",
    badgeVariant: "default" as const,
    badgeColor: "bg-green-600 text-white",
    statusText: "Verified",
    message:
      "Congratulations! Your KYC verification is complete and your account has been approved with full access to all features.",
    timelineText: "You now have complete access to all platform features",
    showNextSteps: false,
    showContactInfo: false,
    actionButtons: [
      {
        href: `/${SLUGS.PROVIDER}/members`,
        variant: "default" as const,
        icon: UserPlusIcon,
        text: "Manage Members",
        bgColor: "bg-green-600 hover:bg-green-700",
      },
      {
        href: `/${SLUGS.PROVIDER}/dashboard`,
        variant: "outline" as const,
        icon: ArrowLeftIcon,
        text: "Go to Dashboard",
        bgColor: "",
      },
    ],
  },
  REJECTED: {
    icon: XCircleIcon,
    iconColor: "text-red-600",
    iconBgColor: "bg-red-100",
    gradientFrom: "from-red-50",
    gradientTo: "to-pink-50",
    cardHeaderBg: "bg-red-600",
    cardBorderColor: "border-red-200",
    title: "KYC Verification Failed",
    subtitle: "Your application was not approved",
    badgeVariant: "destructive" as const,
    badgeColor: "bg-red-600 text-white",
    statusText: "Rejected",
    message:
      "Unfortunately, we couldn't verify your KYC documents. This could be due to incomplete or unclear documentation.",
    timelineText: "You can resubmit your KYC with corrected documents",
    showNextSteps: false,
    showContactInfo: true,
    actionButtons: [
      {
        href: `/${SLUGS.PROVIDER}/kyc/individual`,
        variant: "default" as const,
        icon: FileTextIcon,
        text: "Resubmit KYC",
        bgColor: "bg-red-600 hover:bg-red-700",
      },
      {
        href: `/${SLUGS.PROVIDER}/dashboard`,
        variant: "outline" as const,
        icon: ArrowLeftIcon,
        text: "Back to Dashboard",
        bgColor: "",
      },
    ],
  },
};

const Page = () => {
  const { provider } = useProviderAuth();
  const [mounted, setMounted] = useState(false);
  const [kycData, setKycData] = useState<ExtendedProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (provider?.id) {
      async function fetchKycData() {
        try {
          setLoading(true);
          setError(null);

          const response = await api.get<APIResponse<ExtendedProvider>>(
            "/api/v1/provider/kyc/individual",
            {
              params: {
                providerId: provider?.id,
              },
            }
          );

          if (response.data.success && response.data.data) {
            setKycData(response?.data?.data);

            // remove provider.verification data
            const updatedProvider = { ...response.data.data };
            if (updatedProvider.verification) {
              updatedProvider.verification = null;
            }
            setProviderCookie(updatedProvider);
          } else {
            setError("No KYC data found");
          }
        } catch (err: any) {
          console.error("Failed to fetch KYC data:", err);
          setError("Failed to load KYC data");
        } finally {
          setLoading(false);
        }
      }
      fetchKycData();
    }
  }, [provider]);

  if (!mounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/10 p-4">
        <div className="max-w-4xl mx-auto py-8 space-y-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-muted animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-muted rounded-lg animate-pulse mx-auto w-64"></div>
              <div className="h-4 bg-muted rounded-lg animate-pulse mx-auto w-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or no KYC data - show option to start KYC
  if (error || !kycData?.verification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto py-8 space-y-8">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                  <FileTextIcon
                    size={48}
                    className="text-white"
                    weight="duotone"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-blue-800">
                KYC Verification Required
              </h1>
              <p className="text-lg text-blue-700 max-w-2xl mx-auto">
                Complete your KYC verification to unlock all platform features
                and start managing your fees.
              </p>
            </div>
          </div>

          <Card className="border-blue-200 shadow-lg max-w-2xl mx-auto pt-0">
            <CardHeader className="bg-blue-600 rounded-t-xl py-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <ShieldCheckIcon size={24} weight="duotone" />
                Start KYC Verification
              </CardTitle>
              <CardDescription className="text-blue-50">
                Get verified to access all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  To comply with regulations and ensure security, we need to
                  verify your identity and organization details.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileTextIcon
                      size={32}
                      className="text-blue-600 mx-auto mb-2"
                    />
                    <p className="text-sm font-medium">Upload Documents</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <EyeIcon size={32} className="text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Review Process</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircleIcon
                      size={32}
                      className="text-blue-600 mx-auto mb-2"
                    />
                    <p className="text-sm font-medium">Get Verified</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="gap-3 bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <Link href={`/${SLUGS.PROVIDER}/kyc/individual`}>
                    <FileTextIcon size={20} />
                    Start KYC Process
                  </Link>
                </Button>

                <Button variant="outline" size="lg" className="gap-3" asChild>
                  <Link href={`/${SLUGS.PROVIDER}/dashboard`}>
                    <ArrowLeftIcon size={20} />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get status configuration
  const verificationStatus = kycData.verification.status as VerificationStatus;
  const config = STATUS_CONFIG[verificationStatus];
  const IconComponent = config.icon;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.gradientFrom} via-white ${config.gradientTo} p-4`}
    >
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        {/* Status Header with Animation */}
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-32 h-32 rounded-full ${config.iconBgColor} animate-pulse`}
              ></div>
            </div>
            <div className="relative flex items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full ${config.iconBgColor.replace(
                  "100",
                  "600"
                )} flex items-center justify-center shadow-lg`}
              >
                <IconComponent size={48} className="text-white" weight="fill" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              {verificationStatus === "VERIFIED" && (
                <>
                  <SparkleIcon
                    size={24}
                    className="text-green-500"
                    weight="fill"
                  />
                  <h1
                    className={`text-3xl md:text-4xl font-bold ${config.iconColor.replace(
                      "600",
                      "800"
                    )}`}
                  >
                    {config.title}
                  </h1>
                  <SparkleIcon
                    size={24}
                    className="text-green-500"
                    weight="fill"
                  />
                </>
              )}
              {verificationStatus !== "VERIFIED" && (
                <h1
                  className={`text-3xl md:text-4xl font-bold ${config.iconColor.replace(
                    "600",
                    "800"
                  )}`}
                >
                  {config.title}
                </h1>
              )}
            </div>
            <p
              className={`text-lg ${config.iconColor.replace(
                "600",
                "700"
              )} max-w-2xl mx-auto`}
            >
              {config.message}
            </p>
          </div>
        </div>

        {/* Main Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Card */}
          <Card className={`${config.cardBorderColor} shadow-lg pt-0`}>
            <CardHeader className={`${config.cardHeaderBg} rounded-t-xl py-4`}>
              <CardTitle className="flex items-center gap-3 text-white">
                <ShieldCheckIcon size={24} weight="duotone" />
                Verification Status
              </CardTitle>
              <CardDescription className="text-white/90">
                {config.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Application Status:
                </span>
                <Badge
                  variant={config.badgeVariant}
                  className={config.badgeColor}
                >
                  <config.icon size={12} className="mr-1" weight="fill" />
                  {config.statusText}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Submitted On:
                </span>
                <span className="text-sm font-medium">
                  {new Date(
                    kycData.verification.createdAt.toString()
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Organization:
                </span>
                <span className="text-sm font-medium">{provider?.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Contact Email:
                </span>
                <span className="text-sm font-medium">{provider?.email}</span>
              </div>

              <Separator />

              <div
                className={`p-4 ${config.iconBgColor.replace(
                  "100",
                  "50"
                )} rounded-lg`}
              >
                <div className="flex items-start gap-3">
                  <CalendarIcon size={20} className={config.iconColor} />
                  <div>
                    <p
                      className={`text-sm font-medium ${config.iconColor.replace(
                        "600",
                        "800"
                      )}`}
                    >
                      Timeline
                    </p>
                    <p className={`text-xs ${config.iconColor}`}>
                      {config.timelineText}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps or Success Message */}
          <Card className={`${config.cardBorderColor} shadow-lg pt-0`}>
            <CardHeader className={`${config.cardHeaderBg} rounded-t-xl py-4`}>
              <CardTitle className="flex items-center gap-3 text-white">
                {config.showNextSteps ? (
                  <InfoIcon size={24} weight="duotone" />
                ) : verificationStatus === "VERIFIED" ? (
                  <ConfettiIcon size={24} weight="duotone" />
                ) : (
                  <InfoIcon size={24} weight="duotone" />
                )}
                {config.showNextSteps
                  ? "What Happens Next?"
                  : verificationStatus === "VERIFIED"
                  ? "Welcome to FeeBook!"
                  : verificationStatus === "REJECTED"
                  ? "Next Steps"
                  : "Important Information"}
              </CardTitle>
              <CardDescription className="text-white/90">
                {config.showNextSteps
                  ? "Steps in the verification process"
                  : verificationStatus === "VERIFIED"
                  ? "You're all set to get started"
                  : verificationStatus === "REJECTED"
                  ? "How to proceed with resubmission"
                  : "Additional details about your status"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.showNextSteps ? (
                // Processing status - show verification steps
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">
                        Document Review
                      </h4>
                      <p className="text-sm text-yellow-600">
                        Our team will verify your submitted documents and
                        information
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">
                        Verification Process
                      </h4>
                      <p className="text-sm text-yellow-600">
                        Background checks and compliance verification will be
                        performed
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">
                        Approval & Activation
                      </h4>
                      <p className="text-sm text-yellow-600">
                        Once approved, your account will be activated with full
                        access
                      </p>
                    </div>
                  </div>
                </div>
              ) : verificationStatus === "VERIFIED" ? (
                // Verified status - show success message and features
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <ConfettiIcon
                      size={48}
                      className="text-green-600 mx-auto mb-3"
                      weight="fill"
                    />
                    <h3 className="font-semibold text-green-800 mb-2">
                      Congratulations!
                    </h3>
                    <p className="text-sm text-green-600 mb-4">
                      Your account is now fully verified and you have access to
                      all platform features.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/${SLUGS.PROVIDER}/members`}
                      className="text-center p-3 bg-green-50 rounded-lg"
                    >
                      <UserPlusIcon
                        size={24}
                        className="text-green-600 mx-auto mb-1"
                      />
                      <p className="text-xs font-medium text-green-800">
                        Manage Members
                      </p>
                    </Link>
                    <Link
                      href={`/${SLUGS.PROVIDER}/fee-management`}
                      className="text-center p-3 bg-green-50 rounded-lg"
                    >
                      <FileTextIcon
                        size={24}
                        className="text-green-600 mx-auto mb-1"
                      />
                      <p className="text-xs font-medium text-green-800">
                        Create Fee Plans
                      </p>
                    </Link>
                  </div>
                </div>
              ) : verificationStatus === "REJECTED" ? (
                // Rejected status - show resubmission info
                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <WarningIcon size={16} className="text-red-600" />
                    <AlertDescription className="text-red-700">
                      <strong>Common reasons for rejection:</strong> Unclear
                      documents, missing information, or documents that don{`'`}
                      t match your provided details.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-800">
                      How to proceed:
                    </h4>
                    <ul className="text-sm text-red-600 space-y-1 ml-4">
                      <li>
                        • Review your documents for clarity and completeness
                      </li>
                      <li>
                        • Ensure all information matches your official documents
                      </li>
                      <li>
                        • Contact support if you need clarification on
                        requirements
                      </li>
                      <li>• Resubmit your KYC with corrected information</li>
                    </ul>
                  </div>
                </div>
              ) : (
                // Pending status - show action required info
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <InfoIcon size={16} className="text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <strong>Action Required:</strong> We need additional
                      information or clarification to complete your
                      verification.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-800">
                      What you can do:
                    </h4>
                    <ul className="text-sm text-blue-600 space-y-1 ml-4">
                      <li>• Check your email for specific requirements</li>
                      <li>• Update your documents if needed</li>
                      <li>• Contact support for clarification</li>
                      <li>• Resubmit the requested information promptly</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Information - Show for all statuses except verified */}
        {config.showContactInfo && (
          <Card className={`${config.cardBorderColor} shadow-lg pt-0`}>
            <CardHeader className={`${config.cardHeaderBg} rounded-t-xl py-4`}>
              <CardTitle className="flex items-center gap-3 text-white">
                <HandHeartIcon size={24} weight="duotone" />
                Need Help?
              </CardTitle>
              <CardDescription className="text-white/90">
                Our support team is here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <EnvelopeSimpleIcon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      Email Support
                    </h4>
                    <p className="text-sm text-blue-600">
                      {BRAND_SUPPORT_EMAIL}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <PhoneIcon size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">
                      Phone Support
                    </h4>
                    <p className="text-sm text-purple-600">
                      {BRAND_SUPPORT_PHONE}
                    </p>
                  </div>
                </div>
              </div>

              <Alert
                className={`mt-6 ${
                  config.cardBorderColor
                } ${config.iconBgColor.replace("100", "50")}`}
              >
                <InfoIcon size={16} className={config.iconColor} />
                <AlertDescription
                  className={config.iconColor.replace("600", "700")}
                >
                  <strong>Important:</strong> Keep your login credentials
                  secure. We will never ask for your password via email or
                  phone.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {config.actionButtons.map((button, index) => (
            <Button
              key={index}
              size="lg"
              variant={button.variant}
              className={`gap-3 ${button.bgColor}`}
              asChild
            >
              <Link href={button.href}>
                <button.icon size={20} />
                {button.text}
              </Link>
            </Button>
          ))}
        </div>

        {/* Footer Message - Only show for verified status */}
        {verificationStatus === "VERIFIED" && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ConfettiIcon
                size={20}
                className="text-green-500"
                weight="fill"
              />
              <p className="text-lg font-semibold text-green-800">
                Welcome to FeeBook!
              </p>
              <ConfettiIcon
                size={20}
                className="text-green-500"
                weight="fill"
              />
            </div>
            <p className="text-sm text-green-600 max-w-md mx-auto">
              Thank you for choosing our platform. We{`'`}re excited to help you
              streamline your fee management process.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
