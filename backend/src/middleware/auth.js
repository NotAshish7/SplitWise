import jwt from 'jsonwebtoken';
import { createStandardResponse } from '../utils/responses.js';

// Middleware to require authentication
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return res.status(401).json(createStandardResponse(false, null, 'Missing authorization token'));
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'SmartExpense2025SecretKey');
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json(createStandardResponse(false, null, 'Invalid or expired token'));
  }
}

// Alias for backward compatibility
export const authRequired = requireAuth;

// Issue JWT token
export function issueJwt(userId, email) {
  const payload = { 
    sub: userId, 
    email: email 
  };
  const token = jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'SmartExpense2025SecretKey', 
    { expiresIn: '7d' }
  );
  return token;
}


