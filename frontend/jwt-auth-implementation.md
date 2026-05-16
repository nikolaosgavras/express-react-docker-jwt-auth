cl# JWT Authentication with Axios Implementation Guide

This guide explains how to add secure authentication to your Express + React app using JSON Web Tokens (JWT) and Axios.

## 1. Prerequisites & Installation

You need to install the following packages:

**Backend:**
```bash
cd backend
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

**Frontend:**
```bash
cd frontend
npm install axios
```

---

## 2. Backend Implementation

### A. Create the Auth Route (`backend/src/routes/auth.ts`)
This route handles user login by verifying credentials and issuing a JWT.

```typescript
import Router from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();
const JWT_SECRET = 'your_super_secret_key'; // In production, use process.env.JWT_SECRET

router.post('/login', async (req, res) => {
  const { user_email, password } = req.body;

  try {
    // 1. Find user by email
    const [rows]: any = await pool.query('SELECT * FROM users WHERE user_email = ?', [user_email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Check password
    const validPassword = await bcrypt.compare(password, user.user_password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.user_email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user.id, name: user.user_name, email: user.user_email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
```

### B. Create Authentication Middleware (`backend/src/middleware/auth.ts`)
Use this to protect routes that require a logged-in user.

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_super_secret_key';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### C. Protect Routes in `index.ts`
```typescript
import authRouter from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

// ... other imports

app.use('/api/auth', authRouter);

// Protect the users route:
app.use('/api/users', authenticateToken, usersRouter);
```

---

## 3. Frontend Implementation with Axios

### A. Configure Axios (`frontend/src/api.ts`)
Create a central axios instance that automatically attaches the JWT to every request.

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy handles this
});

// Interceptor: Add Token to Headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Or use a routing library
    }
    return Promise.reject(error);
  }
);

export default api;
```

### B. Login Usage in `App.tsx`
This example shows how to build a login form that uses the `api` instance and manages the login state.

```tsx
import { useState, useEffect } from "react";
import api from "./api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 1. Check if token exists on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // 2. Handle the login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { 
        user_email: email, 
        password 
      });
      
      // Save token to localStorage
      localStorage.setItem("token", res.data.token);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '2rem' }}>
        <form onSubmit={handleLogin} style={{ border: '1px solid #ccc', padding: '1rem', width: '300px' }}>
          <h2>Login</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome Back!</h1>
      <button onClick={handleLogout}>Logout</button>
      {/* Your Protected Components go here, e.g., <UsersManager /> */}
    </div>
  );
}

export default App;
```

---

## 4. How It Works (Explanation)

### The JWT Flow
1. **Login**: The user sends their email and password to the backend.
2. **Verification**: The backend checks the database. If correct, it creates a "signed" string called a JWT.
3. **Storage**: The frontend receives this token and stores it in `localStorage`.
4. **Authorized Requests**: Every time you use `api.get()` or `api.post()`, the **Axios Interceptor** grabs the token from storage and adds it to the `Authorization` header.
5. **Validation**: The backend middleware (`authenticateToken`) checks the header, verifies the signature using the `JWT_SECRET`, and allows the request if valid.

### Why Axios?
- **Interceptors**: They are powerful! You don't have to manually add the token to every single `fetch` call in every component. You define the logic once in `api.ts`.
- **Automatic JSON Parsing**: Axios automatically converts your data to JSON strings for requests and back to JS objects for responses.
- **Better Error Handling**: Axios throws errors for non-2xx status codes (like 401 or 500), making it easier to catch API failures.
