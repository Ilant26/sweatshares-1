import express, { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Types
interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  languages: string[];
  skills: string[];
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  friend: Profile;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log environment variables (for debugging, remove in production)
console.log('Environment variables:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease ensure these variables are set in your .env.local file');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateUser: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  void supabase.auth.getUser(token)
    .then(({ data: { user }, error }) => {
      if (error || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email!
      };
      next();
    })
    .catch((error: any) => {
      res.status(500).json({ error: error.message });
    });
};

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// Profile routes
const getProfile: RequestHandler = (req: Request, res: Response): void => {
  const { userId } = req.params;
  void supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
    });
};

const updateProfile: RequestHandler = (req: Request, res: Response): void => {
  const { userId } = req.params;
  const authenticatedReq = req as AuthenticatedRequest;
  
  // Ensure user can only update their own profile
  if (authenticatedReq.user?.id !== userId) {
    res.status(403).json({ error: 'Not authorized to update this profile' });
    return;
  }

  const updates = req.body as Partial<Profile>;
  void supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
    });
};

// Project routes
const getUserProjects: RequestHandler = (req: Request, res: Response): void => {
  const { userId } = req.params;
  void supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .then(({ data, error }) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
    });
};

const createProject: RequestHandler = (req: Request, res: Response): void => {
  const authenticatedReq = req as AuthenticatedRequest;
  const project = {
    ...req.body,
    user_id: authenticatedReq.user?.id
  } as Omit<Project, 'id' | 'created_at' | 'updated_at'>;

  void supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(201).json(data);
    });
};

// Network routes
const getUserNetwork: RequestHandler = (req: Request, res: Response): void => {
  const { userId } = req.params;
  void supabase
    .from('friendships')
    .select(`
      *,
      friend:friend_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .then(({ data, error }) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
    });
};

// Route handlers
app.get('/api/profile/:userId', authenticateUser, getProfile);
app.put('/api/profile/:userId', authenticateUser, updateProfile);
app.get('/api/projects/:userId', authenticateUser, getUserProjects);
app.post('/api/projects', authenticateUser, createProject);
app.get('/api/network/:userId', authenticateUser, getUserNetwork);

// Add error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 