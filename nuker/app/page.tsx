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
  damage: number;
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

  const [time, setTime] = useState(600);
  const [score, setScore] = useState(0);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);

  /* HERO */
  const [heroHP, setHeroHP] = useState(120);
  const [heroMaxHP, setHeroMaxHP] = useState(120);
  const [heroDamage, setHeroDamage] = useState(12);
  const [heroPos, setHeroPos] = useState({ x: 400, y: 300 });

  /* SKILLS */
  const [skillPoints, setSkillPoints] = useState(0);
  const [showSkills, setShowSkills] = useState(false);
  const [skills, setSkills] = useState({
    lightningChain: 0,
    lightningDamage: 0,
    fireBurn: 0,
    fireDamage: 0,
    iceSlow: 0,
    iceDamage: 0,
    hpBoost: 0,
    baseDamage: 0,
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

      const newMax = 120 + level * 10 + skills.hpBoost * 5;
      setHeroMaxHP(newMax);
      setHeroHP(newMax);

      setHeroDamage(12 + skills.baseDamage * 2 + level);
    }
  }, [exp, nextLevelExp, level, skills.hpBoost, skills.baseDamage]);

  /* INITIAL ENEMIES */
  useEffect(() => {
    const initEnemies: Enemy[] = [];
    for (let i = 0; i < 10; i++) {
      initEnemies.push({
        id: idRef.current++,
        x: Math.random() * 800,
        y: Math.random() * 600,
        type: "wolf",
        hp: 5 + level * 2,
        maxHp: 5 + level * 2,
        slow: 0,
        burn: 0,
        damage: 1 + level,
      });
    }
    for (let i = 0; i < 2; i++) {
      initEnemies.push({
        id: idRef.current++,
        x: Math.random() * 800,
        y: Math.random() * 600,
        type: "bear",
        hp: 15 + level * 5,
        maxHp: 15 + level * 5,
        slow: 0,
        burn: 0,
        damage: 3 + level * 1.2,
      });
    }
    enemies.current = initEnemies;
  }, [level]);

  /* HERO MOVEMENT */
  useEffect(() => {
    const keys: Record<string, boolean> = {};
    const speed = 4;
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    const move = () => {
      setHeroPos((pos) => {
        let nx = pos.x;
        let ny = pos.y;
        if (keys["w"]) ny -= speed;
        if (keys["s"]) ny += speed;
        if (keys["a"]) nx -= speed;
        if (keys["d"]) nx += speed;
        nx = Math.max(0, Math.min(800, nx));
        ny = Math.max(0, Math.min(600, ny));
        return { x: nx, y: ny };
      });
      requestAnimationFrame(move);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    move();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /* AUTO ATTACK */
  useEffect(() => {
    const fire = setInterval(() => {
      if (!enemies.current.length) return;
      const t = enemies.current.find((e) => e.hp > 0);
      if (!t) return;

      const dx = t.x - heroPos.x;
      const dy = t.y - heroPos.y;
      const d = Math.hypot(dx, dy) || 1;

      const r = Math.random();
      const type: NukeType = r < 0.33 ? "lightning" : r < 0.66 ? "fire" : "ice";

      nukes.current.push({
        x: heroPos.x,
        y: heroPos.y,
        vx: (dx / d) * 6,
        vy: (dy / d) * 6,
        type,
        chainLeft: type === "lightning" ? 1 + skills.lightningChain : 0,
      });
    }, 500);
    return () => clearInterval(fire);
  }, [skills, heroPos, level]);

  /* GAME LOOP */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 800;
    canvas.height = 600;

    const loop = () => {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, 800, 600);

      // Hero
      ctx.font = "28px serif";
      ctx.fillText("👦🏻", heroPos.x - 10, heroPos.y + 10);

      // Enemies
      enemies.current.forEach((e) => {
        if (e.burn > 0) {
          e.burn--;
          e.hp -= 0.02 * (1 + skills.fireDamage);
        }

        // Draw enemy
        const emoji = e.type === "wolf" ? "🐺" : e.type === "bear" ? "🐻" : "🐘";
        ctx.fillText(emoji, e.x, e.y);

        // Boss HP bar
        if (e.type === "boss") {
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(e.x - 20, e.y - 20, (e.hp / e.maxHp) * 40, 5);
        }

        // Enemy hits hero if overlapping
        const distToHero = Math.hypot(heroPos.x - e.x, heroPos.y - e.y);
        if (distToHero < 20) {
          setHeroHP((hp) => Math.max(0, hp - e.damage * 0.015));
        }
      });

      // Nukes
      nukes.current = nukes.current.filter((n) => {
        n.x += n.vx;
        n.y += n.vy;

        ctx.fillStyle =
          n.type === "lightning"
            ? "#ffff00"
            : n.type === "fire"
            ? "#ff4500"
            : "#00ffff";
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
            heroDamage *
            (1 +
              (n.type === "lightning"
                ? skills.lightningDamage * 0.25
                : n.type === "fire"
                ? skills.fireDamage * 0.25
                : skills.iceDamage * 0.25));
          hitEnemy.hp -= dmg;

          if (n.type === "ice") hitEnemy.slow = 1;
          if (n.type === "fire") hitEnemy.burn = 180 + skills.fireBurn * 60;

          if (hitEnemy.hp <= 0) {
            setScore((s) =>
              s + (hitEnemy.type === "bear" ? 25 : hitEnemy.type === "boss" ? 100 : 10)
            );
            setExp((e) =>
              e + (hitEnemy.type === "bear" ? 20 : hitEnemy.type === "boss" ? 80 : 10)
            );
            enemies.current = enemies.current.filter((en) => en.hp > 0);
          }

          return false;
        }
        return true;
      });

      requestAnimationFrame(loop);
    };

    loop();
  }, [skills, level, heroDamage, heroPos]);

  const handleReplay = () => {
    const newMaxHP = 120 + skills.hpBoost * 5;
    setHeroMaxHP(newMaxHP);
    setHeroHP(newMaxHP);

    setScore(0);
    setExp(0);
    setLevel(1);

    enemies.current.forEach((e) => {
      e.hp = e.maxHp;
    });

    nukes.current = [];
    setTime(600);
    setHeroPos({ x: 400, y: 300 });
  };

  if (heroHP <= 0)
    return (
      <main style={{ color: "white", textAlign: "center" }}>
        <h1>💀 GAME OVER 💀</h1>
        <p>Score: {score}</p>
        <button onClick={handleReplay}>Replay</button>
      </main>
    );

  return (
    <main style={{ color: "white", textAlign: "center" }}>
      <h1>NUKER</h1>

      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <div>⏱ {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</div>
        <div>⭐ {score}</div>
        <div>🆙 Lv {level}</div>
        <div>
          ❤️ {Math.floor(heroHP)} / {heroMaxHP}
        </div>
        <button onClick={() => setShowSkills(true)}>🧠 Skills ({skillPoints})</button>
      </div>

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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 200px)",
              gap: 12,
            }}
          >
            {Object.entries(skills).map(([k, v]) => (
              <div
                key={k}
                onClick={() => {
                  if (!skillPoints) return;
                  setSkills((s) => ({ ...s, [k]: v + 1 }));
                  setSkillPoints((p) => p - 1);

                  if (k === "hpBoost") {
                    const newMax = 120 + level * 10 + (v + 1) * 5;
                    setHeroMaxHP(newMax);
                    setHeroHP(newMax);
                  }
                  if (k === "baseDamage") {
                    setHeroDamage(12 + (v + 1) * 2 + level);
                  }
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
                <b>
                  {k
                    .replace("lightning", "⚡ Lightning ")
                    .replace("fire", "🔥 Fire ")
                    .replace("ice", "❄️ Ice ")
                    .replace("hpBoost", "❤️ HP Boost ")
                    .replace("baseDamage", "💥 Base Damage ")}
                </b>
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
