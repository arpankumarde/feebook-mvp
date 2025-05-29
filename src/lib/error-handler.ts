import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Centralized error handler for API routes
 * Provides consistent error responses and logging
 */
export class ApiErrorHandler {
  /**
   * Handle Prisma errors and return appropriate HTTP responses
   */
  static handlePrismaError(error: unknown): NextResponse {
    console.error("Database error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Record already exists", code: error.code },
            { status: 409 }
          );
        case "P2025":
          return NextResponse.json(
            { error: "Record not found", code: error.code },
            { status: 404 }
          );
        default:
          return NextResponse.json(
            { error: "Database constraint violation", code: error.code },
            { status: 400 }
          );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return NextResponse.json(
        { error: "Critical database error" },
        { status: 500 }
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }

  /**
   * Handle general API errors
   */
  static handleApiError(error: unknown, defaultMessage: string = "Internal server error"): NextResponse {
    console.error("API error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: defaultMessage },
      { status: 500 }
    );
  }
}
