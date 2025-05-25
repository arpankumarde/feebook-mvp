import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { firstName, lastName, email, phone, password } = await request.json();

  // Validate input
  if (!email || !phone || !password) {
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
    // check if same phone is used for different consumers
    // Check if phone or email already exists
    const existingConsumer = await db.consumer.findFirst({
      where: {
        OR: [{ phone }, { email }],
      },
    });

    if (existingConsumer) {
      const duplicatedField =
        existingConsumer.email === email ? "email" : "phone";
      return NextResponse.json(
        {
          success: false,
          error: `This ${duplicatedField} is already registered`,
          message: `This ${duplicatedField} is already registered`,
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newConsumer = await db.consumer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: newConsumer,
        message: "Consumer created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating consumer:", error);
    return NextResponse.json(
      { success: false, error, message: "Failed to create consumer" },
      { status: 500 }
    );
  }
}
