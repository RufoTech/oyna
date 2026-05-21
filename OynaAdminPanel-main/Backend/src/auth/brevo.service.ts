import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@oyna.com';
  }

  /**
   * Sends OTP verification email to the user.
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f9f9fe;">
        <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 56px; height: 56px; background: #f3f3f8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">🔐</span>
            </div>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #000000; text-align: center; margin: 0 0 8px;">Doğrulama Kodu</h1>
          <p style="font-size: 14px; color: #595f6a; text-align: center; margin: 0 0 32px; line-height: 1.5;">
            Hesabınızı doğrulamaq üçün aşağıdakı kodu istifadə edin. Kod 5 dəqiqə ərzində etibarlıdır.
          </p>
          <div style="background: #f3f3f8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000000;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #717786; text-align: center; margin: 0; line-height: 1.4;">
            Bu e-poçtu siz tələb etməmisinizsə, onu nəzərə almayın.
          </p>
        </div>
        <p style="font-size: 11px; color: #acb2bf; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Oyna Entertainment
        </p>
      </div>
    `;

    return this.sendEmail(email, 'Doğrulama Kodu — Oyna', htmlContent);
  }

  /**
   * Sends password reset email to the user.
   */
  async sendResetPasswordEmail(
    email: string,
    resetCode: string,
  ): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f9f9fe;">
        <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 56px; height: 56px; background: #f3f3f8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">🔑</span>
            </div>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #000000; text-align: center; margin: 0 0 8px;">Şifrə Sıfırlama</h1>
          <p style="font-size: 14px; color: #595f6a; text-align: center; margin: 0 0 32px; line-height: 1.5;">
            Şifrənizi sıfırlamaq üçün aşağıdakı kodu istifadə edin. Kod 10 dəqiqə ərzində etibarlıdır.
          </p>
          <div style="background: #f3f3f8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000000;">${resetCode}</span>
          </div>
          <p style="font-size: 12px; color: #717786; text-align: center; margin: 0; line-height: 1.4;">
            Bu e-poçtu siz tələb etməmisinizsə, onu nəzərə almayın.
          </p>
        </div>
        <p style="font-size: 11px; color: #acb2bf; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Oyna Entertainment
        </p>
      </div>
    `;

    return this.sendEmail(email, 'Şifrə Sıfırlama — Oyna', htmlContent);
  }

  /**
   * Core method: sends an email via Brevo REST API using native fetch.
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: { name: 'Oyna', email: this.senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        this.logger.log(`E-poçt uğurla göndərildi: ${to}`);
        return true;
      } else {
        const errorData = await response.text();
        this.logger.error(`Brevo xətası: ${response.status} — ${errorData}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`E-poçt göndərmə xətası: ${error}`);
      return false;
    }
  }
}
