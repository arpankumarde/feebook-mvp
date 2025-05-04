"use server";

import db from "@/lib/db";

export type RequestInstituteData = {
  name: string;
  email: string;
  password: string;
  instituteName: string;
  phone: number;
};

export async function requestInstitute(data: RequestInstituteData) {
  try {
    // Simple validation
    if (!data.name || !data.email || !data.instituteName || !data.phone) {
      throw new Error("All fields are required");
    }

    const existingRequest = await db.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingRequest) {
      return {
        error: "Account already requested",
      };
    }

    // Create a new institute request record
    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: "INSTITUTION",
        },
      });

      await tx.institution.create({
        data: {
          name: data.instituteName,
          userId: newUser.id,
        },
      });
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error submitting institute request:", error);
    return {
      error: "An error occurred while submitting your request",
    };
  }
}
