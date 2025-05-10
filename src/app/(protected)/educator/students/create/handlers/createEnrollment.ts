"use server";

import db from "@/lib/db";
import { z } from "zod";

const enrollmentSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  studentEmail: z.string().email("Invalid email").optional().nullable(),
  studentPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(10, "Phone number must be exactly 10 digits"),
  institutionId: z.string().min(1, "Institution ID is required"),
  feeTitle: z.string().min(1, "Fee title is required"),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  monthlyAmount: z.number().min(0, "Monthly amount must be positive"),
  startDate: z.date(),
  endDate: z.date(),
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

export async function createEnrollment(data: EnrollmentFormData) {
  try {
    // Validate the input data
    const validatedData = enrollmentSchema.parse(data);

    // Generate a unique enrollment ID (you can customize this format)
    const enrollmentId = `ENR-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Create the enrollment in a transaction to ensure both enrollment and fee are created
    const result = await db.$transaction(async (tx) => {
      // Create the enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          institutionId: validatedData.institutionId,
          studentName: validatedData.studentName,
          studentEmail: validatedData.studentEmail || null,
          studentPhone: validatedData.studentPhone
            ? `+91${validatedData.studentPhone}`
            : null,
          enrollmentId: enrollmentId,
        },
      });

      // Create the fee associated with this enrollment
      const fee = await tx.fee.create({
        data: {
          enrollmentId: enrollment.id,
          institutionId: validatedData.institutionId,
          title: validatedData.feeTitle,
          totalAmount: validatedData.totalAmount,
          monthlyAmount: validatedData.monthlyAmount,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          paidAmount: 0,
        },
      });

      return { enrollment, fee };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating enrollment:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    return { success: false, error: "Failed to create enrollment" };
  }
}
