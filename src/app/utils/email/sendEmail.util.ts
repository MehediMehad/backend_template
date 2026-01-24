import nodemailer from 'nodemailer';

import emailConfig from '../../configs/email.config';
import { getEnvVar } from '../../helpers/getEnvVar';

export const sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailHTML?: string,
) => {
  const transporter = nodemailer.createTransport({
    host: getEnvVar('SMTP_HOST'),
    port: Number(getEnvVar('SMTP_PORT', '465')),
    secure: getEnvVar('SMTP_SECURE') === 'true',
    auth: {
      user: getEnvVar('SMTP_EMAIL'),
      pass: getEnvVar('SMTP_PASS'),
    },
  });

  await transporter.verify(); // 🔍 debug helper

  const mailOptions = {
    from: emailConfig.email,
    to: emailTo,
    subject: EmailSubject,
    html: EmailHTML,
  };

  return await transporter.sendMail(mailOptions);
};
