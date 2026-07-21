import React, { useState } from "react";

export default function DebugApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDebug("");
    try {
      const payload = { auth_user_id: userId, password };
      setDebug("Enviando: " + JSON.stringify(payload));
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      setDebug(d => d + "\nStatus: " + res.status + " " + res.statusText);
      
      const text = await res.text();
      setDebug(d => d + "\nRespuesta: " + text.substring(0, 300));
      
      try {
        const data = JSON.parse(text);
        if (data.status === "success") {
          setLoggedIn(true);
        } else {
          setError(data.message || data.error || "Error desconocido");
        }
      } catch {
        setError("No es JSON: " + text.substring(0, 200));
      }
    } catch (err: any) {
      setError("Fetch error: " + err.message);
      setDebug(d => d + "\nFetch error: " + err.message);
    }
  };

  if (loggedIn) {
    return (
      <div style={{ background: "#0b0e11", color: "#4ade80", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h1>✅ OK — {userId}</h1>
      </div>
    );
  }

  return (
    <div style={{ background: "#0b0e11", color: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ background: "#1e2329", padding: "32px", borderRadius: "16px", width: "400px" }}>
        <h2>Debug Login</h2>
        <form onSubmit={handleLogin}>
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Usuario (ej: user_cajero_1)"
            style={{ width: "100%", padding: "8px", marginBottom: "8px", background: "#2b3139", border: "none", borderRadius: "8px", color: "white" }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (ej: 123456)" type="text"
            style={{ width: "100%", padding: "8px", marginBottom: "8px", background: "#2b3139", border: "none", borderRadius: "8px", color: "white" }} />
          <button type="submit"
            style={{ width: "100%", padding: "10px", background: "#f0b90b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginBottom: "16px" }}>
            Probar
          </button>
        </form>
        {error && <div style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px", whiteSpace: "pre-wrap" }}>{error}</div>}
        {debug && <pre style={{ fontSize: "10px", color: "#9ca3af", whiteSpace: "pre-wrap", background: "#0d1117", padding: "8px", borderRadius: "8px" }}>{debug}</pre>}
      </div>
    </div>
  );
}
