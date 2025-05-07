"use server";

import db from "@/lib/db";
import * as bcrypt from "bcryptjs";

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
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
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

export async function loginInstitute(data: {
  email: string;
  password: string;
}) {
  try {
    const user = await db.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      return {
        error: "Invalid credentials",
      };
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      return {
        error: "Invalid credentials",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Error during login:", error);
    return {
      error: "An error occurred during login",
    };
  }
}
