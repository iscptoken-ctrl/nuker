"use client";
// FULL NEXT.JS APP ROUTER GAME – READY FOR GITHUB + VERCEL
// file: app/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";

// ================= EMOJIS =================
const HERO = "🧑‍🎤";
const WOLF = "🐺";
const BEAR = "🐻";
const BOSS = "🐘";

// ================= CONSTS =================
const W = 420;
const H = 680;
const GAME_TIME = 600;

// ================= HELPERS =================
const rand = (a, b) => Math.random() * (b - a) + a;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default function Page() {
  const [time, setTime] = useState(GAME_TIME);
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);

  const hero = useRef({ x: W / 2, y: H / 2 });
  const monsters = useRef([]);
  const projectiles = useRef([]);

  const [skills, setSkills] = useState({
    lightning: { chain: 1, damage: 1 },
    fire: { burn: 1, damage: 1 },
    ice: { slow: 1, damage: 1 },
  });

  // ================= LEVEL =================
  const expNeed = (l) => (l === 1 ? 100 : l === 2 ? 150 : 150 + (l - 2) * 50);

  function gainExp(v) {
    setExp((e) => {
      let ne = e + v;
      let nl = level;
      while (ne >= expNeed(nl)) {
        ne -= expNeed(nl);
        nl++;
      }
      if (nl !== level) setLevel(nl);
      return ne;
    });
  }

  // ================= SPAWN =================
  function spawnMonster() {
    const bear = Math.random() < 0.1;
    monsters.current.push({
      type: bear ? "bear" : "wolf",
      hp: bear ? 2 : 1,
      x: rand(0, W),
      y: rand(0, H),
      slow: 0,
      burn: 0,
    });
  }

  function spawnBoss() {
    monsters.current.push({
      type: "boss",
      hp: 30,
      x: rand(50, W - 50),
      y: rand(50, H - 50),
      slow: 0,
      burn: 0,
    });
  }

  // ================= AUTO CAST =================
  useEffect(() => {
    const i = setInterval(() => {
      if (!running) return;

      projectiles.current.push({ type: "lightning", x: hero.current.x, y: hero.current.y, hit: [] });
      projectiles.current.push({ type: "fire", x: hero.current.x, y: hero.current.y, dir: rand(0, Math.PI * 2) });
      projectiles.current.push({ type: "ice", x: hero.current.x, y: hero.current.y, dir: rand(0, Math.PI * 2) });
    }, 700);
    return () => clearInterval(i);
  }, [running]);

  // ================= LOOP =================
  useEffect(() => {
    const loop = setInterval(() => {
      if (!running) return;

      setTime((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });

      if (Math.random() < 0.04 + level * 0.006) spawnMonster();
      if (score > 0 && score % 1000 === 0) spawnBoss();

      // monsters move & DOT
      monsters.current.forEach((m) => {
        const dx = hero.current.x - m.x;
        const dy = hero.current.y - m.y;
        const d = Math.hypot(dx, dy) || 1;
        const spd = m.slow > 0 ? 0.3 : 0.8;
        m.x += (dx / d) * spd;
        m.y += (dy / d) * spd;
        if (m.slow > 0) m.slow--;
        if (m.burn > 0) {
          m.hp -= 0.01 * skills.fire.burn;
          m.burn--;
        }
      });

      // projectiles
      projectiles.current.forEach((p) => {
        if (p.type !== "lightning") {
          p.x += Math.cos(p.dir) * 4;
          p.y += Math.sin(p.dir) * 4;
        }

        monsters.current.forEach((m) => {
          if (dist(p, m) < 18) {
            if (p.type === "lightning") {
              if (p.hit.includes(m)) return;
              m.hp -= skills.lightning.damage;
              p.hit.push(m);

              const next = monsters.current
                .filter((x) => !p.hit.includes(x) && dist(x, m) < 80)
                .sort((a, b) => dist(a, m) - dist(b, m))[0];

              if (next && p.hit.length <= skills.lightning.chain) {
                p.x = next.x;
                p.y = next.y;
              }
            }

            if (p.type === "fire") {
              m.hp -= skills.fire.damage;
              m.burn += 60 * skills.fire.burn;
            }

            if (p.type === "ice") {
              m.hp -= skills.ice.damage;
              m.slow += 60 * skills.ice.slow;
            }
          }
        });
      });

      monsters.current = monsters.current.filter((m) => {
        if (m.hp <= 0) {
          if (m.type === "wolf") { gainExp(10); setScore((s) => s + 10); }
          if (m.type === "bear") { gainExp(20); setScore((s) => s + 25); }
          if (m.type === "boss") { setScore((s) => s + 200); }
          return false;
        }
        return true;
      });

      projectiles.current = projectiles.current.filter(
        (p) => p.x > -50 && p.y > -50 && p.x < W + 50 && p.y < H + 50
      );
    }, 50);
    return () => clearInterval(loop);
  }, [running, level, score, skills]);

  // ================= UI =================
  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <h1 className="text-xl font-bold">NUKER</h1>
      <div>⏱ {time}s | ⭐ {score}</div>
      <div>Lv {level} | EXP {exp}/{expNeed(level)}</div>

      <div className="relative border rounded" style={{ width: W, height: H }}>
        <div style={{ position: "absolute", left: hero.current.x, top: hero.current.y }}>{HERO}</div>
        {monsters.current.map((m, i) => (
          <div key={i} style={{ position: "absolute", left: m.x, top: m.y }}>
            {m.type === "wolf" && WOLF}
            {m.type === "bear" && BEAR}
            {m.type === "boss" && BOSS}
          </div>
        ))}
      </div>

      {!running && (
        <button className="px-4 py-2 bg-black text-white rounded" onClick={() => { setTime(GAME_TIME); setRunning(true); }}>
          Replay (level & skills korunur)
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <button onClick={() => setSkills(s => ({...s, lightning:{...s.lightning, chain:s.lightning.chain+1}}))}>⚡ Chain +1</button>
        <button onClick={() => setSkills(s => ({...s, fire:{...s.fire, burn:s.fire.burn+1}}))}>🔥 Burn +1</button>
        <button onClick={() => setSkills(s => ({...s, ice:{...s.ice, slow:s.ice.slow+1}}))}>❄ Slow +1</button>
      </div>
    </div>
  );
}
