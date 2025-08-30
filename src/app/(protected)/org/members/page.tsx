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
import { Input } from "@/components/ui/input";
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
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  UsersThreeIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
  UserIcon,
  SpinnerGapIcon,
  XCircleIcon,
  ListChecksIcon,
} from "@phosphor-icons/react/dist/ssr";
import { APIResponse } from "@/types/common";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SimplifiedMemberData {
  id: string;
  memberName: string;
  uniqueId: string;
  phone?: string;
  email?: string;
  category?: string;
  subcategory?: string;
  joinedAt: string;
  pendingFeePlansCount: number;
  totalPendingAmount: number;
  hasOverdueFees: boolean;
  overdueFeePlansCount: number;
}

interface MembersData {
  members: SimplifiedMemberData[];
  totalMembers: number;
  totalPendingFees: number;
  totalMembersWithOverdueFees: number;
}

const MembersPage = () => {
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const [membersData, setMembersData] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const providerId = provider?.id || null;

  useEffect(() => {
    if (isAuthLoading) return;

    const fetchMembers = async () => {
      try {
        if (!providerId) {
          setError("Provider information not found");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const response = await api.get<APIResponse<MembersData>>(
          "/api/v1/provider/member/simplified",
          {
            params: { providerId },
          }
        );

        if (response.data.success && response.data.data) {
          setMembersData(response.data.data);
        } else {
          throw new Error(response.data.error || "Failed to load members");
        }
      } catch (err: any) {
        console.error("Error fetching members:", err);
        setError(err.response?.data?.error || "Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [providerId, isAuthLoading]);

  // Filter members based on search term
  const filteredMembers =
    membersData?.members.filter(
      (member) =>
        member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getStatusBadge = (member: SimplifiedMemberData) => {
    if (member.hasOverdueFees) {
      return (
        <Badge variant="destructive" className="gap-1">
          <WarningIcon size={12} weight="fill" />
          {member.overdueFeePlansCount} Overdue
        </Badge>
      );
    }
    if (member.pendingFeePlansCount > 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          <ClockIcon size={12} weight="fill" />
          {member.pendingFeePlansCount} Pending
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircleIcon size={12} weight="fill" />
        All Paid
      </Badge>
    );
  };

  // Loading state
  if (loading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Members</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your institution's members here.
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <SpinnerGapIcon size={20} className="animate-spin text-primary" />
            <span className="text-muted-foreground">Loading members...</span>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Members</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your institution's members here.
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-4">
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Members</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your institution's members here.
            </p>
          </div>
          <Button className="gap-2 hidden lg:inline-flex" size={"sm"} asChild>
            <Link href={`/${SLUGS.PROVIDER}/members/add`}>
              <PlusIcon weight="bold" />
              Add Member
            </Link>
          </Button>
        </div>
      </ProviderTopbar>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        {membersData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <UsersThreeIcon size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Total Members
                    </p>
                    <p className="text-2xl font-bold">
                      {membersData.totalMembers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <ClockIcon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Pending Fees
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {membersData.totalPendingFees}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search members by name, ID, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2 md:hidden w-full" asChild>
            <Link href={`/${SLUGS.PROVIDER}/members/add`}>
              <PlusIcon weight="bold" />
              Add Member
            </Link>
          </Button>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersThreeIcon size={20} />
              All Members ({filteredMembers.length})
            </CardTitle>
            <CardDescription>
              Manage and view details of all your members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <UserIcon size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No members found" : "No members yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Start by adding your first member to manage their fees and payments."}
                </p>
                {!searchTerm && (
                  <Button className="gap-2" asChild>
                    <Link href={`/${SLUGS.PROVIDER}/members/add`}>
                      <PlusIcon weight="bold" />
                      Add Your First Member
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Details</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="flex gap-2 items-center">
                        <div className="rounded-full size-8 bg-primary/20 flex items-center justify-center text-sm">
                          {(() => {
                            const names = member.memberName.split(" ");
                            const firstChar = names[0]?.[0] || "";
                            const lastChar = names[names.length - 1]?.[0] || "";
                            return (firstChar + lastChar).toUpperCase();
                          })()}
                        </div>
                        <Link
                          href={`/${SLUGS.PROVIDER}/members/view/${member.id}`}
                          className="space-y-1"
                        >
                          <p className="font-medium">{member.memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {member.uniqueId}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {member.phone && (
                            <p className="text-sm">{member.phone}</p>
                          )}
                          {member.email && (
                            <p className="text-sm text-muted-foreground">
                              {member.email}
                            </p>
                          )}
                          {!member.phone && !member.email && (
                            <p className="text-sm text-muted-foreground">
                              No contact info
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {member.category || "Not specified"}
                          </p>
                          {member.subcategory && (
                            <p className="text-xs text-muted-foreground">
                              {member.subcategory}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getStatusBadge(member)}
                          {member.totalPendingAmount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              ₹{member.totalPendingAmount.toLocaleString()}{" "}
                              pending
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2 justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" asChild>
                              <Link
                                href={`/${SLUGS.PROVIDER}/members/edit/${member.id}`}
                              >
                                <PencilIcon weight="duotone" size={16} />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Member</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" asChild>
                              <Link
                                href={`/${SLUGS.PROVIDER}/fee-management?uniqueId=${member.uniqueId}`}
                              >
                                <ListChecksIcon weight="duotone" size={16} />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Fee Plans</TooltipContent>
                        </Tooltip>
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

export default MembersPage;
