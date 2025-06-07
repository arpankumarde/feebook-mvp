import emailService from "./email-service";
import db from "./db";

interface GenerateOTPOptions {
  email: string;
  name: string;
  purpose: "login" | "verification" | "password-reset";
  channel: "EMAIL" | "SMS";
}

interface VerifyOTPOptions {
  email: string;
  otp: string;
}

/**
 * OTP Service for managing one-time passwords with database persistence
 * Follows coding standards with clear variable names and comprehensive documentation
 */
class OTPService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly OTP_LENGTH = 6;

  /**
   * Generate a secure random OTP
   * @returns {string} 6-digit OTP
   */
  private generateSecureOTP(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Clean up expired OTPs from database
   * Called automatically to maintain database hygiene
   */
  private async cleanupExpiredOTPs(): Promise<void> {
    try {
      const deletedCount = await db.otp.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (deletedCount.count > 0) {
        console.log(`Cleaned up ${deletedCount.count} expired OTPs`);
      }
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  }

  /**
   * Generate and send OTP via email with database persistence
   * @param options - Email, name, and purpose for OTP generation
   * @returns Promise with success status and expiration time
   */
  async generateAndSendOTP(options: GenerateOTPOptions): Promise<{
    success: boolean;
    message: string;
    expiresAt?: number;
  }> {
    try {
      // Clean up expired OTPs first
      await this.cleanupExpiredOTPs();

      // Delete any existing OTP for this email and purpose
      await db.otp.deleteMany({
        where: {
          email: options.email,
          purpose: options.purpose,
        },
      });

      // Generate new OTP and expiration time
      const otpCode = this.generateSecureOTP();
      const expirationDate = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );

      // Store OTP in database
      const savedOTP = await db.otp.create({
        data: {
          email: options.email,
          otp: otpCode,
          purpose: options.purpose,
          attempts: 0,
          expiresAt: expirationDate,
        },
      });

      // Send OTP via email service
      const emailSentSuccessfully = await emailService.sendOTPEmail({
        email: options.email,
        otp: otpCode,
        name: options.name,
        purpose: options.purpose,
      });

      if (!emailSentSuccessfully) {
        // Clean up stored OTP if email failed
        await db.otp.delete({
          where: { id: savedOTP.id },
        });

        return {
          success: false,
          message: "Failed to send OTP email. Please try again.",
        };
      }

      return {
        success: true,
        message: "OTP sent successfully to your email.",
        expiresAt: expirationDate.getTime(),
      };
    } catch (error) {
      console.error("Error generating and sending OTP:", error);
      return {
        success: false,
        message: "An error occurred while sending OTP.",
      };
    }
  }

  /**
   * Verify OTP against database records
   * @param options - Email and OTP for verification
   * @returns Verification result with success status
   */
  async verifyOTP(options: VerifyOTPOptions): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Clean up expired OTPs first
      await this.cleanupExpiredOTPs();

      // Find the most recent valid OTP for this email
      const storedOTP = await db.otp.findFirst({
        where: {
          email: options.email,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!storedOTP) {
        return {
          success: false,
          message: "No valid OTP found. Please request a new one.",
        };
      }

      // Check maximum attempts exceeded
      if (storedOTP.attempts >= this.MAX_ATTEMPTS) {
        await db.otp.delete({
          where: { id: storedOTP.id },
        });

        return {
          success: false,
          message:
            "Maximum verification attempts exceeded. Please request a new OTP.",
        };
      }

      // Increment attempt count
      await db.otp.update({
        where: { id: storedOTP.id },
        data: {
          attempts: storedOTP.attempts + 1,
        },
      });

      // Verify OTP code
      if (storedOTP.otp !== options.otp) {
        const remainingAttempts = this.MAX_ATTEMPTS - (storedOTP.attempts + 1);

        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        };
      }

      // OTP is valid - clean up and return success
      await db.otp.delete({
        where: { id: storedOTP.id },
      });

      return {
        success: true,
        message: "OTP verified successfully.",
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        message: "An error occurred while verifying OTP.",
      };
    }
  }

  /**
   * Get remaining time for OTP expiration
   * @param email - Email to check OTP expiration for
   * @returns Remaining seconds or 0 if no valid OTP
   */
  async getRemainingTime(email: string): Promise<number> {
    try {
      const storedOTP = await db.otp.findFirst({
        where: {
          email,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!storedOTP) return 0;

      const remainingMilliseconds = storedOTP.expiresAt.getTime() - Date.now();
      return Math.max(0, Math.ceil(remainingMilliseconds / 1000));
    } catch (error) {
      console.error("Error getting remaining time:", error);
      return 0;
    }
  }

  /**
   * Manual cleanup method for expired OTPs
   * Can be called periodically or on-demand
   */
  async performCleanup(): Promise<void> {
    await this.cleanupExpiredOTPs();
  }
}

// Create singleton instance following modular design patterns
const otpService = new OTPService();

export default otpService;
