import { useState } from "react";
import './../admin.css';
export default function AdminLogin() {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
        window.location.href = "/admin";
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
