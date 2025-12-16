"use client";

import { useEffect, useRef, useState } from "react";

type EnemyType = "wolf" | "bear" | "boss";

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

type NukeType = "lightning" | "fire" | "ice";

type Nuke = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: NukeType;
  chainLeft?: number;
};

const SAVE_KEY = "nuker_save_v1";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enemies = useRef<Enemy[]>([]);
  const nukes = useRef<Nuke[]>([]);
  const idRef = useRef(0);

  const hero = { x: 400, y: 300 };

  /* ================= HUD ================= */
  const [time, setTime] = useState(600);
  const [score, setScore] = useState(0);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);

  /* ================= SKILLS ================= */
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

  const nextLevelExp = 60 + level * 40;

  /* ================= SAVE / LOAD ================= */
  useEffect(() => {
    const save = localStorage.getItem(SAVE_KEY);
    if (save) {
      const s = JSON.parse(save);
      setLevel(s.level);
      setScore(s.score);
      setSkills(s.skills);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ level, score, skills })
    );
  }, [level, score, skills]);

  /* ================= TIMER ================= */
  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ================= LEVEL UP ================= */
  useEffect(() => {
    if (exp >= nextLevelExp) {
      setExp((e) => e - nextLevelExp);
      setLevel((l) => l + 1);
      setSkillPoints((p) => p + 1);
    }
  }, [exp]);

  /* ================= SPAWN ================= */
  useEffect(() => {
    const spawn = setInterval(() => {
      const r = Math.random();
      let type: EnemyType = r < 0.85 ? "wolf" : "bear";

      const hp =
        type === "wolf" ? 3 : 6;

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

  /* ================= BOSS ================= */
  useEffect(() => {
    const boss = setInterval(() => {
      enemies.current.push({
        id: idRef.current++,
        x: 100,
        y: 100,
        type: "boss",
        hp: 120 + level * 30,
        maxHp: 120 + level * 30,
        slow: 0,
        burn: 0,
      });
    }, 60000);

    return () => clearInterval(boss);
  }, [level]);

  /* ================= AUTO ATTACK ================= */
  useEffect(() => {
    const fire = setInterval(() => {
      if (!enemies.current.length) return;

      const t = enemies.current[0];
      const dx = t.x - hero.x;
      const dy = t.y - hero.y;
      const d = Math.hypot(dx, dy) || 1;

      const type: NukeType =
        Math.random() < 0.33 ? "lightning" :
        Math.random() < 0.5 ? "fire" : "ice";

      nukes.current.push({
        x: hero.x,
        y: hero.y,
        vx: (dx / d) * 6,
        vy: (dy / d) * 6,
        type,
        chainLeft:
          type === "lightning"
            ? 1 + skills.lightningChain
            : 0,
      });
    }, 500);

    return () => clearInterval(fire);
  }, [skills]);

  /* ================= GAME LOOP ================= */
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

      /* ENEMIES */
      enemies.current.forEach((e) => {
        if (e.burn > 0) {
          e.burn--;
          e.hp -= 0.02 * (1 + skills.fireDamage);
        }

        const speed = e.type === "boss" ? 0.3 : 0.6;
        const slow = Math.min(0.8, e.slow * (0.3 + skills.iceSlow * 0.2));

        const dx = hero.x - e.x;
        const dy = hero.y - e.y;
        const d = Math.hypot(dx, dy) || 1;

        e.x += (dx / d) * speed * (1 - slow);
        e.y += (dy / d) * speed * (1 - slow);

        ctx.fillText(
          e.type === "wolf" ? "🐺" :
          e.type === "bear" ? "🐻" : "🐘",
          e.x,
          e.y
        );

        /* HP BAR */
        if (e.type === "boss") {
          ctx.fillStyle = "red";
          ctx.fillRect(e.x - 20, e.y - 30, 40, 4);
          ctx.fillStyle = "lime";
          ctx.fillRect(
            e.x - 20,
            e.y - 30,
            (e.hp / e.maxHp) * 40,
            4
          );
        }
      });

      /* NUKES */
      nukes.current = nukes.current.filter((n) => {
        n.x += n.vx;
        n.y += n.vy;

        ctx.fillText(
          n.type === "lightning" ? "⚡" :
          n.type === "fire" ? "🔥" : "❄️",
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
          if (n.type === "fire")
            hitEnemy.burn = 180 + skills.fireBurn * 60;

          /* CHAIN */
          if (n.type === "lightning" && n.chainLeft! > 0) {
            const next = enemies.current.find(
              (e) =>
                e !== hitEnemy &&
                Math.hypot(e.x - hitEnemy!.x, e.y - hitEnemy!.y) < 120
            );

            if (next) {
              nukes.current.push({
                x: hitEnemy.x,
                y: hitEnemy.y,
                vx: (next.x - hitEnemy.x) / 10,
                vy: (next.y - hitEnemy.y) / 10,
                type: "lightning",
                chainLeft: n.chainLeft! - 1,
              });
            }
          }

          if (hitEnemy.hp <= 0) {
            setScore((s) => s + (hitEnemy.type === "boss" ? 500 : 20));
            setExp((e) => e + (hitEnemy.type === "boss" ? 200 : 20));
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

  /* ================= UI ================= */
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

      <canvas ref={canvasRef} />

      {showSkills && (
        <div style={{ position: "fixed", inset: 0, background: "#000c" }}>
          <h2>SKILLS</h2>
          {Object.entries(skills).map(([k, v]) => (
            <button
              key={k}
              disabled={!skillPoints}
              onClick={() => {
                setSkills((s) => ({ ...s, [k]: v + 1 }));
                setSkillPoints((p) => p - 1);
              }}
            >
              {k} ({v})
            </button>
          ))}
          <br />
          <button onClick={() => setShowSkills(false)}>Close</button>
        </div>
      )}
    </main>
  );
}
