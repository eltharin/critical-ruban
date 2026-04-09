import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";
import { effectManager } from "./effect-manager.js";

export class MaddeningGripEffect extends BaseRubanEffect {
  static effectId = "maddeningGrip";
  static effectTypes = ["fumble"];
  
  getExitDuration(type) {
    return 1600;
  }

  setup(banner) {
    banner.addEffectLayer("abyssMist", this.createMistLayer(banner), {
      parent: "bodyGroup",
      alpha: 0
    });

    banner.addEffectLayer("abyssVeins", this.createVeinsLayer(banner), {
      parent: "bodyGroup",
      alpha: 0
    });

    banner.addEffectLayer("tentaclesBack", this.createTentacleLayer(banner, { front: false }), {
      parent: "bodyGroup",
      alpha: 0
    });

    banner.addEffectLayer("tentaclesFront", this.createTentacleLayer(banner, { front: true }), {
      parent: "fx",
      alpha: 0
    });
  }

  onHold(banner, t, dtMS) {
    const time = banner.elapsed / 1000;
    const pulse = (Math.sin(time * 4.2) + 1) * 0.5;
    const weird = this.jitter(banner.floatSeed, time);
    const weird2 = this.jitter(banner.shineSeed + 2.4, time * 1.2);

    const mist = banner.getEffectLayer("abyssMist");
    const veins = banner.getEffectLayer("abyssVeins");

    banner.root.alpha = 1;
    banner.root.position.set(
      banner.baseX + weird * 2.4,
      banner.baseY + weird2 * 1.6
    );

    const sx = banner.baseScale * (1 + weird * 0.007);
    const sy = banner.baseScale * (1 - weird2 * 0.006);
    banner.motion.scale.set(sx, sy);
    banner.motion.rotation = banner.baseRotation + weird * 0.0065;

    banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, 0x8760ae, 0.12 + pulse * 0.10);
    banner.innerGlow.alpha = 0.40 + pulse * 0.06;
    banner.shine.alpha = Math.max(0, banner.shine.alpha * 0.82);

    if (mist) {
      mist.alpha = 0.46 + pulse * 0.10;
      this.redrawMist(mist, banner.elapsed, 1.15);
    }

    if (veins) {
      veins.alpha = 0.24 + pulse * 0.10;
      for (const v of veins._veins) v.progress = 0.24 + pulse * 0.06;
      this.redrawVeins(veins, pulse, time * 0.9);
    }

