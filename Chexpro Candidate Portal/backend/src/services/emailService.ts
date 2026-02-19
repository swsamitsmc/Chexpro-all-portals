import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user
    ? {
        user: env.smtp.user,
        pass: env.smtp.pass,
      }
    : undefined,
});

export const sendWelcomeEmail = async (
  to: string,
  { companyName, positionTitle, wizardUrl }: { companyName: string; positionTitle: string; wizardUrl: string }
): Promise<void> => {
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Welcome to mycheck — Your background check is ready',
    html: `
      <h1>Welcome to mycheck</h1>
      <p>Your account has been created for the background check requested by ${companyName}.</p>
      <p>Position: ${positionTitle}</p>
      <p>Click here to start your background check: <a href="${wizardUrl}">Start Background Check</a></p>
      <p>You have 14 days to complete it.</p>
      <p>If you have any questions, please contact us at support@chexpro.com</p>
    `,
  };

  await sendEmail(mailOptions);
};

export const sendPasswordResetEmail = async (
  to: string,
  { resetUrl }: { resetUrl: string }
): Promise<void> => {
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Reset your mycheck password',
    html: `
      <h1>Reset Your Password</h1>
      <p>You requested to reset your password. Click the link below:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  await sendEmail(mailOptions);
};

export const sendWizardReminderEmail = async (
  to: string,
  { companyName, daysRemaining, wizardUrl }: { companyName: string; daysRemaining: number; wizardUrl: string }
): Promise<void> => {
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Reminder: Complete your background check',
    html: `
      <h1>Reminder: Background Check Required</h1>
      <p>This is a reminder to complete your background check for ${companyName}.</p>
      <p>You have ${daysRemaining} days remaining to complete it.</p>
      <p><a href="${wizardUrl}">Complete Your Background Check</a></p>
      <p>If you have any questions, please contact us at support@chexpro.com</p>
    `,
  };

  await sendEmail(mailOptions);
};

export const sendWizardCompleteEmail = async (
  to: string,
  { orderNumber, companyName, estimatedDate }: { orderNumber: string; companyName: string; estimatedDate: string }
): Promise<void> => {
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Background check information submitted',
    html: `
      <h1>Background Check Submitted</h1>
      <p>Your background check information has been successfully submitted.</p>
      <p>Reference Number: ${orderNumber}</p>
      <p>Company: ${companyName}</p>
      <p>Estimated Completion: ${estimatedDate}</p>
      <p>We'll notify you when your check is complete.</p>
    `,
  };

  await sendEmail(mailOptions);
};

export const sendAdverseActionEmail = async (
  to: string,
  { orderNumber, companyName }: { orderNumber: string; companyName: string }
): Promise<void> => {
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Important notice regarding your background check',
    html: `
      <h1>Important Notice</h1>
      <p>There is an important update regarding your background check.</p>
      <p>Reference Number: ${orderNumber}</p>
      <p>Company: ${companyName}</p>
      <p>Please log in to your account to review the details.</p>
      <p>If you have questions, please contact us at support@chexpro.com</p>
    `,
  };

  await sendEmail(mailOptions);
};

const sendEmail = async (options: nodemailer.SendMailOptions): Promise<void> => {
  try {
    if (env.nodeEnv === 'development') {
      const testAccount = await nodemailer.createTestAccount();
      logger.info(`Test email account: ${testAccount.user}`);
    }

    const info = await transporter.sendMail(options);
    
    if (env.nodeEnv === 'development') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

export default transporter;
