import nodemailer from 'nodemailer';

import { getEnvVar } from '../../helpers/getEnvVar';
import config from '../../../configs';

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
    from: config.mail.email,
    to: emailTo,
    subject: EmailSubject,
    html: EmailHTML,
  };

  return await transporter.sendMail(mailOptions);
};
