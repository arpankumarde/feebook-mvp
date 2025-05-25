import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { phone, password } = await request.json();

  // Validate input
  if (!phone || !password) {
    return NextResponse.json(
      {
        success: false,
        error: "All fields are required",
        message: "All fields are required",
      },
      { status: 400 }
    );
  }

  try {
    // Check if consumer exists
    const existingConsumer = await db.consumer.findUnique({
      where: { phone },
    });

    if (!existingConsumer) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer not found",
          message: "Consumer not found",
        },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingConsumer.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
          message: "Invalid password",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, user: existingConsumer, message: "Login successful" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error, message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
