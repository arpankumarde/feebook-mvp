"use client";

import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { Policy } from "@prisma/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SLUGS } from "@/constants/slugs";
import Link from "next/link";
import {
  CalendarIcon,
  FileTextIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

const Page = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const response = await api.get<APIResponse<Policy[]>>(
        "/api/v1/moderator/policy"
      );
      setPolicies(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const PolicySkeleton = () => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Policies</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage company policies
            </p>
          </div>
          <Button className="w-fit gap-2" asChild>
            <Link href={`/${SLUGS.MODERATOR}/policies/add`}>
              <PlusIcon weight="bold" />
              Add Policy
            </Link>
          </Button>
        </div>
      </ModeratorTopbar>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-4">
            <PolicySkeleton />
            <PolicySkeleton />
            <PolicySkeleton />
          </div>
        ) : policies.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <FileTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No policies found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first policy
              </p>
              <Button className="gap-2">
                <PlusIcon />
                Create Policy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <Card
                key={policy.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-primary" />
                        {policy.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link
                          href={`/${SLUGS.MODERATOR}/policies/${policy.id}`}
                        >
                          <PencilSimpleIcon className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Created: {formatDate(policy.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Updated: {formatDate(policy.updatedAt)}
                      </div>
                    </div>
                    <Badge variant={policy.content ? "default" : "secondary"}>
                      {policy.content ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
