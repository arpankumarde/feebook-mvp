import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 120 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // ---- CACHE CHECK ----
    const cacheKey = providerId;
    const cached = dashboardCache.get(cacheKey);
    const nowTime = Date.now();
    if (cached && nowTime - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // Get current date and date ranges for calculations
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch comprehensive dashboard data
    const [
      totalMembers,
      totalFeePlans,
      pendingFeePlans,
      overdueFees,
      thisMonthPayments,
      lastMonthPayments,
      recentTransactions,
      monthlyPayments,
      bankAccounts,
      walletBalance,
    ] = await Promise.all([
      // Total members count
      db.member.count({
        where: { providerId },
      }),

      // Total fee plans
      db.feePlan.aggregate({
        where: { providerId },
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // Pending fee plans
      db.feePlan.aggregate({
        where: {
          providerId,
          status: { in: ["DUE", "OVERDUE"] },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // Overdue fees (due date passed)
      db.feePlan.aggregate({
        where: {
          providerId,
          status: "OVERDUE",
          dueDate: { lt: now },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // This month payments
      db.transaction.aggregate({
        where: {
          feePlan: { providerId },
          status: "SUCCESS",
          paymentTime: {
            gte: thisMonth,
            lte: thisMonthEnd,
          },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // Last month payments
      db.transaction.aggregate({
        where: {
          feePlan: { providerId },
          status: "SUCCESS",
          paymentTime: {
            gte: lastMonth,
            lte: lastMonthEnd,
          },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // Recent transactions (last 10)
      db.transaction.findMany({
        where: {
          feePlan: { providerId },
          status: "SUCCESS",
        },
        include: {
          feePlan: {
            include: {
              member: {
                select: {
                  firstName: true,
                  lastName: true,
                  uniqueId: true,
                },
              },
            },
          },
        },
        orderBy: { paymentTime: "desc" },
        take: 3,
      }),

      // Monthly payments for chart (last 6 months)
      db.transaction.groupBy({
        by: ["paymentTime"],
        where: {
          feePlan: { providerId },
          status: "SUCCESS",
          paymentTime: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),

      // Bank accounts
      db.bankAccount.findMany({
        where: { providerId },
        select: {
          id: true,
          accName: true,
          bankName: true,
          isDefault: true,
          verificationStatus: true,
        },
      }),

      // Wallet balance
      db.provider.findUnique({
        where: { id: providerId },
        select: { walletBalance: true },
      }),
    ]);

    // Calculate growth percentages
    const thisMonthAmount = Number(thisMonthPayments._sum.amount || 0);
    const lastMonthAmount = Number(lastMonthPayments._sum.amount || 0);
    const revenueGrowth =
      lastMonthAmount > 0
        ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
        : thisMonthAmount > 0
        ? 100
        : 0;

    // Process monthly data for charts
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthData = monthlyPayments.filter((payment) => {
        const paymentMonth = payment?.paymentTime;
        return (
          paymentMonth?.getMonth() === month.getMonth() &&
          paymentMonth?.getFullYear() === month.getFullYear()
        );
      });

      return {
        month: month.toLocaleDateString("en-US", { month: "short" }),
        amount: monthData.reduce(
          (sum, item) => sum + Number(item._sum.amount || 0),
          0
        ),
        count: monthData.reduce((sum, item) => sum + item._count._all, 0),
      };
    }).reverse();

    // Recent members (last 5)
    const recentMembers = await db.member.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        uniqueId: true,
        createdAt: true,
        feePlans: {
          where: { status: { in: ["DUE", "OVERDUE"] } },
          select: { amount: true },
        },
      },
    });

    const dashboardData = {
      // Overview stats
      stats: {
        totalMembers: totalMembers,
        totalRevenue: Number(totalFeePlans._sum.amount || 0),
        pendingAmount: Number(pendingFeePlans._sum.amount || 0),
        overdueAmount: Number(overdueFees._sum.amount || 0),
        thisMonthRevenue: thisMonthAmount,
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
        totalFeePlans: totalFeePlans._count._all,
        pendingFeePlans: pendingFeePlans._count._all,
        overdueFeePlans: overdueFees._count._all,
        walletBalance: Number(walletBalance?.walletBalance || 0),
      },

      // Recent transactions
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        amount: Number(transaction.amount),
        paymentTime: transaction.paymentTime,
        memberName: `${transaction.feePlan?.member.firstName} ${
          transaction.feePlan?.member.lastName || ""
        }`.trim(),
        memberUniqueId: transaction.feePlan?.member.uniqueId,
        feePlanName: transaction.feePlan?.name,
      })),

      // Monthly chart data
      monthlyData,

      // Recent members
      recentMembers: recentMembers.map((member) => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        uniqueId: member.uniqueId,
        joinedAt: member.createdAt,
        pendingAmount: member.feePlans.reduce(
          (sum, plan) => sum + Number(plan.amount),
          0
        ),
      })),

      // Bank accounts summary
      bankAccounts: {
        total: bankAccounts.length,
        verified: bankAccounts.filter(
          (acc) => acc.verificationStatus === "VERIFIED"
        ).length,
        hasDefault: bankAccounts.some((acc) => acc.isDefault),
      },
    };

    dashboardCache.set(cacheKey, {
      data: dashboardData,
      timestamp: nowTime,
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}
