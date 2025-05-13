import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const enrollmentId = searchParams.get("enrollmentId");

  if (!enrollmentId) {
    return NextResponse.json(
      { success: false, error: "Enrollment ID is required" },
      { status: 400 }
    );
  }

  try {
    // Find the enrollment by enrollmentId
    const enrollment = await db.enrollment.findUnique({
      where: {
        enrollmentId,
      },
      include: {
        fees: {
          include: {
            paymentSessions: {
              where: {
                isPaid: false,
              },
              orderBy: {
                dueDate: "asc",
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Get the latest unpaid fee session
    const unpaidFees = enrollment.fees
      .flatMap((fee) => fee.paymentSessions)
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

    const latestUnpaidFee = unpaidFees.length > 0 ? unpaidFees[0] : null;

    return NextResponse.json({
      enrollment,
      latestUnpaidFee,
    });
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment details" },
      { status: 500 }
    );
  }
}
