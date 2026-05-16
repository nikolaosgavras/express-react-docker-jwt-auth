import { Router } from "express"; //
import bcrypt from "bcrypt"; // password hashing
import jwt from "jsonwebtoken"; // for issuing json web token
import pool from "../db.js"; // for connection pool
import { authenticateToken } from "../middleware/auth.js";

const router = Router()
const JWT_SECRET = 'secret';

router.post('/login', async (req, res) => {
  const { user_email, password } = req.body;

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE user_email = ?', [user_email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password."});
    }

    const validPassword = await bcrypt.compare(password, user.user_password);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password" }); 
    }

    const token = jwt.sign(
      { id: user.id, name: user.user_name, email: user.user_email },
      JWT_SECRET, {expiresIn: "1h"}
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 3600000
    });

    res.json({ user: {id: user.id, name: user.user_name, email: user.user_email } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error." });
  }

});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});

router.get('/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user }); // req.user was set by the middleware
});

export default router;