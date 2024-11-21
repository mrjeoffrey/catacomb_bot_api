import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const generateToken = (payload: object, expiresIn: string | number = '1h') =>
    jwt.sign(payload, JWT_SECRET, { expiresIn });

export const verifyToken = (token: string) =>
    jwt.verify(token, JWT_SECRET);
