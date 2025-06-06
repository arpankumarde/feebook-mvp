import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get("consumerId");

    if (!consumerId) {
      return NextResponse.json(
        { success: false, error: "Consumer ID is required" },
        { status: 400 }
      );
    }

    // Single query to get all dashboard data
    const dashboardData = await db.consumer.findUnique({
      where: { id: consumerId },
      include: {
        memberships: {
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
                feePlans: {
                  where: {
                    status: {
                      not: "PAID",
                    },
                  },
                  orderBy: {
                    dueDate: "asc",
                  },
                  select: {
                    id: true,
                    name: true,
                    amount: true,
                    status: true,
                    dueDate: true,
                    isOfflinePaid: true,
                  },
                },
              },
            },
          },
          orderBy: {
            claimedAt: "desc",
          },
        },
        transactions: {
          where: {
            status: "SUCCESS",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            amount: true,
            paymentTime: true,
            feePlan: {
              select: {
                name: true,
                member: {
                  select: {
                    firstName: true,
                    lastName: true,
                    provider: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dashboardData) {
      return NextResponse.json(
        { success: false, error: "Consumer not found" },
        { status: 404 }
      );
    }

    // Calculate dashboard statistics
    const currentDate = new Date();
    let totalPendingAmount = 0;
    let overdueAmount = 0;
    let totalPendingFees = 0;
    let overdueFees = 0;
    let upcomingFees = 0;

    const allFeePlans: any[] = [];

    dashboardData.memberships.forEach((membership) => {
      membership.member.feePlans.forEach((feePlan) => {
        if (!feePlan.isOfflinePaid) {
          allFeePlans.push({
            ...feePlan,
            memberName: `${membership.member.firstName} ${
              membership.member.lastName || ""
            }`.trim(),
            providerName: membership.member.provider.name,
            membershipId: membership.id,
          });

          const amount = Number(feePlan.amount);
          totalPendingAmount += amount;
          totalPendingFees++;

          const dueDate = new Date(feePlan.dueDate);
          if (dueDate < currentDate) {
            overdueAmount += amount;
            overdueFees++;
          } else {
            upcomingFees++;
          }
        }
      });
    });

    // Get recent transactions sum
    const recentPaymentsTotal = dashboardData.transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

    const statistics = {
      totalMemberships: dashboardData.memberships.length,
      totalPendingFees,
      totalPendingAmount,
      overdueFees,
      overdueAmount,
      upcomingFees,
      recentPaymentsTotal,
      recentPaymentsCount: dashboardData.transactions.length,
    };

    // Get urgent fees (due within 7 days or overdue)
    const urgentFees = allFeePlans
      .filter((feePlan) => {
        const dueDate = new Date(feePlan.dueDate);
        const urgentDate = new Date();
        urgentDate.setDate(urgentDate.getDate() + 7);
        return dueDate <= urgentDate;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 5);

    // Transform recent transactions for display
    const recentTransactions = dashboardData.transactions.map(
      (transaction) => ({
        id: transaction.id,
        amount: Number(transaction.amount),
        paymentTime: transaction.paymentTime,
        feePlanName: transaction.feePlan?.name || "Unknown Fee",
        memberName: transaction.feePlan?.member
          ? `${transaction.feePlan.member.firstName} ${
              transaction.feePlan.member.lastName || ""
            }`.trim()
          : "Unknown Member",
        providerName:
          transaction.feePlan?.member?.provider?.name || "Unknown Provider",
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        urgentFees,
        recentTransactions,
        memberships: dashboardData.memberships.map((membership) => ({
          id: membership.id,
          claimedAt: membership.claimedAt,
          memberName: `${membership.member.firstName} ${
            membership.member.lastName || ""
          }`.trim(),
          memberUniqueId: membership.member.uniqueId,
          providerName: membership.member.provider.name,
          providerCategory: membership.member.provider.category,
          pendingFeesCount: membership.member.feePlans.length,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}
