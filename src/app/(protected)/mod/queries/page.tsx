"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatCircleTextIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import api from "@/lib/api";
import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

interface Query {
  id: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/api/v1/moderator/queries");

      if (response.data.success) {
        setQueries(response.data.data);
      } else {
        throw new Error(response.data.error || "Failed to fetch queries");
      }
    } catch (error: any) {
      console.error("Error fetching queries:", error);
      setError(error.response?.data?.error || "Failed to fetch queries");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveQuery = async (queryId: string) => {
    try {
      setUpdating(queryId);

      const response = await api.patch("/api/v1/moderator/queries", {
        queryId,
      });

      if (response.data.success) {
        setQueries((prevQueries) =>
          prevQueries.map((query) =>
            query.id === queryId
              ? {
                  ...query,
                  status: "RESOLVED",
                  updatedAt: new Date().toISOString(),
                }
              : query
          )
        );
        toast.success("Query marked as resolved successfully");
      } else {
        throw new Error(response.data.error || "Failed to update query");
      }
    } catch (error: any) {
      console.error("Error updating query:", error);
      toast.error(error.response?.data?.error || "Failed to update query");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="destructive" className="gap-1">
            <ClockIcon size={12} weight="fill" />
            Open
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircleIcon size={12} weight="fill" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <SpinnerGapIcon size={24} className="animate-spin text-primary" />
            <span className="font-medium">Loading queries...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={fetchQueries} variant="outline" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Queries Management
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and resolve customer queries
            </p>
          </div>

          <Button
            className="gap-2 max-md:hidden"
            size={"sm"}
            onClick={fetchQueries}
            variant={"secondary"}
          >
            <ArrowsClockwiseIcon size={16} weight="fill" />
            Refresh
          </Button>
        </div>
      </ModeratorTopbar>

      <div className="container mx-auto p-6">
        {queries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ChatCircleTextIcon
                size={48}
                className="text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">No queries found</h3>
              <p className="text-muted-foreground text-center">
                There are no customer queries at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queries.map((query) => (
              <Card key={query.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {query.subject || "No Subject"}
                        </CardTitle>
                        {getStatusBadge(query.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {query.email && (
                          <div className="flex items-center gap-1">
                            <EnvelopeIcon size={14} />
                            {query.email}
                          </div>
                        )}
                        {query.phone && (
                          <div className="flex items-center gap-1">
                            <PhoneIcon size={14} />
                            {query.phone}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created:{" "}
                        {format(new Date(query.createdAt), "PPP 'at' pp")}
                        {query.updatedAt !== query.createdAt && (
                          <span className="ml-2">
                            • Updated:{" "}
                            {format(new Date(query.updatedAt), "PPP 'at' pp")}
                          </span>
                        )}
                      </div>
                    </div>

                    {query.status === "OPEN" && (
                      <Button
                        onClick={() => handleResolveQuery(query.id)}
                        disabled={updating === query.id}
                        size="sm"
                        className="gap-2"
                      >
                        {updating === query.id ? (
                          <>
                            <SpinnerGapIcon
                              size={14}
                              className="animate-spin"
                            />
                            Resolving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon size={14} weight="fill" />
                            Mark as Resolved
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Message:</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {query.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
