(() => {
  const EFFECT_ID = "vecnaSmoke";

  const VECNA = {
    shadow: 0x0a0610,
    shadowDeep: 0x05030a,
    purple: 0x3b1a78,
    purpleBright: 0x7c3aed,
    magenta: 0xa21caf,
    black: 0x000000
  };

  function makeBannerBodyPath(banner, inset = 0) {
    const x = -banner.mainWidth / 2 + inset;
    const y = -banner.height / 2 + inset;
    const w = banner.mainWidth - inset * 2;
    const h = banner.height - inset * 2;
    const topInset = Math.max(8, 18 - inset * 0.35);
    const sideBulge = Math.max(4, 10 - inset * 0.20);
    const lowerDip = Math.max(3, 8 - inset * 0.15);
    return { x, y, w, h, topInset, sideBulge, lowerDip };
  }

  function drawBodyShape(g, banner, {
    inset = 0,
    fill = null,
    fillAlpha = 1,
    lineWidth = 0,
    lineColor = 0x000000,
    lineAlpha = 1
  } = {}) {
    const { x, y, w, h, topInset, sideBulge, lowerDip } = makeBannerBodyPath(banner, inset);

    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fill !== null) g.beginFill(fill, fillAlpha);

    g.moveTo(x + topInset, y);
    g.bezierCurveTo(
      x - sideBulge, y + h * 0.10,
      x - sideBulge, y + h * 0.90,
      x + topInset, y + h
    );

    g.lineTo(x + w - topInset, y + h);

    g.bezierCurveTo(
      x + w + sideBulge, y + h * 0.90,
      x + w + sideBulge, y + h * 0.10,
      x + w - topInset, y
    );

    g.bezierCurveTo(
      x + w * 0.72, y + lowerDip,
      x + w * 0.28, y + lowerDip,
      x + topInset, y
    );

    if (fill !== null) g.endFill();
    return g;
  }

  function drawTailShape(g, banner, isLeft, {
    inset = 0,
    fill = null,
    fillAlpha = 1,
    lineWidth = 0,
    lineColor = 0x000000,
    lineAlpha = 1
  } = {}) {
    const sign = isLeft ? -1 : 1;
    const h = banner.height * 0.76 - inset * 0.8;
    const halfH = h / 2;
    const w = banner.tailWidth + 18 - inset * 0.45;

    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fill !== null) g.beginFill(fill, fillAlpha);

    g.moveTo(sign * Math.max(0, 4 - inset * 0.3), -halfH + Math.max(0, 4 - inset * 0.3));
    g.bezierCurveTo(
      sign * (w * 0.18), -halfH + 1,
      sign * (w * 0.66), -halfH + 6,
      sign * (w - 8), -halfH + 14
    );
    g.lineTo(sign * (w - 22), 0);
    g.lineTo(sign * (w - 8), halfH - 14);
    g.bezierCurveTo(
      sign * (w * 0.66), halfH - 6,
      sign * (w * 0.18), halfH - 1,
      sign * Math.max(0, 4 - inset * 0.3), halfH - Math.max(0, 4 - inset * 0.3)
    );
    g.bezierCurveTo(
      sign * 12, halfH * 0.32,
      sign * 12, -halfH * 0.32,
      sign * Math.max(0, 4 - inset * 0.3), -halfH + Math.max(0, 4 - inset * 0.3)
    );

    if (fill !== null) g.endFill();
    return g;
  }

  function buildWispPolygon(cx, cy, rx, ry, points = 12, jitter = 0.32, startAngle = 0) {
    const out = [];
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const a = startAngle + t * Math.PI * 2;
      const rMul = 1 + randomBetween(-jitter, jitter);
      out.push(
        cx + Math.cos(a) * rx * rMul,
        cy + Math.sin(a) * ry * rMul
      );
    }
    return out;
  }

  function makeAnimatedWisp({
    x = 0,
    y = 0,
    rx = 20,
    ry = 10,
    color = VECNA.shadow,
    alpha = 0.2,
    rotation = 0,
    driftX = 0,
    driftY = 0,
    pulseSpeed = 1,
    pulseDepth = 0.2,
    scalePulse = 0.06,
    points = 13,
    jitter = 0.34
  } = {}) {
    const g = new PIXI.Graphics();
    const pts = buildWispPolygon(0, 0, rx, ry, points, jitter, randomBetween(0, Math.PI * 2));
    gPoly(g, pts, color, alpha);
    g.position.set(x, y);
    g.rotation = rotation;
    g._base = {
      x,
      y,
      alpha,
      rotation,
      scale: 1,
      driftX,
      driftY,
      pulseSpeed,
      pulseDepth,
      scalePulse,
      phase: randomBetween(0, Math.PI * 2)
    };
    return g;
  }

  function animateWisps(container, elapsed, strength = 1) {
    if (!container?.children?.length) return;
    const time = elapsed / 1000;
    for (const child of container.children) {
      const b = child._base;
      if (!b) continue;
      const wave = Math.sin(time * b.pulseSpeed + b.phase);
      const wave2 = Math.cos(time * (b.pulseSpeed * 0.7) + b.phase * 0.8);
      child.x = b.x + wave2 * b.driftX * strength;
      child.y = b.y + wave * b.driftY * strength;
      child.rotation = b.rotation + wave * 0.05 * strength;
      child.alpha = Math.max(0, b.alpha * (1 + wave * b.pulseDepth * strength));
      const s = b.scale * (1 + wave2 * b.scalePulse * strength);
      child.scale.set(s);
    }
  }

  function drawVeilBodyGlow(banner) {
    const g = new PIXI.Graphics();
    g.beginFill(VECNA.purpleBright, 0.10);
    g.moveTo(-banner.mainWidth / 2 + 24, -banner.height / 2 + 10);
    g.bezierCurveTo(
      -banner.mainWidth * 0.18, -banner.height / 2 + 0,
      banner.mainWidth * 0.06, -banner.height / 2 + 10,
      banner.mainWidth * 0.16, -banner.height / 2 + 18
    );
    g.bezierCurveTo(
      banner.mainWidth * 0.02, -banner.height / 2 + 26,
      -banner.mainWidth * 0.18, -banner.height / 2 + 28,
      -banner.mainWidth / 2 + 24, -banner.height / 2 + 18
    );
    g.endFill();
    return g;
  }

  function makeEdgeWispLayer(banner) {
    const c = new PIXI.Container();
    const count = 18;
    for (let i = 0; i < count; i++) {
      c.addChild(makeAnimatedWisp({
        x: (i % 2 === 0 ? -1 : 1) * randomBetween(banner.mainWidth * 0.34, banner.mainWidth * 0.51),
        y: randomBetween(-banner.height * 0.46, banner.height * 0.46),
        rx: randomBetween(12, 26),
        ry: randomBetween(5, 15),
        color: i % 4 === 0 ? VECNA.purple : VECNA.shadowDeep,
        alpha: i % 4 === 0 ? 0.10 : 0.22,
        rotation: randomBetween(-1.0, 1.0),
        driftX: randomBetween(4, 10),
        driftY: randomBetween(4, 12),
        pulseSpeed: randomBetween(1.8, 3.2),
        pulseDepth: randomBetween(0.18, 0.42),
        scalePulse: randomBetween(0.05, 0.14),
        points: 12,
        jitter: 0.36
      }));
    }
    return c;
  }

  function makeCenterWispLayer(banner) {
    const c = new PIXI.Container();
    for (let i = 0; i < 12; i++) {
      c.addChild(makeAnimatedWisp({
        x: randomBetween(-banner.mainWidth * 0.40, banner.mainWidth * 0.40),
        y: randomBetween(-banner.height * 0.34, banner.height * 0.32),
        rx: randomBetween(10, 24),
        ry: randomBetween(4, 11),
        color: i % 5 === 0 ? VECNA.purpleBright : VECNA.shadow,
        alpha: i % 5 === 0 ? 0.08 : 0.09,
        rotation: randomBetween(-1.2, 1.2),
        driftX: randomBetween(3, 7),
        driftY: randomBetween(3, 7),
        pulseSpeed: randomBetween(1.5, 2.6),
        pulseDepth: randomBetween(0.14, 0.34),
        scalePulse: randomBetween(0.04, 0.10),
        points: 11,
        jitter: 0.30
      }));
    }
    return c;
  }

  function makeTailWispLayer(banner, isLeft) {
    const c = new PIXI.Container();
    const sign = isLeft ? -1 : 1;
    for (let i = 0; i < 7; i++) {
      c.addChild(makeAnimatedWisp({
        x: sign * randomBetween(20, banner.tailWidth + 10),
        y: randomBetween(-banner.height * 0.24, banner.height * 0.24),
        rx: randomBetween(8, 18),
        ry: randomBetween(4, 10),
        color: i % 3 === 0 ? VECNA.purple : VECNA.shadow,
        alpha: i % 3 === 0 ? 0.09 : 0.16,
        rotation: randomBetween(-0.9, 0.9),
        driftX: randomBetween(3, 8),
        driftY: randomBetween(3, 8),
        pulseSpeed: randomBetween(1.5, 2.8),
        pulseDepth: randomBetween(0.16, 0.34),
        scalePulse: randomBetween(0.04, 0.11),
        points: 11,
        jitter: 0.34
      }));
    }
    return c;
  }

  function drawVecnaVeil(banner) {
    const c = new PIXI.Container();

    const base = new PIXI.Container();
    const bodyBack = new PIXI.Graphics();
    drawBodyShape(bodyBack, banner, {
      inset: -14,
      fill: VECNA.shadowDeep,
      fillAlpha: 0.55
    });

    const bodyMid = new PIXI.Graphics();
    drawBodyShape(bodyMid, banner, {
      inset: -6,
      fill: VECNA.shadow,
      fillAlpha: 0.72
    });

    const bodyCore = new PIXI.Graphics();
    drawBodyShape(bodyCore, banner, {
      inset: 3,
      fill: VECNA.shadowDeep,
      fillAlpha: 0.34,
      lineWidth: 2,
      lineColor: VECNA.purple,
      lineAlpha: 0.12
    });

    base.addChild(bodyBack, bodyMid, bodyCore, drawVeilBodyGlow(banner));

    const edgeWisps = makeEdgeWispLayer(banner);
    const centerWisps = makeCenterWispLayer(banner);

    function makeTailVeil(isLeft) {
      const tail = new PIXI.Container();

      const outer = new PIXI.Graphics();
      drawTailShape(outer, banner, isLeft, {
        inset: -14,
        fill: VECNA.shadowDeep,
        fillAlpha: 0.34
      });

      const mid = new PIXI.Graphics();
      drawTailShape(mid, banner, isLeft, {
        inset: -6,
        fill: VECNA.shadow,
        fillAlpha: 0.46
      });

      const inner = new PIXI.Graphics();
      drawTailShape(inner, banner, isLeft, {
        inset: 3,
        fill: VECNA.shadowDeep,
        fillAlpha: 0.30
      });

      const tendrils = makeTailWispLayer(banner, isLeft);
      tendrils.x = isLeft ? -1 : 1;
      tail.addChild(outer, mid, inner, tendrils);
      return tail;
    }

    const left = makeTailVeil(true);
    const right = makeTailVeil(false);
    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(base, edgeWisps, centerWisps, left, right);
    c._edgeWisps = edgeWisps;
    c._centerWisps = centerWisps;
    c._leftTailWisps = left.children[left.children.length - 1];
    c._rightTailWisps = right.children[right.children.length - 1];
    return c;
  }

  function drawCorruptionLines(banner) {
    const g = new PIXI.Graphics();
    gLineStyle(g, 2, VECNA.purpleBright, 0.42);

    const x0 = -banner.mainWidth / 2 + 20;
    const x1 = banner.mainWidth / 2 - 20;
    const y0 = -banner.height / 2 + 14;
    const y1 = banner.height / 2 - 14;

    g.moveTo(x0 + 20, -4);
    g.lineTo(x0 + 54, -16);
    g.lineTo(x0 + 94, -2);
    g.lineTo(x0 + 126, -14);

    g.moveTo(-34, y0 + 10);
    g.lineTo(-8, -2);
    g.lineTo(18, y1 - 12);

    g.moveTo(x1 - 12, 8);
    g.lineTo(x1 - 46, 20);
    g.lineTo(x1 - 92, 6);
    g.lineTo(x1 - 126, 16);

    g.moveTo(-94, 18);
    g.lineTo(-56, 10);
    g.lineTo(-24, 20);

    g.moveTo(24, -16);
    g.lineTo(66, -6);
    g.lineTo(112, -20);

    return g;
  }

  function drawSmokeFlash(banner) {
    const c = new PIXI.Container();

    const body = new PIXI.Graphics();
    drawBodyShape(body, banner, {
      inset: 1,
      fill: VECNA.purpleBright,
      fillAlpha: 0.18
    });

    const left = new PIXI.Graphics();
    drawTailShape(left, banner, true, {
      inset: 1,
      fill: VECNA.purpleBright,
      fillAlpha: 0.12
    });

    const right = new PIXI.Graphics();
    drawTailShape(right, banner, false, {
      inset: 1,
      fill: VECNA.purpleBright,
      fillAlpha: 0.12
    });

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    const coreBurst = new PIXI.Container();
    for (let i = 0; i < 8; i++) {
      coreBurst.addChild(makeAnimatedWisp({
        x: randomBetween(-banner.mainWidth * 0.18, banner.mainWidth * 0.18),
        y: randomBetween(-banner.height * 0.18, banner.height * 0.18),
        rx: randomBetween(16, 32),
        ry: randomBetween(7, 15),
        color: i % 2 === 0 ? VECNA.purpleBright : VECNA.magenta,
        alpha: 0.10,
        rotation: randomBetween(-1.2, 1.2),
        driftX: randomBetween(5, 12),
        driftY: randomBetween(5, 12),
        pulseSpeed: randomBetween(2.6, 4.4),
        pulseDepth: randomBetween(0.24, 0.46),
        scalePulse: randomBetween(0.08, 0.16),
        points: 12,
        jitter: 0.38
      }));
    }

    c.addChild(body, left, right, coreBurst);
    c._coreBurst = coreBurst;
    return c;
  }

  function drawSmokeMass(banner) {
    const c = new PIXI.Container();

    for (let i = 0; i < 24; i++) {
      const nearCenter = i < 13;
      c.addChild(makeAnimatedWisp({
        x: nearCenter
          ? randomBetween(-banner.mainWidth * 0.34, banner.mainWidth * 0.34)
          : randomBetween(-banner.totalWidth * 0.50, banner.totalWidth * 0.50),
        y: randomBetween(-banner.height * 0.54, banner.height * 0.48),
        rx: nearCenter ? randomBetween(20, 48) : randomBetween(14, 30),
        ry: nearCenter ? randomBetween(9, 20) : randomBetween(6, 14),
        color: i % 5 === 0 ? VECNA.purple : VECNA.shadowDeep,
        alpha: i % 5 === 0 ? 0.05 : 0.24,
        rotation: randomBetween(-1.0, 1.0),
        driftX: randomBetween(5, 12),
        driftY: randomBetween(6, 14),
        pulseSpeed: randomBetween(1.2, 2.3),
        pulseDepth: randomBetween(0.18, 0.40),
        scalePulse: randomBetween(0.06, 0.14),
        points: 13,
        jitter: 0.36
      }));
    }

    c._wisps = c.children;
    return c;
  }

    function spawnSmokeParticle(banner, opts = {}) {
    const fromEdge = opts.fromEdge ?? false;
    const bright = opts.bright ?? false;

    const x = fromEdge
        ? (Math.random() < 0.5 ? -1 : 1) * randomBetween(banner.mainWidth * 0.30, banner.totalWidth * 0.54)
        : randomBetween(-banner.mainWidth * 0.48, banner.mainWidth * 0.48);

    const y = randomBetween(-banner.height * 0.46, banner.height * 0.36);

    banner.spawnParticle({
        parent: "fx",
        shape: "circle",
        x,
        y,
        radius: bright ? randomBetween(3.2, 5.8) : randomBetween(7.5, 16.5),
        color: bright
        ? (Math.random() < 0.68 ? VECNA.purpleBright : VECNA.magenta)
        : (Math.random() < 0.90 ? VECNA.shadowDeep : VECNA.purple),
        alpha: bright ? randomBetween(0.48, 0.82) : randomBetween(0.20, 0.34),
        vx: bright ? randomBetween(-30, 30) : randomBetween(-24, 24),
        vy: bright ? randomBetween(-68, -18) : randomBetween(-28, 12),
        vr: randomBetween(-0.04, 0.04),
        life: bright ? randomBetween(320, 720) : randomBetween(760, 1320),
        scaleFrom: bright ? randomBetween(1.0, 1.15) : randomBetween(0.82, 1.05),
        scaleTo: bright ? 0.18 : randomBetween(1.28, 1.82)
    });
    }

    function spawnEdgeSmokeBurst(banner, count = 14) {
    for (let i = 0; i < count; i++) {
        spawnSmokeParticle(banner, {
        fromEdge: true,
        bright: false
        });

        if (Math.random() < 0.35) {
        spawnSmokeParticle(banner, {
            fromEdge: false,
            bright: false
        });
        }
    }
    }

    function spawnPurpleSparks(banner, count = 8) {
    for (let i = 0; i < count; i++) {
        spawnSmokeParticle(banner, {
        fromEdge: Math.random() < 0.45,
        bright: true
        });
    }
    }

  function animateVecnaLayers(banner, strength = 1) {
    const veil = banner.getEffectLayer("vecnaVeil");
    const flash = banner.getEffectLayer("vecnaFlash");
    const mass = banner.getEffectLayer("vecnaMass");

    if (veil) {
      animateWisps(veil._edgeWisps, banner.elapsed, 0.8 * strength);
      animateWisps(veil._centerWisps, banner.elapsed, 0.7 * strength);
      animateWisps(veil._leftTailWisps, banner.elapsed, 0.8 * strength);
      animateWisps(veil._rightTailWisps, banner.elapsed, 0.8 * strength);
    }

    if (flash?._coreBurst) {
      animateWisps(flash._coreBurst, banner.elapsed, 1.1 * strength);
    }

    if (mass) {
      animateWisps(mass, banner.elapsed, 1.0 * strength);
    }
  }

  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: EFFECT_ID,
    types: ["fumble"],
    startDelay: 3000,
    totalDuration: 1300,

    setup(banner) {
      banner.addEffectLayer("vecnaVeil", drawVecnaVeil(banner), {
        parent: "bodyGroup",
        alpha: 0
      });

      banner.addEffectLayer("vecnaCorruption", drawCorruptionLines(banner), {
        parent: "bodyGroup",
        alpha: 0
      });

      banner.addEffectLayer("vecnaFlash", drawSmokeFlash(banner), {
        parent: "bodyGroup",
        alpha: 0
      });

      banner.addEffectLayer("vecnaMass", drawSmokeMass(banner), {
        parent: "fx",
        alpha: 0
      });
    },

    onHold(banner) {
      const pulse = (Math.sin((banner.elapsed / 1000) * 4.4) + 1) * 0.5;

      const veil = banner.getEffectLayer("vecnaVeil");
      const corruption = banner.getEffectLayer("vecnaCorruption");
      const mass = banner.getEffectLayer("vecnaMass");

      if (veil) {
        veil.alpha = 0.14 + pulse * 0.16;
        veil.rotation = Math.sin((banner.elapsed / 1000) * 1.9) * 0.022;
        const s = 1 + Math.sin((banner.elapsed / 1000) * 2.6) * 0.018;
        veil.scale.set(s);
      }

      if (corruption) {
        corruption.alpha = 0.05 + pulse * 0.09;
      }

      if (mass) {
        mass.alpha = 0.06 + pulse * 0.07;
        const ms = 1 + pulse * 0.032;
        mass.scale.set(ms);
        mass.rotation = Math.sin((banner.elapsed / 1000) * 1.4) * 0.012;
      }

      animateVecnaLayers(banner, 1.15 + pulse * 0.65);

      banner.motion.tint = mixHex(0xffffff, VECNA.purple, 0.08 + pulse * 0.08);
      banner.innerGlow.alpha = 0.38 + pulse * 0.08;
      banner.shine.alpha *= 0.55;

      if (Math.random() < 0.34) spawnSmokeParticle(banner, { fromEdge: Math.random() < 0.72 });
      if (Math.random() < 0.18) spawnSmokeParticle(banner, { fromEdge: false });
      if (Math.random() < 0.12) spawnPurpleSparks(banner, 1);
    },

    onPrepareExit(banner) {
      banner.resetVisualState();
      banner.bodyGroup.visible = true;
      banner.bodyGroup.alpha = 1;

      const veil = banner.getEffectLayer("vecnaVeil");
      const corruption = banner.getEffectLayer("vecnaCorruption");
      const flash = banner.getEffectLayer("vecnaFlash");
      const mass = banner.getEffectLayer("vecnaMass");

      if (veil) veil.alpha = 0.22;
      if (corruption) corruption.alpha = 0.12;
      if (flash) flash.alpha = 0;
      if (mass) {
        mass.alpha = 0.10;
        mass.scale.set(0.96);
      }

      spawnEdgeSmokeBurst(banner, 18);
      spawnPurpleSparks(banner, 12);
    },

    onExit(banner, t) {
      const bloomT = clamp01(t / 0.34);
      const swallowT = clamp01((t - 0.34) / 0.66);

      const veil = banner.getEffectLayer("vecnaVeil");
      const corruption = banner.getEffectLayer("vecnaCorruption");
      const flash = banner.getEffectLayer("vecnaFlash");
      const mass = banner.getEffectLayer("vecnaMass");

      if (t <= 0.34) {
        const e = easeOutCubic(bloomT);
        const flashT = clamp01((bloomT - 0.62) / 0.38);

        banner.root.alpha = 1;
        banner.root.position.set(banner.baseX, banner.baseY);
        banner.motion.scale.set(banner.baseScale * lerp(1, 1.02, e));
        banner.motion.rotation = banner.baseRotation + lerp(0, -0.010, e);
        banner.motion.tint = mixHex(VECNA.shadowDeep, 0x000000, swallowT * 0.6);
        banner.innerGlow.alpha = lerp(0.42, 0.14, e);
        banner.bodyGroup.alpha = lerp(1, 0.90, e*1.4);
        banner.shine.alpha = 0;

        if (veil) {
            veil.alpha = lerp(0.22, 0.94, e);
            const vs = lerp(0.98, 1.06, e);
            veil.scale.set(vs);
            veil.rotation = Math.sin((banner.elapsed / 1000) * 3.2) * 0.028 * e;
        }

        if (corruption) {
          corruption.alpha = lerp(0.12, 0.62, e);
        }

        if (flash) {
          flash.alpha = Math.sin(flashT * Math.PI) * 0.24;
          flash.scale.set(lerp(0.98, 1.04, e));
        }

        if (mass) {
            mass.alpha = lerp(0.12, 0.48, e);
            const ms = lerp(0.94, 1.10, e);
            mass.scale.set(ms);
            mass.rotation = Math.sin((banner.elapsed / 1000) * 2.4) * 0.022 * e;
        }

        animateVecnaLayers(banner, 1.35 + e * 0.75);

        if (Math.random() < 0.56) spawnSmokeParticle(banner, { fromEdge: true });
        if (Math.random() < 0.28) spawnSmokeParticle(banner, { fromEdge: false });
        if (Math.random() < 0.22) spawnPurpleSparks(banner, 2);
        return;
      }

      const e = easeInQuad(swallowT);

      banner.root.alpha = 1 - e;
      banner.root.position.set(
        banner.baseX + lerp(0, 12, e),
        banner.baseY + lerp(0, -8, e)
      );
      banner.motion.scale.set(banner.baseScale * lerp(1.02, 1.07, e));
      banner.motion.rotation = banner.baseRotation + lerp(-0.010, -0.020, e);
      banner.motion.tint = mixHex(VECNA.purple, VECNA.shadowDeep, swallowT * 0.42);
      banner.innerGlow.alpha = lerp(0.14, 0, e);
      banner.bodyGroup.alpha = lerp(0.90, 0.0, e);
      banner.shine.alpha = 0;

      if (veil) {
        veil.alpha = lerp(0.86, 0.16, e);
        veil.scale.set(lerp(1.02, 1.10, e));
      }

      if (corruption) {
        corruption.alpha = lerp(0.62, 0.0, e);
      }

      if (flash) {
        flash.alpha = 0;
      }

      if (mass) {
        mass.alpha = lerp(0.38, 0.76, e);
        mass.scale.set(lerp(1.04, 1.28, e));
      }

      animateVecnaLayers(banner, 1.15 + e * 0.55);

      if (swallowT < 0.78) {
        if (Math.random() < 0.78) spawnSmokeParticle(banner, { fromEdge: true });
        if (Math.random() < 0.34) spawnSmokeParticle(banner, { fromEdge: false });
        if (Math.random() < 0.26) spawnPurpleSparks(banner, 2);
      } else {
        if (Math.random() < 0.28) spawnSmokeParticle(banner, { fromEdge: false });
      }
    },

    onDestroy(banner) {
      banner.motion.tint = 0xffffff;
    }
  });
})();