"use client";

import { useEffect, useRef, useState } from "react";

type EnemyType = "wolf" | "bear" | "boss";
type NukeType = "lightning" | "fire" | "ice";

type Enemy = {
  id: number;
  x: number;
  y: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  slow: number;
  burn: number;
};

type Nuke = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: NukeType;
  chainLeft: number;
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enemies = useRef<Enemy[]>([]);
  const nukes = useRef<Nuke[]>([]);
  const idRef = useRef(0);

  const hero = { x: 400, y: 300 };

  /* HUD */
  const [time, setTime] = useState(600);
  const [score, setScore] = useState(0);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);

  /* Skills */
  const [skillPoints, setSkillPoints] = useState(0);
  const [showSkills, setShowSkills] = useState(false);
  const [skills, setSkills] = useState({
    lightningChain: 0,
    lightningDamage: 0,
    fireBurn: 0,
    fireDamage: 0,
    iceSlow: 0,
    iceDamage: 0,
  });

  const nextLevelExp = 100 + (level - 1) * 50;

  /* TIMER */
  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* LEVEL UP */
  useEffect(() => {
    if (exp >= nextLevelExp) {
      setExp((e) => e - nextLevelExp);
      setLevel((l) => l + 1);
      setSkillPoints((p) => p + 1);
    }
  }, [exp, nextLevelExp]);

  /* SPAWN */
  useEffect(() => {
    const spawn = setInterval(() => {
      const isBear = Math.random() < 0.1;
      const type: EnemyType = isBear ? "bear" : "wolf";
      const hp = type === "wolf" ? 1 : 2;

      enemies.current.push({
        id: idRef.current++,
        x: Math.random() * 800,
        y: Math.random() * 600,
        type,
        hp,
        maxHp: hp,
        slow: 0,
        burn: 0,
      });
    }, Math.max(300, 900 - level * 40));

    return () => clearInterval(spawn);
  }, [level]);

  /* AUTO ATTACK */
  useEffect(() => {
    const fire = setInterval(() => {
      if (!enemies.current.length) return;
      const t = enemies.current[0];
      const dx = t.x - hero.x;
      const dy = t.y - hero.y;
      const d = Math.hypot(dx, dy) || 1;

      const r = Math.random();
      const type: NukeType = r < 0.33 ? "lightning" : r < 0.66 ? "fire" : "ice";

      nukes.current.push({
        x: hero.x,
        y: hero.y,
        vx: (dx / d) * 6,
        vy: (dy / d) * 6,
        type,
        chainLeft: type === "lightning" ? 1 + skills.lightningChain : 0,
      });
    }, 500);

    return () => clearInterval(fire);
  }, [skills]);

  /* GAME LOOP */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 800;
    canvas.height = 600;

    const loop = () => {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, 800, 600);

      ctx.font = "28px serif";
      ctx.fillText("👦🏻", hero.x - 10, hero.y + 10);

      enemies.current.forEach((e) => {
        if (e.burn > 0) {
          e.burn--;
          e.hp -= 0.02 * (1 + skills.fireDamage);
        }

        const dx = hero.x - e.x;
        const dy = hero.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        const slow = Math.min(0.8, e.slow * (0.3 + skills.iceSlow * 0.2));

        e.x += (dx / d) * 0.6 * (1 - slow);
        e.y += (dy / d) * 0.6 * (1 - slow);

        ctx.fillText(e.type === "wolf" ? "🐺" : "🐻", e.x, e.y);
      });

      nukes.current = nukes.current.filter((n) => {
        n.x += n.vx;
        n.y += n.vy;

        ctx.fillText(
          n.type === "lightning" ? "⚡" : n.type === "fire" ? "🔥" : "❄️",
          n.x,
          n.y
        );

        const hitEnemy = enemies.current.find(
          (e) => Math.hypot(e.x - n.x, e.y - n.y) < 20
        );

        if (hitEnemy) {
          const dmg =
            1 +
            (n.type === "lightning"
              ? skills.lightningDamage
              : n.type === "fire"
              ? skills.fireDamage
              : skills.iceDamage);

          hitEnemy.hp -= dmg;

          if (n.type === "ice") hitEnemy.slow = 1;
          if (n.type === "fire") hitEnemy.burn = 180 + skills.fireBurn * 60;

          if (hitEnemy.hp <= 0) {
            setScore((s) => s + (hitEnemy.type === "bear" ? 25 : 10));
            setExp((e) => e + (hitEnemy.type === "bear" ? 20 : 10));
          }

          enemies.current = enemies.current.filter((e) => e.hp > 0);
          return false;
        }

        return true;
      });

      requestAnimationFrame(loop);
    };

    loop();
  }, [skills]);

  return (
    <main style={{ color: "white", textAlign: "center" }}>
      <h1>NUKER</h1>

      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div>⏱ {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</div>
        <div>⭐ {score}</div>
        <div>🆙 Lv {level}</div>
        <button onClick={() => setShowSkills(true)}>
          🧠 Skills ({skillPoints})
        </button>
      </div>

      {/* EXP BAR */}
      <div style={{ width: "80%", margin: "10px auto" }}>
        <div style={{ fontSize: 12 }}>
          EXP: {Math.floor(exp)} / {nextLevelExp}
        </div>
        <div style={{ background: "#333", height: 10, borderRadius: 6 }}>
          <div
            style={{
              width: `${Math.min(100, (exp / nextLevelExp) * 100)}%`,
              height: "100%",
              background: "linear-gradient(90deg,#00ffcc,#00aa88)",
              borderRadius: 6,
            }}
          />
        </div>
      </div>

      <canvas ref={canvasRef} />

      {showSkills && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <h2>🧠 SKILLS</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 200px)", gap: 12 }}>
            {Object.entries(skills).map(([k, v]) => (
              <div
                key={k}
                onClick={() => {
                  if (!skillPoints) return;
                  setSkills((s) => ({ ...s, [k]: v + 1 }));
                  setSkillPoints((p) => p - 1);
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "#1a1f3c",
                  border: "1px solid #334",
                  cursor: skillPoints ? "pointer" : "not-allowed",
                  opacity: skillPoints ? 1 : 0.4,
                }}
              >
                <b>{k}</b>
                <div>Level: {v}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setShowSkills(false)}>Close</button>
        </div>
      )}
    </main>
  );
}