    if (Math.random() < 0.34) {
      this.spawnSpore(banner, {
        x: CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.44, banner.mainWidth * 0.44),
        y: CriticalRubanUtils.randomBetween(-banner.height * 0.40, banner.height * 0.36),
        dark: Math.random() < 0.35,
        preTentacle: true
      });
    }
  }

  onPrepareExit(banner) {
    banner.resetVisualState();
    banner.bodyGroup.visible = true;
    banner.bodyGroup.alpha = 1;

    const mist = banner.getEffectLayer("abyssMist");
    const veins = banner.getEffectLayer("abyssVeins");
    const back = banner.getEffectLayer("tentaclesBack");
    const front = banner.getEffectLayer("tentaclesFront");

    if (mist) {
      mist.alpha = 0.52;
      this.redrawMist(mist, banner.elapsed, 1.2);
    }

    if (veins) {
      veins.alpha = 0.42;
      for (const v of veins._veins) v.progress = 0.30;
      this.redrawVeins(veins, 0.26, banner.elapsed / 1000);
    }

    if (back) {
      back.alpha = 0;
      for (const t of back._tentacles) t.progress = 0;
    }

    if (front) {
      front.alpha = 0;
      for (const t of front._tentacles) t.progress = 0;
    }

    this.spawnSporesBurst(banner, 50, false, true);
  }

  onExit(banner, t, dtMS) {
    const infectT = CriticalRubanUtils.clamp01(t / 0.28);
    const graspT = CriticalRubanUtils.clamp01((t - 0.28) / 0.38);
    const implodeT = CriticalRubanUtils.clamp01((t - 0.66) / 0.34);

    const mist = banner.getEffectLayer("abyssMist");
    const veins = banner.getEffectLayer("abyssVeins");
    const back = banner.getEffectLayer("tentaclesBack");
    const front = banner.getEffectLayer("tentaclesFront");

    const time = banner.elapsed;
    const sec = time / 1000;

    if (t <= 0.28) {
      const e = CriticalRubanUtils.easeOutCubic(infectT);
      const pulse = (Math.sin(sec * 8.3) + 1) * 0.5;
      const mad = this.jitter(banner.floatSeed + 1.3, sec * 1.8);

      banner.root.alpha = 1;
      banner.root.position.set(
        banner.baseX + mad * 5.2,
        banner.baseY + this.jitter(banner.shineSeed + 0.6, sec * 1.55) * 2.9
      );
      banner.motion.scale.set(
        banner.baseScale * (1 + mad * 0.012),
        banner.baseScale * (1 - mad * 0.010)
      );
      banner.motion.rotation = banner.baseRotation + mad * 0.012;

      banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, 0x432b54, e * 0.62);
      banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.40, 0.16, e);
      banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.86, e);
      banner.shine.alpha = 0;

      if (mist) {
        mist.alpha = CriticalRubanUtils.lerp(0.52, 0.76, e);
        this.redrawMist(mist, time, 1.35 + e * 0.20);
      }

      if (veins) {
        veins.alpha = CriticalRubanUtils.lerp(0.42, 1.0, e);
        for (let i = 0; i < veins._veins.length; i++) {
          const v = veins._veins[i];
          const localDelay = i * 0.05;
          v.progress = CriticalRubanUtils.clamp01((infectT - localDelay) / (1 - localDelay));
        }
        this.redrawVeins(veins, pulse * 1.15, sec * 2.2);
      }

      if (Math.random() < 0.75) {
        this.spawnSpore(banner, {
          x: CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.42, banner.mainWidth * 0.42),
          y: CriticalRubanUtils.randomBetween(-banner.height * 0.36, banner.height * 0.36),
          dark: Math.random() < 0.30,
          preTentacle: true
        });
      }

      if (infectT > 0.12 && Math.random() < 0.20) {
        this.spawnSporesBurst(banner, 3, false, true);
      }

      return;
    }

    if (t <= 0.66) {
      const e = CriticalRubanUtils.easeInOutQuad(graspT);
      const pulse = (Math.sin(sec * 10.0) + 1) * 0.5;
      const lurch = Math.sin(graspT * Math.PI * 3.2) * (1 - graspT) * 8.0;

      banner.root.alpha = 1;
      banner.root.position.set(
        banner.baseX + lurch,
        banner.baseY + Math.cos(sec * 13.5) * 2.0
      );
      banner.motion.scale.set(
        banner.baseScale * CriticalRubanUtils.lerp(1, 0.955, e),
        banner.baseScale * CriticalRubanUtils.lerp(1, 1.05, e)
      );
      banner.motion.rotation = banner.baseRotation + Math.sin(sec * 10.5) * 0.015;

      banner.motion.tint = CriticalRubanUtils.mixHex(0x432b54, 0x140d17, e * 0.55);
      banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.16, 0.06, e);
      banner.bodyGroup.alpha = CriticalRubanUtils.lerp(0.86, 0.72, e);

      if (mist) {
        mist.alpha = CriticalRubanUtils.lerp(0.76, 0.90, e);
        this.redrawMist(mist, time, 1.45);
      }

      if (veins) {
        veins.alpha = 1.0;
        for (const v of veins._veins) v.progress = 1;
        this.redrawVeins(veins, pulse * 1.25, sec * 2.9);
      }

      if (back) {
        back.alpha = CriticalRubanUtils.lerp(0, 1.0, e);
        for (let i = 0; i < back._tentacles.length; i++) {
          const tent = back._tentacles[i];
          tent.progress = CriticalRubanUtils.clamp01((graspT - i * 0.07) / (0.82 - i * 0.07));
          this.drawTentacle(tent.g, tent, time, 1.12);
        }
      }

      if (front) {
        front.alpha = CriticalRubanUtils.lerp(0, 1.0, e);
        for (let i = 0; i < front._tentacles.length; i++) {
          const tent = front._tentacles[i];
          tent.progress = CriticalRubanUtils.clamp01((graspT - 0.10 - i * 0.07) / (0.74 - i * 0.07));
          this.drawTentacle(tent.g, tent, time, 1.28);
        }
      }

      if (Math.random() < 0.30) {
        this.spawnSpore(banner, {
          x: CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.26, banner.mainWidth * 0.26),
          y: CriticalRubanUtils.randomBetween(-banner.height * 0.24, banner.height * 0.24),
          big: Math.random() < 0.30,
          dark: Math.random() < 0.35,
          preTentacle: false
        });
      }

      return;
    }

    const e = CriticalRubanUtils.easeInCubic(implodeT);
    const shock = Math.sin(implodeT * Math.PI * 5.6) * (1 - implodeT) * 6.8;

    banner.root.alpha = 1 - e;
    banner.root.position.set(
      banner.baseX + shock,
      banner.baseY + Math.cos(sec * 18.5) * (1 - implodeT) * 2.4
    );

    const sx = banner.baseScale * CriticalRubanUtils.lerp(0.955, 0.34, e);
    const sy = banner.baseScale * CriticalRubanUtils.lerp(1.05, 0.18, e);
    banner.motion.scale.set(sx, sy);
    banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0.015, 0.16, e);

    banner.motion.tint = CriticalRubanUtils.mixHex(0x140d17, 0x050306, e * 0.65);
    banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.06, 0, e);
    banner.bodyGroup.alpha = CriticalRubanUtils.lerp(0.72, 0.06, e);

    if (mist) {
      mist.alpha = CriticalRubanUtils.lerp(0.90, 0.08, e);
      this.redrawMist(mist, time, 1.5 - e * 0.7);
    }

    if (veins) {
      veins.alpha = CriticalRubanUtils.lerp(1.0, 0.10, e);
      for (const v of veins._veins) v.progress = 1;
      this.redrawVeins(veins, 0.45, sec * 3.1);
    }

    if (back) {
      back.alpha = CriticalRubanUtils.lerp(1.0, 0.08, e);
      for (const tent of back._tentacles) {
        tent.progress = CriticalRubanUtils.lerp(1, 0.76, e);
        this.drawTentacle(tent.g, tent, time, 1.15 + (1 - e) * 0.2);
      }
    }

    if (front) {
      front.alpha = CriticalRubanUtils.lerp(1.0, 0.10, e);
      for (const tent of front._tentacles) {
        tent.progress = CriticalRubanUtils.lerp(1, 0.80, e);
        this.drawTentacle(tent.g, tent, time, 1.32 + (1 - e) * 0.24);
      }
    }

    if (Math.random() < (implodeT < 0.45 ? 0.54 : 0.28)) {
      this.spawnSpore(banner, {
        x:CriticalRubanUtils.randomBetween(-70, 70),
        y:CriticalRubanUtils.randomBetween(-30, 30),
        big: Math.random() < 0.34,
        dark: Math.random() < 0.40,
        burst: true
      });
    }

    if (implodeT > 0.14 && Math.random() < 0.26) {
      this.spawnSporesBurst(banner, 4, true, false);
    }
  }

  onDestroy(banner) {
    banner.motion.tint = 0xffffff;
  }

  jitter(seed, t) {
    return (
      Math.sin(t * 2.37 + seed * 1.13) * 0.55 +
      Math.sin(t * 5.91 + seed * 2.07) * 0.30 +
      Math.sin(t * 10.73 + seed * 0.61) * 0.15
    );
  }

  drawVeinPath(g, pts, color, alpha = 1, width = 2) {
    if (!pts?.length || pts.length < 2) return g;
    g.lineStyle(width, color, alpha);
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cx = (p0.x + p1.x) * 0.5;
      const cy = (p0.y + p1.y) * 0.5;
      g.quadraticCurveTo(p0.x, p0.y, cx, cy);
    }
    const last = pts[pts.length - 1];
    g.lineTo(last.x, last.y);
    return g;
  }

  makeVeinData(banner) {
    const left = -banner.totalWidth / 2 + 18;
    const right = banner.totalWidth / 2 - 18;
    const top = -banner.height / 2 + 10;
    const bot = banner.height / 2 - 10;

    return [
      {
        side: "left",
        color: 0x2a1733,
        glow: 0x8d5bc0,
        thickness: 3.6,
        progress: 0,
        points: [
          { x: left, y: -10 },
          { x: left + 34, y: -16 },
          { x: left + 82, y: -4 },
          { x: -50, y: 2 },
          { x: -8, y: -6 }
        ]
      },
      {
        side: "left",
        color: 0x1b0f22,
        glow: 0x73479f,
        thickness: 2.7,
        progress: 0,
        points: [
          { x: left + 6, y: 18 },
          { x: left + 42, y: 10 },
          { x: left + 96, y: 24 },
          { x: -28, y: 18 },
          { x: 18, y: 22 }
        ]
      },
      {
        side: "right",
        color: 0x24142d,
        glow: 0xa06bd4,
        thickness: 3.4,
        progress: 0,
        points: [
          { x: right, y: -18 },
          { x: right - 38, y: -10 },
          { x: right - 96, y: -26 },
          { x: 62, y: -8 },
          { x: 10, y: 2 }
        ]
      },
      {
        side: "right",
        color: 0x140b1c,
        glow: 0x6a448d,
        thickness: 2.5,
        progress: 0,
        points: [
          { x: right - 4, y: 20 },
          { x: right - 44, y: 8 },
          { x: right - 108, y: 18 },
          { x: 54, y: 24 },
          { x: 0, y: 12 }
        ]
      },
      {
        side: "top",
        color: 0x211229,
        glow: 0x8f60bc,
        thickness: 2.4,
        progress: 0,
        points: [
          { x: -24, y: top },
          { x: -18, y: top + 14 },
          { x: -8, y: top + 28 },
          { x: 12, y: -2 },
          { x: 24, y: 16 }
        ]
      },
      {
        side: "bottom",
        color: 0x1a1021,
        glow: 0x7a4fa3,
        thickness: 2.4,
        progress: 0,
        points: [
          { x: 28, y: bot },
          { x: 12, y: bot - 14 },
          { x: -4, y: bot - 24 },
          { x: -16, y: 8 },
          { x: -28, y: -10 }
        ]
      }
    ];
  }

  createVeinsLayer(banner) {
    const c = new PIXI.Container();
    c._veins = this.makeVeinData(banner);
    c._graphics = [];

    for (let i = 0; i < c._veins.length; i++) {
      const gGlow = new PIXI.Graphics();
      const gMain = new PIXI.Graphics();
      gGlow.alpha = 0;
      gMain.alpha = 0;
      c.addChild(gGlow, gMain);
      c._graphics.push({ gGlow, gMain });
    }

    return c;
  }

  redrawVeins(layer, pulse = 0, wiggle = 0) {
    if (!layer?._veins || !layer?._graphics) return;

    for (let i = 0; i < layer._veins.length; i++) {
      const vein = layer._veins[i];
      const pair = layer._graphics[i];
      const { gGlow, gMain } = pair;
      gGlow.clear();
      gMain.clear();

      const count = Math.max(2, Math.floor(vein.points.length * vein.progress));
      const pts = vein.points.slice(0, count).map((p, idx) => ({
        x: p.x + Math.sin(idx * 0.9 + wiggle * 0.9 + i) * 1.1,
        y: p.y + Math.cos(idx * 1.2 + wiggle * 1.1 + i * 0.4) * 1.1
      }));

      if (pts.length < 2) continue;

      this.drawVeinPath(gGlow, pts, vein.glow, 0.24 + pulse * 0.16, vein.thickness + 5.0);
      this.drawVeinPath(gMain, pts, vein.color, 0.96, vein.thickness + pulse * 0.60);

      gGlow.alpha = CriticalRubanUtils.clamp01(vein.progress * 1.15);
      gMain.alpha = CriticalRubanUtils.clamp01(vein.progress * 1.10);

      const tip = pts[pts.length - 1];
      gMain.beginFill(vein.glow, 0.22 + pulse * 0.18);
      gMain.drawCircle(tip.x, tip.y, 2.2 + pulse * 1.4);
      gMain.endFill();
    }
  }

  createTentacleLayer(banner, { front = false } = {}) {
    const c = new PIXI.Container();
    c._front = front;
    c._tentacles = [];

    const defs = front
      ? [
          {
            side: "left",
            baseX: -banner.mainWidth / 2 - 30,
            baseY: 18,
            length: 148,
            thickness: 20,
            amplitude: 14,
            phase: Math.random() * Math.PI * 2,
            dir: 1,
            color: 0x120915,
            rim: 0x724995
          },
          {
            side: "right",
            baseX: banner.mainWidth / 2 + 26,
            baseY: -14,
            length: 164,
            thickness: 22,
            amplitude: 15,
            phase: Math.random() * Math.PI * 2,
            dir: -1,
            color: 0x100713,
            rim: 0x8a59b7
          },
          {
            side: "left",
            baseX: -banner.mainWidth / 2 - 22,
            baseY: -8,
            length: 120,
            thickness: 16,
            amplitude: 10,
            phase: Math.random() * Math.PI * 2,
            dir: 1,
            color: 0x150a17,
            rim: 0x674281
          }
        ]
      : [
          {
            side: "left",
            baseX: -banner.mainWidth / 2 - 12,
            baseY: -22,
            length: 170,
            thickness: 22,
            amplitude: 12,
            phase: Math.random() * Math.PI * 2,
            dir: 1,
            color: 0x1a0f21,
            rim: 0x7d53a0
          },
          {
            side: "right",
            baseX: banner.mainWidth / 2 + 12,
            baseY: 16,
            length: 136,
            thickness: 18,
            amplitude: 11,
            phase: Math.random() * Math.PI * 2,
            dir: -1,
            color: 0x170d1d,
            rim: 0x6b4487
          },
          {
            side: "right",
            baseX: banner.mainWidth / 2 + 4,
            baseY: -4,
            length: 114,
            thickness: 15,
            amplitude: 9,
            phase: Math.random() * Math.PI * 2,
            dir: -1,
            color: 0x140a18,
            rim: 0x5d3d74
          }
        ];

    for (const def of defs) {
      const g = new PIXI.Graphics();
      c.addChild(g);
      c._tentacles.push({ ...def, g, progress: 0 });
    }

    return c;
  }

  drawTentacle(g, tentacle, time, intensity = 1) {
    g.clear();

    const segs = 12;
    const pts = [];
    const p = CriticalRubanUtils.clamp01(tentacle.progress);
    if (p <= 0) return;

    const visibleLength = tentacle.length * p;
    const phase = time * 0.0042 + tentacle.phase;

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const d = visibleLength * t;
      const x = tentacle.baseX + tentacle.dir * d;
      const sway = Math.sin(phase + t * 2.9) * tentacle.amplitude * (0.30 + t * 1.05) * intensity;
      const curl = Math.sin(phase * 0.72 + t * 5.9) * 6.8 * t * intensity;
      const y = tentacle.baseY + sway + curl;
      pts.push({ x, y });
    }

    for (let i = 0; i < segs; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const t = i / segs;
      const w = tentacle.thickness * (1 - t * 0.76);

      g.lineStyle(w + 8, tentacle.rim, 0.16);
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);

      g.lineStyle(w + 3, tentacle.rim, 0.18);
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);

      g.lineStyle(w, tentacle.color, 0.98);
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
    }

    const tip = pts[pts.length - 1];
    g.beginFill(tentacle.rim, 0.24);
    g.drawCircle(tip.x, tip.y, 4.2);
    g.endFill();
  }

  spawnSpore(banner, {
    x = 0,
    y = 0,
    big = false,
    dark = false,
    preTentacle = false,
    burst = false
  } = {}) {
    const color = dark
      ? (Math.random() < 0.5 ? 0x341d40 : 0x1d1224)
      : (Math.random() < 0.45 ? 0x9a6fd2 : 0xd6c0f0);

    const radius = preTentacle
      ?CriticalRubanUtils.randomBetween(2.6, big ? 6.8 : 5.2)
      : big
        ?CriticalRubanUtils.randomBetween(2.8, 6.0)
        :CriticalRubanUtils.randomBetween(1.6, 3.6);

    const alpha = preTentacle
      ?CriticalRubanUtils.randomBetween(0.48, 0.92)
      : big
        ?CriticalRubanUtils.randomBetween(0.36, 0.72)
        :CriticalRubanUtils.randomBetween(0.24, 0.58);

    const vx = burst
      ?CriticalRubanUtils.randomBetween(-48, 48)
      :CriticalRubanUtils.randomBetween(-24, 24);

    const vy = burst
      ?CriticalRubanUtils.randomBetween(-44, 26)
      :CriticalRubanUtils.randomBetween(-30, 16);

    banner.spawnParticle({
      parent: "fx",
      x,
      y,
      radius,
      color,
      alpha,
      vx,
      vy,
      vr:CriticalRubanUtils.randomBetween(-0.025, 0.025),
      life: preTentacle
        ?CriticalRubanUtils.randomBetween(1000, 1900)
        : big
          ?CriticalRubanUtils.randomBetween(950, 1750)
          :CriticalRubanUtils.randomBetween(750, 1450),
      scaleFrom: preTentacle
        ?CriticalRubanUtils.randomBetween(1.0, 1.45)
        :CriticalRubanUtils.randomBetween(0.90, 1.25),
      scaleTo: preTentacle ? 0.20 : 0.12
    });
  }

  spawnSporesBurst(banner, count = 14, aroundCenter = false, preTentacle = false) {
    for (let i = 0; i < count; i++) {
      this.spawnSpore(banner, {
        x: aroundCenter
          ?CriticalRubanUtils.randomBetween(-70, 70)
          :CriticalRubanUtils.randomBetween(-banner.totalWidth * 0.44, banner.totalWidth * 0.44),
        y: aroundCenter
          ?CriticalRubanUtils.randomBetween(-30, 30)
          :CriticalRubanUtils.randomBetween(-banner.height * 0.44, banner.height * 0.44),
        big: Math.random() < (preTentacle ? 0.40 : 0.26),
        dark: Math.random() < 0.35,
        preTentacle,
        burst: aroundCenter
      });
    }
  }

  drawMistBlob(g, x, y, rx, ry, color, alpha) {
    g.beginFill(color, alpha);
    g.drawEllipse(x, y, rx, ry);
    g.endFill();
  }

  createMistLayer(banner) {
    const c = new PIXI.Container();
    c._blobs = [];

    for (let i = 0; i < 8; i++) {
      const g = new PIXI.Graphics();
      c.addChild(g);
      c._blobs.push({
        g,
        x:CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.40, banner.mainWidth * 0.40),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.24, banner.height * 0.24),
        rx:CriticalRubanUtils.randomBetween(32, 70),
        ry:CriticalRubanUtils.randomBetween(14, 30),
        phase: Math.random() * Math.PI * 2,
        drift:CriticalRubanUtils.randomBetween(4, 10)
      });
    }

    return c;
  }

  redrawMist(layer, elapsed, alphaMul = 1) {
    if (!layer?._blobs) return;
    const t = elapsed / 1000;

    for (const blob of layer._blobs) {
      blob.g.clear();

      const ox = Math.sin(t * 0.85 + blob.phase) * blob.drift;
      const oy = Math.cos(t * 0.65 + blob.phase * 1.3) * (blob.drift * 0.45);

      this.drawMistBlob(
        blob.g,
        blob.x + ox,
        blob.y + oy,
        blob.rx,
        blob.ry,
        0x24132d,
        0.10 * alphaMul
      );

      this.drawMistBlob(
        blob.g,
        blob.x + ox * 0.7,
        blob.y + oy * 0.7,
        blob.rx * 0.74,
        blob.ry * 0.74,
        0x6f4b8e,
        0.08 * alphaMul
      );
    }
  }
}
