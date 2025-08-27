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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MagnifyingGlassIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  CalendarIcon,
  UsersThreeIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  FunnelIcon,
  CrownIcon,
  SealCheckIcon,
  EnvelopeIcon,
  SealWarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { Consumer } from "@prisma/client";

interface IConsumer extends Consumer {
  _count: {
    memberships: number;
  };
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

const UserDetailsModal = ({ user }: { user: IConsumer }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src="" />
        <AvatarFallback className="text-lg">
          {user?.firstName?.[0] ?? ""}
          {user?.lastName?.[0] ?? ""}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h3 className="text-xl font-semibold">
          {user.firstName} {user.lastName}
        </h3>
        <p className="text-muted-foreground">{user.id}</p>
        <div className="flex gap-2 mt-2">
          <Badge
            variant={user.isPhoneVerified ? "default" : "secondary"}
            className="gap-1"
          >
            {user.isPhoneVerified ? (
              <CheckCircleIcon size={12} weight="fill" />
            ) : (
              <XCircleIcon size={12} weight="fill" />
            )}
            {user.isPhoneVerified ? "Verified" : "Unverified"}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <UsersThreeIcon size={12} />
            {user._count.memberships} Memberships
          </Badge>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="gap-2 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <PhoneIcon
              className="h-4 w-4 text-muted-foreground"
              weight="duotone"
            />
            <span className="text-sm">+91 {user.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <EnvelopeIcon
              className="h-4 w-4 text-muted-foreground"
              weight="duotone"
            />
            <span className="text-sm">{user.email || "Not provided"}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-2 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span
              className={`text-sm font-medium ${
                user.isPhoneVerified ? "text-green-600" : "text-orange-600"
              }`}
            >
              {user.isPhoneVerified ? "Active" : "Pending Verification"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Memberships:</span>
            <span className="text-sm font-medium">
              {user._count.memberships}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card className="gap-2 py-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Joined:</span>
          <span className="text-sm">
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Last Updated:</span>
          <span className="text-sm">
            {new Date(user.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
);

const Page = () => {
  const [consumers, setConsumers] = useState<IConsumer[]>([]);
  const [filteredConsumers, setFilteredConsumers] = useState<IConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [membershipFilter, setMembershipFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<IConsumer | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
  });

  useEffect(() => {
    let filtered = consumers;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.phone?.includes(searchTerm) ||
          user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (verificationFilter !== "ALL") {
      filtered = filtered.filter((user) => {
        if (verificationFilter === "VERIFIED") return user.isPhoneVerified;
        if (verificationFilter === "UNVERIFIED") return !user.isPhoneVerified;
        return true;
      });
    }

    if (membershipFilter !== "ALL") {
      filtered = filtered.filter((user) => {
        if (membershipFilter === "HAS_MEMBERSHIPS")
          return user._count.memberships > 0;
        if (membershipFilter === "NO_MEMBERSHIPS")
          return user._count.memberships === 0;
        return true;
      });
    }

    setFilteredConsumers(filtered);
  }, [consumers, searchTerm, verificationFilter, membershipFilter]);

  useEffect(() => {
    if (consumers.length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const newThisMonth = consumers.filter((user) => {
        const createdDate = new Date(user.createdAt);
        return (
          createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear
        );
      }).length;

      setStats({
        totalUsers: consumers.length,
        verifiedUsers: consumers.filter((user) => user.isPhoneVerified).length,
        unverifiedUsers: consumers.filter((user) => !user.isPhoneVerified)
          .length,
        activeUsers: consumers.filter((user) => user._count.memberships > 0)
          .length,
        newUsersThisMonth: newThisMonth,
      });
    }
  }, [consumers]);

  useEffect(() => {
    const fetchConsumers = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get<APIResponse<IConsumer[]>>(
          "/api/v1/moderator/consumers"
        );
        if (data.success && data.data) {
          setConsumers(data.data);
          setFilteredConsumers(data.data);
        } else {
          throw new Error(data.error || "Failed to fetch users");
        }
      } catch (error: any) {
        console.error("Error fetching consumers:", error);
        setError(error.response?.data?.error || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchConsumers();
  }, []);

  const getFullName = (user: Consumer) => `${user.firstName} ${user.lastName}`;

  if (loading) {
    return (
      <>
        <ModeratorTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Users</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage Users
            </p>
          </div>
        </ModeratorTopbar>

        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <SpinnerGapIcon size={20} className="animate-spin text-primary" />
            <span className="text-muted-foreground">Loading users...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ModeratorTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Users</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage Users
            </p>
          </div>
        </ModeratorTopbar>

        <div className="p-4">
          <Alert variant="destructive">
            <WarningCircleIcon size={16} />
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
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Users</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage platform users
          </p>
        </div>
      </ModeratorTopbar>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UsersThreeIcon size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Verified
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.verifiedUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <XCircleIcon size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Unverified
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.unverifiedUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CrownIcon size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.activeUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CalendarIcon size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    New This Month
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.newUsersThisMonth}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FunnelIcon size={20} className="text-primary" weight="duotone" />
              Filter Users
            </CardTitle>
            <CardDescription>
              Search and filter users by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification">Verification Status</Label>
                <Select
                  value={verificationFilter}
                  onValueChange={setVerificationFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="membership">Membership Status</Label>
                <Select
                  value={membershipFilter}
                  onValueChange={setMembershipFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="HAS_MEMBERSHIPS">
                      Has Memberships
                    </SelectItem>
                    <SelectItem value="NO_MEMBERSHIPS">
                      No Memberships
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersThreeIcon
                size={20}
                className="text-primary"
                weight="duotone"
              />
              All Users ({filteredConsumers.length})
            </CardTitle>
            <CardDescription>
              Manage and view details of all platform users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredConsumers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <UserIcon size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ||
                  verificationFilter !== "ALL" ||
                  membershipFilter !== "ALL"
                    ? "No users found"
                    : "No users yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  verificationFilter !== "ALL" ||
                  membershipFilter !== "ALL"
                    ? "Try adjusting your search or filter criteria"
                    : "Users will appear here as they sign up"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Memberships</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsumers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" />
                              <AvatarFallback className="text-sm bg-primary/20">
                                {user?.firstName?.[0].toUpperCase() ?? ""}
                                {user?.lastName?.[0].toUpperCase() ?? ""}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium capitalize">
                                {getFullName(user)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <PhoneIcon
                                size={14}
                                className="text-muted-foreground"
                              />
                              <span className="text-sm">+91 {user.phone}</span>
                            </div>
                            {user.email && (
                              <div className="flex items-center gap-2">
                                <EnvelopeSimpleIcon
                                  size={14}
                                  className="text-muted-foreground"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {user.isPhoneVerified ? (
                            <SealCheckIcon
                              size={20}
                              weight="fill"
                              className="text-green-800/80"
                            />
                          ) : (
                            <SealWarningIcon
                              size={20}
                              weight="fill"
                              className="text-red-700/85"
                            />
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex gap-2 border rounded-lg px-2 py-1 bg-muted">
                              <UsersThreeIcon size={20} />
                              {user._count.memberships}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              }
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Dialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <DotsThreeVerticalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setSelectedUser(user);
                                    }}
                                  >
                                    <EyeIcon className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <UserIcon className="mr-2 h-4 w-4" />
                                  View Memberships
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent className="min-w-2xl max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about{" "}
                                  {selectedUser && getFullName(selectedUser)}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <UserDetailsModal user={selectedUser} />
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Page;
