"use client";

import { useEffect, useRef, useState } from "react";

type Enemy = {
  id: number;
  x: number;
  y: number;
  type: "wolf" | "bear";
  hp: number;
  slow: number;
};

type Nuke = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "lightning" | "fire" | "ice";
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enemies = useRef<Enemy[]>([]);
  const nukes = useRef<Nuke[]>([]);
  const idRef = useRef(0);

  const hero = { x: 400, y: 300 };

  const [time, setTime] = useState(600);
  const [score, setScore] = useState(0);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);

  const nextLevelExp = 50 * level + 50;

  // TIMER
  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // LEVEL UP
  useEffect(() => {
    if (exp >= nextLevelExp) {
      setExp((e) => e - nextLevelExp);
      setLevel((l) => l + 1);
    }
  }, [exp, nextLevelExp]);

  // SPAWN
  useEffect(() => {
    const spawn = setInterval(() => {
      const type = Math.random() < 0.9 ? "wolf" : "bear";
      enemies.current.push({
        id: idRef.current++,
        x: Math.random() * 800,
        y: Math.random() * 600,
        type,
        hp: type === "wolf" ? 1 : 2,
        slow: 0,
      });
    }, Math.max(300, 900 - level * 50));
    return () => clearInterval(spawn);
  }, [level]);

  // AUTO ATTACK
  useEffect(() => {
    const fire = setInterval(() => {
      if (enemies.current.length === 0) return;

      const target = enemies.current.reduce((a, b) => {
        const da = Math.hypot(a.x - hero.x, a.y - hero.y);
        const db = Math.hypot(b.x - hero.x, b.y - hero.y);
        return da < db ? a : b;
      });

      const dx = target.x - hero.x;
      const dy = target.y - hero.y;
      const d = Math.hypot(dx, dy) || 1;

      const type: Nuke["type"] =
        Math.random() < 0.33
          ? "lightning"
          : Math.random() < 0.5
          ? "fire"
          : "ice";

      nukes.current.push({
        x: hero.x,
        y: hero.y,
        vx: (dx / d) * 5,
        vy: (dy / d) * 5,
        type,
      });
    }, 600);
    return () => clearInterval(fire);
  }, []);

  // GAME LOOP
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 800;
    canvas.height = 600;

    const loop = () => {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, 800, 600);

      ctx.font = "32px serif";
      ctx.fillText("👦🏻", hero.x - 12, hero.y + 12);

      // NUKES
      nukes.current.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        ctx.fillText(
          n.type === "lightning" ? "⚡" : n.type === "fire" ? "🔥" : "❄️",
          n.x,
          n.y
        );
      });

      // ENEMIES
      enemies.current.forEach((e) => {
        const speed = 0.6 * (1 - e.slow);
        const dx = hero.x - e.x;
        const dy = hero.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        e.x += (dx / dist) * speed;
        e.y += (dy / dist) * speed;
        ctx.fillText(e.type === "wolf" ? "🐺" : "🐻", e.x, e.y);
      });

      // COLLISION
      nukes.current = nukes.current.filter((n) => {
        let hit = false;
        enemies.current = enemies.current.filter((e) => {
          if (Math.hypot(e.x - n.x, e.y - n.y) < 20) {
            e.hp--;
            if (n.type === "ice") e.slow = 0.5;
            hit = true;

            if (e.hp <= 0) {
              if (e.type === "wolf") {
                setScore((s) => s + 10);
                setExp((x) => x + 10);
              } else {
                setScore((s) => s + 25);
                setExp((x) => x + 20);
              }
            }

            return e.hp > 0;
          }
          return true;
        });
        return !hit;
      });

      requestAnimationFrame(loop);
    };

    loop();
  }, []);

  return (
    <main style={{ color: "white", textAlign: "center" }}>
      <h1>NUKER</h1>

      {/* HUD */}
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div>⏱️ {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</div>
        <div>⭐ Score: {score}</div>
        <div>🧪 EXP: {exp} / {nextLevelExp}</div>
        <div>🆙 Lv {level}</div>
      </div>

      <canvas ref={canvasRef} />
    </main>
  );
}
