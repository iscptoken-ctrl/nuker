"use client";

import { useEffect, useRef, useState } from "react";

type Enemy = {
  id: number;
  x: number;
  y: number;
  type: "wolf" | "bear";
  hp: number;
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState(600);
  const enemies = useRef<Enemy[]>([]);
  const enemyId = useRef(0);

  // TIMER
  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // SPAWN
  useEffect(() => {
    const spawn = setInterval(() => {
      const type = Math.random() < 0.9 ? "wolf" : "bear";
      enemies.current.push({
        id: enemyId.current++,
        x: Math.random() * 800,
        y: Math.random() * 600,
        type,
        hp: type === "wolf" ? 1 : 2,
      });
    }, 800);
    return () => clearInterval(spawn);
  }, []);

  // GAME LOOP
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 800;
    canvas.height = 600;

    const hero = { x: 400, y: 300 };

    const loop = () => {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // HERO
      ctx.font = "32px serif";
      ctx.fillText("👦🏻", hero.x - 12, hero.y + 12);

      // ENEMIES
      enemies.current.forEach((e) => {
        const dx = hero.x - e.x;
        const dy = hero.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;

        e.x += (dx / dist) * 0.5;
        e.y += (dy / dist) * 0.5;

        ctx.fillText(e.type === "wolf" ? "🐺" : "🐻", e.x, e.y);
      });

      requestAnimationFrame(loop);
    };

    loop();
  }, []);

  return (
    <main style={{ color: "white", textAlign: "center" }}>
      <h1>NUKER</h1>
      <p>
        Kalan Süre: {Math.floor(time / 60)}:
        {String(time % 60).padStart(2, "0")}
      </p>
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid #333", background: "#000" }}
      />
    </main>
  );
}
