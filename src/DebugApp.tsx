import React, { useState } from "react";

/**
 * Minimal debug App — strips everything to isolate the blank screen bug.
 */
export default function DebugApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_user_id: userId, password })
      });
      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("mock_user_id", data.data.auth_user_id);
        setLoggedIn(true);
      } else {
        setError(data.message || "Credenciales inválidas");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  if (loggedIn) {
    return (
      <div style={{ background: "#0b0e11", color: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1>✅ Login exitoso</h1>
          <p>Usuario: {localStorage.getItem("mock_user_id")}</p>
          <button onClick={() => { localStorage.clear(); setLoggedIn(false); }}
            style={{ padding: "8px 16px", marginTop: "16px", background: "#f0b90b", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0b0e11", color: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1e2329", padding: "32px", borderRadius: "16px", width: "320px" }}>
        <h2 style={{ marginBottom: "16px" }}>Login Debug</h2>
        {error && <p style={{ color: "#f87171", fontSize: "12px" }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Usuario"
            style={{ width: "100%", padding: "8px", marginBottom: "8px", background: "#2b3139", border: "none", borderRadius: "8px", color: "white" }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password"
            style={{ width: "100%", padding: "8px", marginBottom: "16px", background: "#2b3139", border: "none", borderRadius: "8px", color: "white" }} />
          <button type="submit"
            style={{ width: "100%", padding: "10px", background: "#f0b90b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Ingresar
          </button>
        </form>
        <p style={{ fontSize: "10px", color: "#666", marginTop: "12px", textAlign: "center" }}>
          user_maría_126 / GARM2026
        </p>
      </div>
    </div>
  );
}
