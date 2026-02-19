import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { EmailOptions } from '../types';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (err) {
    logger.error(`Failed to send email to ${options.to}:`, err);
    // Don't throw - email failures shouldn't break the main flow
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

export function invitationEmailTemplate(params: {
  applicantName: string;
  clientName: string;
  portalLink: string;
  expiresInDays: number;
  welcomeMessage?: string;
}): { subject: string; html: string } {
  return {
    subject: `Action Required: Complete Your Background Check - ${params.clientName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
  .header { background: #1e40af; color: white; padding: 24px; text-align: center; }
  .content { padding: 32px 24px; }
  .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { background: #f3f4f6; padding: 16px 24px; font-size: 12px; color: #6b7280; }
</style></head>
<body>
  <div class="header"><h1>ChexPro Background Check</h1></div>
  <div class="content">
    <p>Hello ${params.applicantName},</p>
    ${params.welcomeMessage ? `<p>${params.welcomeMessage}</p>` : ''}
    <p><strong>${params.clientName}</strong> has requested a background check as part of their screening process.</p>
    <p>Please click the button below to securely complete your background check form. Your information is encrypted and protected.</p>
    <p style="text-align:center;margin:32px 0">
      <a href="${params.portalLink}" class="btn">Complete Background Check</a>
    </p>
    <p>This link expires in <strong>${params.expiresInDays} days</strong>. If you have questions, contact your hiring team directly.</p>
  </div>
  <div class="footer">
    <p>This is a secure, encrypted link. Do not share it with others.</p>
    <p>Powered by ChexPro | <a href="https://chexpro.com">chexpro.com</a></p>
  </div>
</body>
</html>`,
  };
}

export function orderCompletedEmailTemplate(params: {
  userName: string;
  applicantName: string;
  orderNumber: string;
  portalLink: string;
}): { subject: string; html: string } {
  return {
    subject: `Report Ready: Background Check ${params.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
  .header { background: #1e40af; color: white; padding: 24px; text-align: center; }
  .content { padding: 32px 24px; }
  .status { background: #d1fae5; border: 1px solid #6ee7b7; padding: 12px 16px; border-radius: 6px; color: #065f46; }
  .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { background: #f3f4f6; padding: 16px 24px; font-size: 12px; color: #6b7280; }
</style></head>
<body>
  <div class="header"><h1>Report Ready</h1></div>
  <div class="content">
    <p>Hello ${params.userName},</p>
    <div class="status">✅ Background check for <strong>${params.applicantName}</strong> is complete.</div>
    <p>Order Number: <strong>${params.orderNumber}</strong></p>
    <p style="text-align:center;margin:32px 0">
      <a href="${params.portalLink}" class="btn">Download Report</a>
    </p>
  </div>
  <div class="footer"><p>Powered by ChexPro | <a href="https://chexpro.com">chexpro.com</a></p></div>
</body>
</html>`,
  };
}

export function passwordResetEmailTemplate(params: {
  userName: string;
  resetLink: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  return {
    subject: 'Password Reset Request - ChexPro Portal',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
  .header { background: #1e40af; color: white; padding: 24px; text-align: center; }
  .content { padding: 32px 24px; }
  .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { background: #f3f4f6; padding: 16px 24px; font-size: 12px; color: #6b7280; }
</style></head>
<body>
  <div class="header"><h1>Password Reset</h1></div>
  <div class="content">
    <p>Hello ${params.userName},</p>
    <p>We received a request to reset your password. Click the button below:</p>
    <p style="text-align:center;margin:32px 0">
      <a href="${params.resetLink}" class="btn">Reset Password</a>
    </p>
    <p>This link expires in <strong>${params.expiresInMinutes} minutes</strong>.</p>
    <p>If you did not request this, please ignore this email.</p>
  </div>
  <div class="footer"><p>Powered by ChexPro | <a href="https://chexpro.com">chexpro.com</a></p></div>
</body>
</html>`,
  };
}

export function orderStatusUpdateEmailTemplate(params: {
  userName: string;
  applicantName: string;
  orderNumber: string;
  status: string;
  message: string;
  portalLink: string;
}): { subject: string; html: string } {
  return {
    subject: `Order Update: ${params.orderNumber} - ${params.status}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
  .header { background: #1e40af; color: white; padding: 24px; text-align: center; }
  .content { padding: 32px 24px; }
  .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { background: #f3f4f6; padding: 16px 24px; font-size: 12px; color: #6b7280; }
</style></head>
<body>
  <div class="header"><h1>Order Update</h1></div>
  <div class="content">
    <p>Hello ${params.userName},</p>
    <p>Your background check order <strong>${params.orderNumber}</strong> for <strong>${params.applicantName}</strong> has been updated.</p>
    <p><strong>Status:</strong> ${params.status}</p>
    <p>${params.message}</p>
    <p style="text-align:center;margin:32px 0">
      <a href="${params.portalLink}" class="btn">View Order</a>
    </p>
  </div>
  <div class="footer"><p>Powered by ChexPro | <a href="https://chexpro.com">chexpro.com</a></p></div>
</body>
</html>`,
  };
}
