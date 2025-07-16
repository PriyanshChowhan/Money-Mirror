import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId, name) => {
  return jwt.sign({ userId, name }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    console.error('JWT verification error:', e.message);
    throw e;
  }
};
