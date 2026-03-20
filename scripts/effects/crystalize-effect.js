(() => {
  const EFFECT_ID = "crystalize";

  function drawCrystalOverlay(banner) {
    const g = new PIXI.Container();
    const crystalColor = mixHex(COLORS.ice, COLORS.white, 0.45);

    const x = -banner.mainWidth / 2;
    const y = -banner.height / 2;
    const w = banner.mainWidth;
    const h = banner.height;
    const topInset = 18;
    const sideBulge = 10;

    const body = new PIXI.Graphics();
    body.beginFill(crystalColor, 0.18);
    body.moveTo(x + topInset, y + 2);
    body.bezierCurveTo(
      x - sideBulge + 2, y + h * 0.10,
      x - sideBulge + 2, y + h * 0.90,
      x + topInset, y + h - 2
    );
    body.lineTo(x + w - topInset, y + h - 2);
    body.bezierCurveTo(
      x + w + sideBulge - 2, y + h * 0.90,
      x + w + sideBulge - 2, y + h * 0.10,
      x + w - topInset, y + 2
    );
    body.bezierCurveTo(
      x + w * 0.72, y + 8,
      x + w * 0.28, y + 8,
      x + topInset, y + 2
    );
    body.endFill();

    const makeTailOverlay = (isLeft) => {
      const t = new PIXI.Graphics();
      const sign = isLeft ? -1 : 1;
      const th = banner.height * 0.76;
      const halfH = th / 2;
      const tw = banner.tailWidth + 18;

      t.beginFill(crystalColor, 0.16);
      t.moveTo(sign * 4, -halfH + 4);
      t.bezierCurveTo(
        sign * (tw * 0.18), -halfH + 1,
        sign * (tw * 0.66), -halfH + 6,
        sign * (tw - 8), -halfH + 14
      );
      t.lineTo(sign * (tw - 22), 0);
      t.lineTo(sign * (tw - 8), halfH - 14);
      t.bezierCurveTo(
        sign * (tw * 0.66), halfH - 6,
        sign * (tw * 0.18), halfH - 1,
        sign * 4, halfH - 4
      );
      t.bezierCurveTo(
        sign * 12, halfH * 0.32,
        sign * 12, -halfH * 0.32,
        sign * 4, -halfH + 4
      );
      t.endFill();
      return t;
    };

    const left = makeTailOverlay(true);
    const right = makeTailOverlay(false);

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    g.addChild(body, left, right);
    return g;
  }

  function drawCrystalSparkle(banner) {
    const c = new PIXI.Container();

    const bar1 = new PIXI.Graphics();
    bar1.beginFill(COLORS.white, 0.16);
    bar1.drawRoundedRect(-banner.mainWidth * 0.20, -banner.height * 0.22, banner.mainWidth * 0.28, 8, 4);
    bar1.endFill();

    const bar2 = new PIXI.Graphics();
    bar2.beginFill(COLORS.iceBright, 0.12);
    bar2.drawRoundedRect(-banner.mainWidth * 0.02, -banner.height * 0.08, banner.mainWidth * 0.22, 6, 3);
    bar2.endFill();

    const star = new PIXI.Graphics();
    gStar(star, banner.mainWidth * 0.16, -banner.height * 0.12, 4, 18, 7, COLORS.white, 0.20);

    c.addChild(bar1, bar2, star);
    return c;
  }

  function drawCrystalFlash(banner) {
    const g = new PIXI.Container();

    const body = new PIXI.Graphics();
    const x = -banner.mainWidth / 2;
    const y = -banner.height / 2;
    const w = banner.mainWidth;
    const h = banner.height;
    const topInset = 18;
    const sideBulge = 10;

    body.beginFill(COLORS.white, 0.28);
    body.moveTo(x + topInset, y + 2);
    body.bezierCurveTo(
      x - sideBulge + 2, y + h * 0.10,
      x - sideBulge + 2, y + h * 0.90,
      x + topInset, y + h - 2
    );
    body.lineTo(x + w - topInset, y + h - 2);
    body.bezierCurveTo(
      x + w + sideBulge - 2, y + h * 0.90,
      x + w + sideBulge - 2, y + h * 0.10,
      x + w - topInset, y + 2
    );
    body.bezierCurveTo(
      x + w * 0.72, y + 8,
      x + w * 0.28, y + 8,
      x + topInset, y + 2
    );
    body.endFill();

    const star = new PIXI.Graphics();
    gStar(star, 0, 0, 4, 18, 7, COLORS.white, 0.20);

    g.addChild(body, star);
    return g;
  }

  function spawnCrystalDust(banner, count = 8) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        x: randomBetween(-banner.mainWidth / 2 + 20, banner.mainWidth / 2 - 20),
        y: randomBetween(-banner.height * 0.18, banner.height * 0.18),
        radius: randomBetween(1.4, 3.2),
        color: Math.random() < 0.5 ? COLORS.white : COLORS.iceBright,
        alpha: randomBetween(0.65, 0.95),
        vx: randomBetween(-18, 18),
        vy: randomBetween(-130, -55),
        life: randomBetween(500, 1100),
        scaleFrom: 1,
        scaleTo: 0.12
      });
    }
  }

  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: EFFECT_ID,
    types: ["critical"],
    startDelay: 3000,
    totalDuration: 1200,

    setup(banner) {
      const overlayIndex = banner.bodyGroup.getChildIndex(banner.shine) + 1;

      banner.addEffectLayer("crystalOverlay", drawCrystalOverlay(banner), {
        parent: "bodyGroup",
        index: overlayIndex,
        alpha: 0
      });

      banner.addEffectLayer("crystalSparkle", drawCrystalSparkle(banner), {
        parent: "bodyGroup",
        index: overlayIndex + 1,
        alpha: 0
      });

      banner.addEffectLayer("crystalFlash", drawCrystalFlash(banner), {
        parent: "bodyGroup",
        index: overlayIndex + 2,
        alpha: 0
      });
    },

    onHold(banner, t) {
      const pulse = (Math.sin((banner.elapsed / 1000) * 4.2) + 1) * 0.5;

      const overlay = banner.getEffectLayer("crystalOverlay");
      const sparkle = banner.getEffectLayer("crystalSparkle");
      const flash = banner.getEffectLayer("crystalFlash");

      if (overlay) overlay.alpha = lerp(0.12, 0.50, t);
      if (sparkle) sparkle.alpha = 0.14 + pulse * 0.22;
      if (flash) flash.alpha = 0;

      banner.motion.tint = mixHex(0xffffff, COLORS.ice, 0.24 + t * 0.10);
      banner.innerGlow.alpha = 0.48 + pulse * 0.08;

      if (sparkle?.children[0]) {
        sparkle.children[0].x = lerp(-banner.mainWidth * 0.12, banner.mainWidth * 0.20, pulse);
      }
      if (sparkle?.children[1]) {
        sparkle.children[1].x = lerp(-banner.mainWidth * 0.05, banner.mainWidth * 0.12, 1 - pulse);
      }

      if (Math.random() < 0.07) spawnCrystalDust(banner, 1);
    },

    onPrepareExit(banner) {
      banner.resetVisualState();

      const overlay = banner.getEffectLayer("crystalOverlay");
      const sparkle = banner.getEffectLayer("crystalSparkle");
      const flash = banner.getEffectLayer("crystalFlash");

      if (overlay) overlay.alpha = 0.55;
      if (sparkle) sparkle.alpha = 0.32;
      if (flash) flash.alpha = 0;

      banner.bodyGroup.visible = true;
      banner.bodyGroup.alpha = 1;
    },

    onExit(banner, t) {
      const e = easeOutCubic(t);
      const flashT = clamp01((t - 0.18) / 0.22);

      const overlay = banner.getEffectLayer("crystalOverlay");
      const sparkle = banner.getEffectLayer("crystalSparkle");
      const flash = banner.getEffectLayer("crystalFlash");

      banner.root.alpha = 1 - e * 0.28;
      banner.root.position.set(banner.baseX, banner.baseY - lerp(0, 18, e));
      banner.motion.scale.set(banner.baseScale * lerp(1, 1.08, e));
      banner.motion.rotation = banner.baseRotation;

      banner.motion.tint = mixHex(0xffffff, COLORS.iceBright, 0.30 * (1 - t));
      if (overlay) overlay.alpha = lerp(0.70, 0.05, e);
      if (sparkle) sparkle.alpha = lerp(0.45, 0.0, e);
      banner.innerGlow.alpha = lerp(0.55, 0.0, e);
      banner.shine.alpha = lerp(banner.shine.alpha, 0, 0.25);

      if (flash) flash.alpha = Math.sin(flashT * Math.PI) * 0.42 * (1 - t * 0.35);

      const burstChance =
        t < 0.25 ? 0.75 :
        t < 0.55 ? 0.45 :
        t < 0.85 ? 0.22 :
        0.08;

      if (Math.random() < burstChance) {
        const amount =
          t < 0.25 ? 4 :
          t < 0.55 ? 3 :
          t < 0.85 ? 2 : 1;

        spawnCrystalDust(banner, amount);
      }

      banner.bodyGroup.alpha = lerp(1, 0.15, e);
    },

    onDestroy(banner) {
      banner.motion.tint = 0xffffff;
    }
  });
})();