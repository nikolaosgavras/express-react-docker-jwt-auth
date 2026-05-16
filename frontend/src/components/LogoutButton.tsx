import { useAuth } from "../context/AuthContext";
import api from "../api";
import { useNavigate } from "react-router";

export const LogoutButton = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setIsLoggedIn(false);
      navigate("/login")
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};
