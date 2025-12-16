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

  // HUD
  const [time, setTime] = useState(600);
  const [score, setScore] = useState(0);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);

  // SKILLS
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
      setSkillPoints((p) => p + 1);
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
        hp:
          type === "wolf"
            ? 1 + skills.lightningDamage
            : 2 + skills.lightningDamage,
        slow: 0,
      });
    }, Math.max(300, 900 - level * 50));
    return () => clearInterval(spawn);
  }, [level, skills.lightningDamage]);

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

      // HERO
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
        const slowPower = Math.min(0.9, 0.5 + skills.iceSlow * 0.2);
        const speed = 0.6 * (1 - e.slow * slowPower);

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
            if (n.type === "ice") e.slow = 1;

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
  }, [skills]);

  return (
    <main style={{ color: "white", textAlign: "center" }}>
      <h1>NUKER</h1>

      {/* HUD */}
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div>⏱️ {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</div>
        <div>⭐ {score}</div>
        <div>🧪 {exp}/{nextLevelExp}</div>
        <div>🆙 Lv {level}</div>
        <button onClick={() => setShowSkills(true)}>
          🧠 Skills ({skillPoints})
        </button>
      </div>

      <canvas ref={canvasRef} />

      {/* SKILL MENU */}
      {showSkills && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            padding: 20,
          }}
        >
          <h2>SKILLS</h2>

          <h3>⚡ Lightning</h3>
          <button disabled={!skillPoints} onClick={() => {
            setSkills(s => ({ ...s, lightningChain: s.lightningChain + 1 }));
            setSkillPoints(p => p - 1);
          }}>
            Chain ({skills.lightningChain})
          </button>
          <button disabled={!skillPoints} onClick={() => {
            setSkills(s => ({ ...s, lightningDamage: s.lightningDamage + 1 }));
            setSkillPoints(p => p - 1);
          }}>
            Damage ({skills.lightningDamage})
          </button>

          <h3>🔥 Fire</h3>
          <button disabled={!skillPoints} onClick={() => {
            setSkills(s => ({ ...s, fireBurn: s.fireBurn + 1 }));
            setSkillPoints(p => p - 1);
          }}>
            Burn ({skills.fireBurn})
          </button>
          <button disabled={!skillPoints} onClick={() => {
            setSkills(s => ({ ...s, fireDamage: s.fireDamage + 1 }));
            setSkillPoints(p => p - 1);
          }}>
            Damage ({skills.fireDamage})
          </button>

          <h3>❄️ Ice</h3>
          <button disabled={!skillPoints} onClick={() => {
            setSkills(s => ({ ...s, iceSlow: s.iceSlow + 1 }));
            setSkillPoints(p => p - 1);
          }}>
            Slow ({skills.iceSlow})
          </button>
          <button disabled={!skillPoints} onClick={() => {
            setSkills(s => ({ ...s, iceDamage: s.iceDamage + 1 }));
            setSkillPoints(p => p - 1);
          }}>
            Damage ({skills.iceDamage})
          </button>

          <br /><br />
          <button onClick={() => setShowSkills(false)}>Close</button>
        </div>
      )}
    </main>
  );
}
