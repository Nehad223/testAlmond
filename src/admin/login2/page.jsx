import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../admin.css";
export default function AdminLogin2() {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch("https://snackalmond.duckdns.org/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        sessionStorage.setItem("token", data.token);
        if (data.userType === "almond") {
          navigate("/admin/edit", { replace: true });
        } else if (data.userType === "cashier") {
          navigate("/cashier", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="Admin_Login container">
      <h1>Admin Login</h1>
      <div className="login-card">
        {error && <p style={{ color: "red" }}>{error}</p>}

        <input
          type="text"
          placeholder="username"
          onChange={(e) => setusername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}
