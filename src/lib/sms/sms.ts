import axios from "axios";

export interface SmsOtpDto {
  template_id: string;
  short_url: 0 | 1;
  short_url_expiry: number;
  realTimeResponse: 0 | 1;
  recipients: [
    {
      mobiles: string;
      OTP: string;
    }
  ];
}

export interface SmsOtpResponse {
  message: string;
  type: "success" | "error";
}

const sms = axios.create({
  baseURL: process.env.SMS_GATEWAY_URL,
  headers: {
    authkey: process.env.SMS_GATEWAY_AUTH_KEY,
  },
});

export default sms;
