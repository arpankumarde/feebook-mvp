import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json(
      { success: false, error: "Provider ID is required" },
      { status: 400 }
    );
  }

  try {
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: Prisma.TransactionWhereInput = {
      feePlan: {
        providerId: providerId,
      },
    };

    // Add status filter
    if (status && status !== "all") {
      whereClause.status = status as any;
    }

    // Add date range filter
    if (startDate || endDate) {
      whereClause.paymentTime = {};
      if (startDate) {
        whereClause.paymentTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.paymentTime.lte = new Date(endDate);
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        {
          externalPaymentId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          bankReference: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          feePlan: {
            member: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  uniqueId: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ];
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where: whereClause,
        include: {
          feePlan: {
            include: {
              member: {
                select: {
                  id: true,
                  uniqueId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              externalOrderId: true,
            },
          },
        },
        orderBy: {
          paymentTime: "desc",
        },
        skip,
        take: limit,
      }),
      db.transaction.count({
        where: whereClause,
      }),
    ]);

    // Calculate statistics for all transactions (not just current page)
    const allTransactions = await db.transaction.findMany({
      where: {
        feePlan: {
          providerId: providerId,
        },
      },
      select: {
        status: true,
        amount: true,
      },
    });

    const stats = allTransactions.reduce(
      (acc, transaction) => {
        acc.totalTransactions++;
        acc.totalAmount += Number(transaction.amount);

        switch (transaction.status) {
          case "SUCCESS":
            acc.successfulPayments++;
            acc.successfulAmount += Number(transaction.amount);
            break;
          case "PENDING":
            acc.pendingPayments++;
            break;
          case "FAILED":
          case "CANCELLED":
          case "USER_DROPPED":
          case "VOID":
            acc.failedPayments++;
            break;
        }

        return acc;
      },
      {
        totalTransactions: 0,
        totalAmount: 0,
        successfulPayments: 0,
        successfulAmount: 0,
        pendingPayments: 0,
        failedPayments: 0,
      }
    );

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json(
      {
        success: true,
        data: {
          payments: transactions,
          stats,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limit,
            hasNextPage,
            hasPreviousPage,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching provider payments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
