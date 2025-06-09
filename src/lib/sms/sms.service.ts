import sms, { SmsOtpDto, SmsOtpResponse } from "./sms";
import { smsTemplates } from "./templates";

class SmsService {
  async sendOtp(mobile: string, otp: string): Promise<SmsOtpResponse> {
    const payload: SmsOtpDto = {
      template_id: smsTemplates.OTPSMSTEMPLATE,
      realTimeResponse: 1,
      recipients: [
        {
          mobiles: mobile,
          OTP: otp,
        },
      ],
    };

    const response = await this.sendSms(payload);
    return response;
  }

  private async sendSms(payload: SmsOtpDto): Promise<SmsOtpResponse> {
    const response = await sms.post("/", payload);
    return response.data;
  }
}

// Create singleton instance
const smsService = new SmsService();

export default smsService;
