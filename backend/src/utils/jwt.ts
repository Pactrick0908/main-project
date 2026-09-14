import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "123";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = async (payload: {
  googleId: string;
  email: string;
  walletAddress: string;
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = async (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
