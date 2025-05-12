"use server";

import db from "@/lib/db";

export async function getEnrollments(institutionId: string) {
  try {
    const enrollments = await db.enrollment.findMany({
      where: {
        institutionId: institutionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: enrollments };
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return { success: false, error: "Failed to fetch enrollments" };
  }
}
