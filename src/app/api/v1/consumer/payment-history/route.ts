import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get("consumerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!consumerId) {
      return NextResponse.json(
        { success: false, error: "Consumer ID is required" },
        { status: 400 }
      );
    }

    // Verify consumer exists
    const consumer = await db.consumer.findUnique({
      where: { id: consumerId },
    });

    if (!consumer) {
      return NextResponse.json(
        { success: false, error: "Consumer not found" },
        { status: 404 }
      );
    }

    // Build where clause for filtering
    const whereClause: any = {
      consumerId: consumerId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch transactions with related data
    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where: whereClause,
        include: {
          feePlan: {
            include: {
              member: {
                include: {
                  provider: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              externalOrderId: true,
              orderTags: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      db.transaction.count({
        where: whereClause,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Transform data for frontend
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      externalPaymentId: transaction.externalPaymentId,
      amount: Number(transaction.amount),
      status: transaction.status,
      paymentTime: transaction.paymentTime,
      paymentCurrency: transaction.paymentCurrency,
      paymentMessage: transaction.paymentMessage,
      bankReference: transaction.bankReference,
      paymentMethod: transaction.paymentMethod,
      paymentGroup: transaction.paymentGroup,
      paymentGateway: transaction.paymentGateway,
      feePlan: transaction.feePlan
        ? {
            id: transaction.feePlan.id,
            name: transaction.feePlan.name,
            description: transaction.feePlan.description,
            member: {
              id: transaction.feePlan.member.id,
              uniqueId: transaction.feePlan.member.uniqueId,
              firstName: transaction.feePlan.member.firstName,
              middleName: transaction.feePlan.member.middleName,
              lastName: transaction.feePlan.member.lastName,
              provider: transaction.feePlan.member.provider,
            },
          }
        : null,
      order: transaction.order,
      createdAt: transaction.createdAt,
    }));

    // Calculate summary statistics
    const summaryStats = await db.transaction.aggregate({
      where: { consumerId: consumerId },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    const successfulPayments = await db.transaction.aggregate({
      where: {
        consumerId: consumerId,
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
        },
        summary: {
          totalTransactions: summaryStats._count._all || 0,
          totalAmount: Number(summaryStats._sum.amount || 0),
          successfulPayments: successfulPayments._count._all || 0,
          successfulAmount: Number(successfulPayments._sum.amount || 0),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
