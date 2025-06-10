"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import api from "@/lib/api";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  CalendarIcon,
  IdentificationBadgeIcon,
  SpinnerGapIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
  CurrencyInrIcon,
  LinkIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Member, FeePlan } from "@prisma/client";
import { APIResponse } from "@/types/common";
import { formatAmount } from "@/utils/formatAmount";

interface MemberWithDetails extends Member {
  feePlans: FeePlan[];
  consumerMemberships: Array<{
    id: string;
    claimedAt: string;
    consumer: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
    };
  }>;
}

const MemberDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const memberId = params.memberId as string;

  const [member, setMember] = useState<MemberWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch member details using existing API
        const response = await api.get<APIResponse<MemberWithDetails>>(
          "/api/v1/provider/member",
          {
            params: {
              providerId: provider.id,
              memberId: memberId,
            },
          }
        );

        if (response.data.success && response.data.data) {
          setMember(response.data.data);
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

  const getFeePlanStatusBadge = (status: string, dueDate: Date) => {
    const today = new Date();
    const due = dueDate;

    switch (status) {
      case "PAID":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircleIcon size={12} weight="fill" />
            Paid
          </Badge>
        );
      case "DUE":
        if (due < today) {
          return (
            <Badge variant="destructive" className="gap-1">
              <WarningIcon size={12} weight="fill" />
              Overdue
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="gap-1 border-blue-500 text-blue-600"
          >
            <ClockIcon size={12} weight="fill" />
            Due
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Member Details
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              View member information and fee plans
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
  if (error || !member) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Member Details
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              View member information and fee plans
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription>{error || "Member not found"}</AlertDescription>
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

  const memberName = [member.firstName, member.middleName, member.lastName]
    .filter(Boolean)
    .join(" ");

  const pendingFeePlans = member.feePlans.filter(
    (plan) => plan.status !== "PAID"
  );
  const totalPendingAmount = pendingFeePlans.reduce(
    (sum, plan) => sum + Number(plan.amount),
    0
  );

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Member Details
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              {memberName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeftIcon size={16} />
              Back
            </Button>
            <Button className="gap-2" asChild>
              <Link href={`/${SLUGS.PROVIDER}/members/edit/${member.id}`}>
                <PencilIcon size={16} />
                Edit Member
              </Link>
            </Button>
          </div>
        </div>
      </ProviderTopbar>

      <div className="p-4 space-y-6">
        {/* Member Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size={20} />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Full Name
                    </p>
                    <p className="text-lg font-semibold">{memberName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Member ID
                    </p>
                    <div className="flex items-center gap-2">
                      <IdentificationBadgeIcon size={16} />
                      <p className="font-medium">{member.uniqueId}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Gender
                    </p>
                    <p>{member.gender || "Not specified"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Category
                    </p>
                    <p>{member.category || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Subcategory
                    </p>
                    <p>{member.subcategory || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Date of Birth
                    </p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} />
                      <p>
                        {member.dateOfBirth
                          ? new Date(member.dateOfBirth).toLocaleDateString()
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <PhoneIcon size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{member.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <EnvelopeSimpleIcon
                      size={16}
                      className="text-muted-foreground"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{member.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              {(member.guardianName || member.relationship) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Guardian Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Guardian Name
                        </p>
                        <p>{member.guardianName || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Relationship
                        </p>
                        <p>{member.relationship || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyInrIcon size={20} />
                Fee Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Pending Amount
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{totalPendingAmount.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {member.feePlans.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Plans</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-orange-600">
                    {pendingFeePlans.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>

              <Separator />

              {/* App Link Status */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">App Connection</h4>
                {member.consumerMemberships.length > 0 ? (
                  <div className="space-y-2">
                    <Badge
                      variant="default"
                      className="gap-1 bg-green-600 w-full justify-center"
                    >
                      <LinkIcon size={12} />
                      Linked to App
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <p>
                        Linked by:{" "}
                        {member.consumerMemberships[0].consumer.firstName}{" "}
                        {member.consumerMemberships[0].consumer.lastName}
                      </p>
                      <p>
                        Date:{" "}
                        {new Date(
                          member.consumerMemberships[0].claimedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 w-full justify-center"
                  >
                    <UserIcon size={12} />
                    Not Linked
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Plans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon size={20} />
                Fee Plans ({member.feePlans.length})
              </CardTitle>
              <CardDescription>All fee plans for this member</CardDescription>
            </div>
            <div>
              <Button className="gap-2" asChild>
                <Link
                  href={`/${SLUGS.PROVIDER}/fee-management?uniqueId=${member.uniqueId}`}
                >
                  Update Fee Plans
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {member.feePlans.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon
                  size={48}
                  className="mx-auto mb-4 text-muted-foreground opacity-50"
                />
                <p className="text-muted-foreground">
                  No fee plans found for this member.
                </p>
                <Button className="mt-4 gap-2" asChild>
                  <Link
                    href={`/${SLUGS.PROVIDER}/fee-management?uniqueId=${member.uniqueId}`}
                  >
                    Add Fee Plans
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.feePlans
                    .sort(
                      (a, b) =>
                        new Date(a.dueDate).getTime() -
                        new Date(b.dueDate).getTime()
                    )
                    .map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {formatAmount(Number(plan.amount))}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>{new Date(plan.dueDate).toLocaleDateString()}</p>
                        </TableCell>
                        <TableCell>
                          {getFeePlanStatusBadge(plan.status, plan.dueDate)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MemberDetailPage;
