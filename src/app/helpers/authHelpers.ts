import bcrypt from 'bcrypt';

import config from '../configs';

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = config.auth.bcrypt_salt_rounds; // Salt rounds
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// Compare password
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> =>
  await bcrypt.compare(password, hashedPassword);

export const authHelpers = {
  hashPassword,
  comparePassword,
};
