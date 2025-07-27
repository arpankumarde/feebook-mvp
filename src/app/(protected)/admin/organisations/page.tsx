"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MagnifyingGlassIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  WarningIcon,
  BuildingsIcon,
  UserIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  BuildingApartmentIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Provider,
  AccountType,
  AccountCategory,
  AccountStatus,
} from "@prisma/client";
import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";

const getStatusBadge = (status: AccountStatus) => {
  const variants: Record<
    AccountStatus,
    {
      variant: "secondary" | "default" | "destructive" | "outline";
      icon: React.ElementType;
      color: string;
    }
  > = {
    [AccountStatus.PENDING]: {
      variant: "secondary",
      icon: ClockIcon,
      color: "text-yellow-600",
    },
    [AccountStatus.APPROVED]: {
      variant: "default",
      icon: CheckCircleIcon,
      color: "text-green-600",
    },
    [AccountStatus.REJECTED]: {
      variant: "destructive",
      icon: XCircleIcon,
      color: "text-red-600",
    },
    [AccountStatus.SUSPENDED]: {
      variant: "outline",
      icon: WarningIcon,
      color: "text-orange-600",
    },
  };

  const config = variants[status] || variants[AccountStatus.PENDING];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {status}
    </Badge>
  );
};

const getCategoryBadge = (category: AccountCategory) => {
  const colors = {
    EDUCATIONAL: "bg-blue-100 text-blue-800",
    HIGHER_EDUCATION: "bg-purple-100 text-purple-800",
    COACHING: "bg-green-100 text-green-800",
    FITNESS_SPORTS: "bg-orange-100 text-orange-800",
    OTHER: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge variant="outline" className={colors[category] || colors.OTHER}>
      {category.replace("_", " ")}
    </Badge>
  );
};

const OrganizationDetails = ({ provider }: { provider: Provider }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={provider.logoUrl || "/"} />
        <AvatarFallback>
          {provider.type === "ORGANIZATION" ? (
            <BuildingApartmentIcon className="h-8 w-8" />
          ) : (
            <UserIcon className="h-8 w-8" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h3 className="text-xl font-semibold">{provider.name}</h3>
        <p className="text-muted-foreground">Code: {provider.code}</p>
        <div className="flex gap-2 mt-2">
          {getStatusBadge(provider.status)}
          {getCategoryBadge(provider.category)}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{provider.adminName}</span>
          </div>
          <div className="flex items-center gap-2">
            <EnvelopeSimpleIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{provider.email}</span>
            {provider.isEmailVerified && (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{provider.phone}</span>
            {provider.isPhoneVerified && (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="text-sm font-medium">{provider.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Location:</span>
            <span className="text-sm">
              {provider.city}, {provider.region}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Created:</span>
          <span className="text-sm">
            {new Date(provider.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Last Updated:</span>
          <span className="text-sm">
            {new Date(provider.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
);

const Page = () => {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [filteredProviders, setFilteredProviders] = useState<Provider[] | null>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );

  // Filter providers based on search and filters
  useEffect(() => {
    let filtered = providers;

    if (searchTerm) {
      filtered =
        filtered?.filter(
          (provider) =>
            provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.adminName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            provider.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) || null;
    }

    if (statusFilter !== "ALL") {
      filtered =
        filtered?.filter((provider) => provider.status === statusFilter) ||
        null;
    }

    if (typeFilter !== "ALL") {
      filtered =
        filtered?.filter((provider) => provider.type === typeFilter) || null;
    }

    if (categoryFilter !== "ALL") {
      filtered =
        filtered?.filter((provider) => provider.category === categoryFilter) ||
        null;
    }

    setFilteredProviders(filtered);
  }, [providers, searchTerm, statusFilter, typeFilter, categoryFilter]);

  const handleStatusChange = (providerId: string, newStatus: AccountStatus) => {
    setProviders(
      (prev) =>
        prev?.map((provider) =>
          provider.id === providerId
            ? { ...provider, status: newStatus }
            : provider
        ) || null
    );
  };

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await api.get<APIResponse<Provider[]>>(
          "/api/v1/moderator/org"
        );

        if (response.data.success && response.data.data) {
          setProviders(response.data.data);
          setFilteredProviders(response.data.data);
        } else {
          console.error("Failed to fetch providers:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };

    fetchProviders();
  }, []);

  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Organisations</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage Organisations
          </p>
        </div>
      </ModeratorTopbar>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Organizations</CardTitle>
            <CardDescription>
              Search and filter organizations by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, code, admin, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="ORGANIZATION">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      <SelectItem value="EDUCATIONAL">Educational</SelectItem>
                      <SelectItem value="HIGHER_EDUCATION">
                        Higher Education
                      </SelectItem>
                      <SelectItem value="COACHING">Coaching</SelectItem>
                      <SelectItem value="FITNESS_SPORTS">
                        Fitness & Sports
                      </SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Organizations ({filteredProviders?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Organization</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Verification</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders?.map((provider) => (
                    <tr
                      key={provider.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={provider.logoUrl || ""} />
                            <AvatarFallback>
                              {provider.type === "ORGANIZATION" ? (
                                <BuildingsIcon className="h-4 w-4" />
                              ) : (
                                <UserIcon className="h-4 w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {provider.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {provider.type === "ORGANIZATION" ? (
                            <BuildingsIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <UserIcon className="h-3 w-3 mr-1" />
                          )}
                          {provider.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {getCategoryBadge(provider.category)}
                      </td>
                      <td className="p-4">{getStatusBadge(provider.status)}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          {provider.city}, {provider.region}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {provider.isEmailVerified && (
                            <EnvelopeSimpleIcon className="h-3 w-3 text-green-600" />
                          )}
                          {provider.isPhoneVerified && (
                            <PhoneIcon className="h-3 w-3 text-green-600" />
                          )}
                          {provider.isVerified && (
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <DotsThreeVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setSelectedProvider(provider);
                                  }}
                                >
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Organization Details
                                  </DialogTitle>
                                  <DialogDescription>
                                    Detailed information about{" "}
                                    {selectedProvider?.name}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedProvider && (
                                  <OrganizationDetails
                                    provider={selectedProvider}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <DropdownMenuSeparator />
                            {provider.status === "PENDING" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(provider.id, "APPROVED")
                                  }
                                >
                                  <CheckCircleIcon className="mr-2 h-4 w-4 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(provider.id, "REJECTED")
                                  }
                                >
                                  <XCircleIcon className="mr-2 h-4 w-4 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {provider.status === "APPROVED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(provider.id, "SUSPENDED")
                                }
                              >
                                <WarningIcon className="mr-2 h-4 w-4 text-orange-600" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {provider.status === "SUSPENDED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(provider.id, "APPROVED")
                                }
                              >
                                <CheckCircleIcon className="mr-2 h-4 w-4 text-green-600" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProviders?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No organizations found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Page;
