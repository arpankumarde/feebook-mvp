"use client";

import { useEffect, useState } from "react";
import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { Transaction } from "@prisma/client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

interface TransactionData {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch whenever page changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<APIResponse<TransactionData>>(
          `/api/v1/moderator/transactions?page=${page}&limit=${limit}`
        );
        const payload = res.data.data!;
        setTransactions(payload.transactions);
        setTotalPages(payload.pagination.totalPages);
      } catch (err: any) {
        setError(err.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, limit]);

  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Payment Logs</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            View Payment Logs
          </p>
        </div>
      </ModeratorTopbar>

      <div className="p-4 space-y-4">
        {loading && <p className="text-center">Loading…</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {!loading && !error && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.orderId}</TableCell>
                    <TableCell>{tx.externalPaymentId}</TableCell>
                    <TableCell>
                      {tx.amount.toString()} {tx.paymentCurrency}
                    </TableCell>
                    <TableCell>{tx.status}</TableCell>
                    <TableCell>
                      {tx.paymentTime
                        ? new Date(tx.paymentTime).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1"
              >
                <CaretLeftIcon size={16} /> Previous
              </Button>

              <p>
                Page {page} of {totalPages}
              </p>

              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1"
              >
                Next <CaretRightIcon size={16} />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
