import { getEnvVar } from '../helpers/getEnvVar';

const emailConfig = {
  adminEmail: getEnvVar('ADMIN_EMAIL'),
  email: getEnvVar('SMTP_EMAIL'),
  app_pass: getEnvVar('SMTP_PASS'),
  contact_mail_address: getEnvVar('CONTACT_MAIL_ADDRESS'),
};

export default emailConfig;
