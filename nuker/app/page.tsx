"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [time, setTime] = useState(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0b1020",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px"
    }}>
      <div style={{ fontSize: "48px" }}>👦🏻⚡🔥❄️</div>
      <h1>NUKER</h1>
      <p>Hayatta Kal</p>
      <p>Kalan Süre: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</p>
      <p>⚠️ Canavarlar yakında spawn olacak</p>
    </main>
  );
}
