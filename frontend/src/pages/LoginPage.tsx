import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export const LoginPage = () => {
  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post('/auth/login', { user_email: email, password });
      setIsLoggedIn(true);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed.");
    }
  };

  return (
    <>
      <div style={{ padding: '2rem' }}>
        <form onSubmit={handleLogin} style={{ border: '1px solid #ccc', padding: '1rem', width: '300px' }}>
          <h2>Login (Cookies)</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button type="submit">Sign In</button>
        </form>
      </div>
    </>
  );
}

  