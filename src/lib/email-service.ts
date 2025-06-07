import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OTPEmailData {
  email: string;
  otp: string;
  name: string;
  purpose: "login" | "verification" | "password-reset";
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailConfig: EmailConfig = {
      host: process.env.EMAIL_HOST ?? "",
      port: parseInt(process.env.EMAIL_PORT ?? "0"),
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("SMTP connection failed:", error);
      return false;
    }
  }

  /**
   * Send email with custom content
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"FeeBook" <${process.env.EMAIL_ADDR || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  /**
   * Send OTP email with branded template
   */
  async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    const purposeText = {
      login: "login to your account",
      verification: "verify your account",
      "password-reset": "reset your password",
    };

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verification - FeeBook</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #2563eb; padding: 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .otp-box { background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 10px 0; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FeeBook</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>You requested to ${
                purposeText[data.purpose]
              }. Please use the following OTP to complete your request:</p>
              
              <div class="otp-box">
                <p>Your OTP Code:</p>
                <div class="otp-code">${data.otp}</div>
                <p><small>This code will expire in 5 minutes</small></p>
              </div>

              <div class="warning">
                <strong>Security Notice:</strong> Do not share this OTP with anyone. FeeBook will never ask for your OTP via phone or email.
              </div>

              <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
              
              <p>Best regards,<br>The FeeBook Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} FeeBook. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      Hello ${data.name},

      You requested to ${
        purposeText[data.purpose]
      }. Please use the following OTP to complete your request:

      OTP Code: ${data.otp}

      This code will expire in 5 minutes.

      Security Notice: Do not share this OTP with anyone. FeeBook will never ask for your OTP via phone or email.

      If you didn't request this OTP, please ignore this email or contact our support team.

      Best regards,
      The FeeBook Team
    `;

    return await this.sendEmail({
      to: data.email,
      subject: `FeeBook OTP Verification`,
      html: htmlTemplate,
      text: textContent,
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
