import emailService from "./email-service";

interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

interface GenerateOTPOptions {
  email: string;
  name: string;
  purpose: "login" | "verification" | "password-reset";
}

interface VerifyOTPOptions {
  email: string;
  otp: string;
}

class OTPService {
  private otpStorage = new Map<string, OTPData>();
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly OTP_LENGTH = 6;

  /**
   * Generate a random OTP
   */
  private generateOTP(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Generate and send OTP via email
   */
  async generateAndSendOTP(options: GenerateOTPOptions): Promise<{
    success: boolean;
    message: string;
    expiresAt?: number;
  }> {
    try {
      // Clear any existing OTP for this email
      this.otpStorage.delete(options.email);

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000;

      // Store OTP
      this.otpStorage.set(options.email, {
        otp,
        expiresAt,
        attempts: 0,
      });

      // Send OTP via email
      const emailSent = await emailService.sendOTPEmail({
        email: options.email,
        otp,
        name: options.name,
        purpose: options.purpose,
      });

      if (!emailSent) {
        this.otpStorage.delete(options.email);
        return {
          success: false,
          message: "Failed to send OTP email. Please try again.",
        };
      }

      return {
        success: true,
        message: "OTP sent successfully to your email.",
        expiresAt,
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
   * Verify OTP
   */
  verifyOTP(options: VerifyOTPOptions): {
    success: boolean;
    message: string;
  } {
    const otpData = this.otpStorage.get(options.email);

    if (!otpData) {
      return {
        success: false,
        message: "No OTP found. Please request a new one.",
      };
    }

    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      this.otpStorage.delete(options.email);
      return {
        success: false,
        message: "OTP has expired. Please request a new one.",
      };
    }

    // Check maximum attempts
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStorage.delete(options.email);
      return {
        success: false,
        message:
          "Maximum verification attempts exceeded. Please request a new OTP.",
      };
    }

    // Increment attempt count
    otpData.attempts++;

    // Verify OTP
    if (otpData.otp !== options.otp) {
      return {
        success: false,
        message: `Invalid OTP. ${
          this.MAX_ATTEMPTS - otpData.attempts
        } attempts remaining.`,
      };
    }

    // OTP is valid, clean up
    this.otpStorage.delete(options.email);
    return {
      success: true,
      message: "OTP verified successfully.",
    };
  }

  /**
   * Clean up expired OTPs (run periodically)
   */
  cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [email, otpData] of this.otpStorage.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStorage.delete(email);
      }
    }
  }

  /**
   * Get remaining time for OTP
   */
  getRemainingTime(email: string): number {
    const otpData = this.otpStorage.get(email);
    if (!otpData) return 0;

    const remaining = otpData.expiresAt - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}

// Create singleton instance
const otpService = new OTPService();

// Clean up expired OTPs every minute
setInterval(() => {
  otpService.cleanupExpiredOTPs();
}, 60000);

export default otpService;
