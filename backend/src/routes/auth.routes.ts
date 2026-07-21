import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, organization_id, role } = req.body;

    if (!email || !name || !password || !organization_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user_id = uuidv4();
    const password_hash = Buffer.from(password).toString('base64');

    await query(
      `INSERT INTO users (id, email, name, password_hash, role, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user_id, email, name, password_hash, role || 'viewer', organization_id]
    );

    logger.info('User registered', { email, organization_id });
    res.status(201).json({ id: user_id, email, name, role });
  } catch (error) {
    logger.error('Registration error', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = Buffer.from(password).toString('base64') === user.password_hash;

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('User logged in', { email });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
