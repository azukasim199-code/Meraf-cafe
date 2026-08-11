import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'meraf-cafe-jwt-secret-key-addis-ababa-2026';

authRouter.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isValid = db.verifyUserPassword(user.id, password);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  db.addAuditLog(user.id, user.email, 'STAFF_LOGIN', `User ${user.name} (${user.role}) logged in successfully.`);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

authRouter.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, message: 'Logged out successfully' });
});
