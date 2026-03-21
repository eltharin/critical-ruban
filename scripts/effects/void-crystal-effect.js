(() => {
	const EFFECT_ID = "voidCrystalFumble";

	const CRYSTAL_DARK = 0x16071f;
	const CRYSTAL_DEEP = 0x2b0d46;
	const CRYSTAL_MID = 0x5c20a8;
	const CRYSTAL_BRIGHT = 0x8f4dff;
	const CRYSTAL_EDGE = 0xe7d7ff;
	const VOID_TINT = 0x120716;

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

	function drawCorruptionOverlay(banner) {
		const c = new PIXI.Container();

		const outerGlow = new PIXI.Graphics();
		drawBodyShape(outerGlow, banner, {
			inset: -10,
			fill: CRYSTAL_BRIGHT,
			fillAlpha: 0.08
		});

		const outerGlow2 = new PIXI.Graphics();
		drawBodyShape(outerGlow2, banner, {
			inset: -4,
			fill: 0xffffff,
			fillAlpha: 0.035
		});

		const bodyDark = new PIXI.Graphics();
		drawBodyShape(bodyDark, banner, {
			inset: 2,
			fill: VOID_TINT,
			fillAlpha: 0.44
		});

		const bodyPurple = new PIXI.Graphics();
		drawBodyShape(bodyPurple, banner, {
			inset: 3,
			fill: CRYSTAL_DEEP,
			fillAlpha: 0.38
		});

		const bodyVeil = new PIXI.Graphics();
		drawBodyShape(bodyVeil, banner, {
			inset: 10,
			fill: CRYSTAL_BRIGHT,
			fillAlpha: 0.12
		});

		const makeTail = (isLeft) => {
			const tail = new PIXI.Container();

			const glow = new PIXI.Graphics();
			drawTailShape(glow, banner, isLeft, {
				inset: -8,
				fill: CRYSTAL_BRIGHT,
				fillAlpha: 0.06
			});

			const dark = new PIXI.Graphics();
			drawTailShape(dark, banner, isLeft, {
				inset: 2,
				fill: VOID_TINT,
				fillAlpha: 0.40
			});

			const purple = new PIXI.Graphics();
			drawTailShape(purple, banner, isLeft, {
				inset: 3,
				fill: CRYSTAL_DEEP,
				fillAlpha: 0.34
			});

			const shine = new PIXI.Graphics();
			drawTailShape(shine, banner, isLeft, {
				inset: 8,
				fill: CRYSTAL_BRIGHT,
				fillAlpha: 0.08
			});

			tail.addChild(glow, dark, purple, shine);
			return tail;
		};

		const left = makeTail(true);
		const right = makeTail(false);

		left.x = -banner.mainWidth / 2 - 14;
		right.x = banner.mainWidth / 2 + 14;

		c.addChild(outerGlow, outerGlow2, bodyDark, bodyPurple, bodyVeil, left, right);
		return c;
	}

	function drawVeinLines(banner) {
		const g = new PIXI.Graphics();

		gLineStyle(g, 2, CRYSTAL_EDGE, 0.24);

		const x0 = -banner.mainWidth / 2 + 16;
		const x1 = banner.mainWidth / 2 - 16;
		const y0 = -banner.height / 2 + 12;
		const y1 = banner.height / 2 - 12;

		g.moveTo(x0 + 24, -6);
		g.lineTo(x0 + 78, -18);
		g.lineTo(x0 + 132, -2);
		g.lineTo(x0 + 168, 14);

		g.moveTo(-30, y0 + 4);
		g.lineTo(-8, -10);
		g.lineTo(18, 8);
		g.lineTo(30, y1 - 10);

		g.moveTo(56, -2);
		g.lineTo(104, -18);
		g.lineTo(150, -6);
		g.lineTo(190, 10);

		g.moveTo(x1 - 36, 18);
		g.lineTo(x1 - 84, 8);
		g.lineTo(x1 - 132, 18);

		return g;
	}

	function buildCrystalVariant(size, color, alpha) {
		const variants = [
			[
				0, -size * 1.40,
				size * 0.36, -size * 0.54,
				size * 0.72, -size * 0.02,
				size * 0.16, size * 1.12,
				-size * 0.28, size * 0.86,
				-size * 0.62, size * 0.08,
				-size * 0.34, -size * 0.72
			],
			[
				-size * 0.14, -size * 1.12,
				size * 0.34, -size * 0.90,
				size * 0.92, -size * 0.08,
				size * 0.48, size * 0.78,
				-size * 0.04, size * 1.18,
				-size * 0.58, size * 0.50,
				-size * 0.84, -size * 0.16,
				-size * 0.44, -size * 0.92
			],
			[
				0, -size * 1.56,
				size * 0.26, -size * 0.72,
				size * 0.60, -size * 0.16,
				size * 0.24, size * 1.06,
				-size * 0.20, size * 0.94,
				-size * 0.54, size * 0.18,
				-size * 0.24, -size * 0.82
			],
			[
				0, -size * 1.24,
				size * 0.52, -size * 0.60,
				size * 1.00, -size * 0.02,
				size * 0.32, size * 0.94,
				-size * 0.12, size * 1.16,
				-size * 0.62, size * 0.30,
				-size * 0.92, -size * 0.18,
				-size * 0.26, -size * 0.96
			]
		];

		const pts = variants[Math.floor(Math.random() * variants.length)];
		const g = new PIXI.Graphics();

		g.lineStyle(2, CRYSTAL_EDGE, 0.24);
		g.beginFill(color, alpha);
		g.drawPolygon(pts);
		g.endFill();

		const inner = [];
		for (let i = 0; i < pts.length; i += 2) {
			inner.push(pts[i] * 0.56, pts[i + 1] * 0.56);
		}

		g.beginFill(0xd8bfff, 0.20);
		g.drawPolygon(inner);
		g.endFill();

		g.lineStyle(1.2, 0xffffff, 0.18);
		g.moveTo(pts[0], pts[1]);
		g.lineTo(pts[2], pts[3]);
		g.lineTo(pts[4], pts[5]);

		return g;
	}

	function createCrystalCluster(x, y, size) {
		const c = new PIXI.Container();

		const main = buildCrystalVariant(
			size,
			Math.random() < 0.5 ? CRYSTAL_BRIGHT : CRYSTAL_MID,
			0.96
		);
		main.rotation = randomBetween(-0.35, 0.35);
		c.addChild(main);

		const childCount = Math.floor(randomBetween(1, 4));
		for (let i = 0; i < childCount; i++) {
			const shard = buildCrystalVariant(
				size * randomBetween(0.34, 0.74),
				Math.random() < 0.5 ? 0xa66cff : 0x5a1fc9,
				randomBetween(0.68, 0.90)
			);

			const angle = randomBetween(-2.8, 1.6);
			const dist = randomBetween(size * 0.20, size * 0.82);

			shard.x = Math.cos(angle) * dist;
			shard.y = Math.sin(angle) * dist;
			shard.rotation = randomBetween(-1.2, 1.2);

			c.addChild(shard);
		}

		const glow = new PIXI.Graphics();
		glow.beginFill(0xdabaff, 0.18);
		glow.drawCircle(0, 0, size * 0.34);
		glow.endFill();
		c.addChild(glow);

		c.x = x;
		c.y = y;
		c.rotation = randomBetween(-0.45, 0.45);

		return c;
	}

	function createCrystalField(banner) {
		const container = new PIXI.Container();
		const entries = [];

		const count = Math.floor(randomBetween(30, 40));

		for (let i = 0; i < count; i++) {
			const x = randomBetween(-banner.totalWidth * 0.44, banner.totalWidth * 0.44);
			const y = randomBetween(-banner.height * 0.34, banner.height * 0.34);

			const edgeBias = Math.abs(x) / (banner.totalWidth * 0.44);
			const size = randomBetween(10, 22) + edgeBias * randomBetween(2, 8);

			const cluster = createCrystalCluster(x, y, size);
			cluster.alpha = 0;
			cluster.scale.set(0.12);

			container.addChild(cluster);
			entries.push({
				sprite: cluster,
				baseX: x,
				baseY: y,
				baseRotation: cluster.rotation,
				appearAt: randomBetween(0.00, 0.88),
				appearWindow: randomBetween(0.07, 0.18),
				targetScale: randomBetween(0.88, 1.18),
				targetAlpha: randomBetween(0.74, 1.0),
				driftX: Math.sign(x || 1) * randomBetween(1.0, 6.0),
				driftY: randomBetween(-3.0, 3.0),
				rotSpeed: randomBetween(0.0015, 0.0050),
				growthBias: randomBetween(0.9, 1.2)
			});
		}

		entries.sort((a, b) => a.appearAt - b.appearAt);
		container._entries = entries;
		return container;
	}

	function updateCrystalField(crystals, progress, elapsed, growthMultiplier = 1) {
		const entries = crystals?._entries ?? [];
		const time = elapsed ?? 0;

		for (const entry of entries) {
			const localT = clamp01((progress - entry.appearAt) / entry.appearWindow);

			if (localT <= 0) {
				entry.sprite.alpha = 0;
				entry.sprite.scale.set(0.12);
				entry.sprite.x = entry.baseX;
				entry.sprite.y = entry.baseY;
				entry.sprite.rotation = entry.baseRotation;
				continue;
			}

			const e = easeOutBackSoft(localT);
			const baseScale = lerp(0.12, entry.targetScale * growthMultiplier * entry.growthBias, e);

			entry.sprite.alpha = entry.targetAlpha * clamp01(localT);
			entry.sprite.scale.set(baseScale);

			const pulse = 1 + Math.sin(time * 0.004 + entry.baseX * 0.022 + entry.baseY * 0.03) * 0.035;
			entry.sprite.scale.x *= pulse;
			entry.sprite.scale.y *= pulse;

			entry.sprite.rotation = entry.baseRotation + Math.sin(time * entry.rotSpeed) * 0.10;
			entry.sprite.x = entry.baseX + Math.sin(time * 0.0017 + entry.baseY * 0.03) * entry.driftX;
			entry.sprite.y = entry.baseY + Math.cos(time * 0.0015 + entry.baseX * 0.02) * entry.driftY;
		}
	}

	function drawPulseFlash(banner) {
		const c = new PIXI.Container();

		const body = new PIXI.Graphics();
		drawBodyShape(body, banner, {
			inset: 0,
			fill: CRYSTAL_EDGE,
			fillAlpha: 0.24
		});

		const left = new PIXI.Graphics();
		drawTailShape(left, banner, true, {
			inset: 0,
			fill: CRYSTAL_EDGE,
			fillAlpha: 0.18
		});

		const right = new PIXI.Graphics();
		drawTailShape(right, banner, false, {
			inset: 0,
			fill: CRYSTAL_EDGE,
			fillAlpha: 0.18
		});

		left.x = -banner.mainWidth / 2 - 14;
		right.x = banner.mainWidth / 2 + 14;

		const star = new PIXI.Graphics();
		gStar(star, 0, 0, 4, 24, 9, 0xffffff, 0.18);

		c.addChild(body, left, right, star);
		return c;
	}

	function spawnCrystalDust(banner, count = 10) {
		for (let i = 0; i < count; i++) {
			const purple = Math.random() < 0.50 ? CRYSTAL_BRIGHT : (Math.random() < 0.5 ? CRYSTAL_MID : 0xc7a4ff);

			banner.spawnParticle({
				parent: "fx",
				x: randomBetween(-banner.totalWidth * 0.46, banner.totalWidth * 0.46),
				y: randomBetween(-banner.height * 0.40, banner.height * 0.40),
				radius: randomBetween(2.4, 6.0),
				color: purple,
				alpha: randomBetween(0.58, 0.98),
				vx: randomBetween(-120, 120),
				vy: randomBetween(-120, 70),
				vr: randomBetween(-0.05, 0.05),
				life: randomBetween(420, 980),
				scaleFrom: randomBetween(0.9, 1.2),
				scaleTo: 0.18
			});
		}
	}

	globalThis.CriticalRubanEffects.registerRubanEffect({
		id: EFFECT_ID,
		types: ["fumble"],
		startDelay: 3000,
		totalDuration: 1350,

		setup(banner) {
			banner.addEffectLayer("corruptionOverlay", drawCorruptionOverlay(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("veinLines", drawVeinLines(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("pulseFlash", drawPulseFlash(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("crystalField", createCrystalField(banner), {
				parent: "fx",
				alpha: 1
			});
		},

		onHold(banner, t) {
			const crystals = banner.getEffectLayer("crystalField");
			const overlay = banner.getEffectLayer("corruptionOverlay");
			const veins = banner.getEffectLayer("veinLines");
			const flash = banner.getEffectLayer("pulseFlash");

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;
				updateCrystalField(crystals, t, banner.elapsed, 1);

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha > 0.02) {
						entry.sprite.rotation += entry.rotSpeed * 0.35;
					}
				}
			}

			if (overlay) {
				overlay.alpha = lerp(0.06, 0.44, easeInOutQuad(t));
			}

			if (veins) {
				veins.alpha = 0.06 + easeInOutQuad(t) * 0.22 + Math.sin((banner.elapsed / 1000) * 4.4) * 0.03;
			}

			if (flash) {
				const pulse = (Math.sin((banner.elapsed / 1000) * 3.2) + 1) * 0.5;
				flash.alpha = 0.02 + pulse * 0.05;
			}

			banner.motion.tint = mixHex(0xffffff, CRYSTAL_MID, 0.10 + t * 0.10);
			banner.innerGlow.alpha = 0.48 + Math.sin((banner.elapsed / 1000) * 4.0) * 0.05;

			if (Math.random() < 0.22) {
				spawnCrystalDust(banner, 1);
			}
		},

		onPrepareExit(banner) {
			banner.resetVisualState();

			const crystals = banner.getEffectLayer("crystalField");
			const overlay = banner.getEffectLayer("corruptionOverlay");
			const veins = banner.getEffectLayer("veinLines");
			const flash = banner.getEffectLayer("pulseFlash");

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;
				updateCrystalField(crystals, 1, banner.elapsed, 1);
			}

			if (overlay) overlay.alpha = 0.44;
			if (veins) veins.alpha = 0.26;
			if (flash) flash.alpha = 0;

			spawnCrystalDust(banner, 14);
		},

		onExit(banner, t) {
			const crystals = banner.getEffectLayer("crystalField");
			const overlay = banner.getEffectLayer("corruptionOverlay");
			const veins = banner.getEffectLayer("veinLines");
			const flash = banner.getEffectLayer("pulseFlash");

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;
			}

			if (t < 0.45) {
				const e = easeOutCubic(t / 0.45);

				banner.root.alpha = 1;
				banner.root.position.set(banner.baseX, banner.baseY);
				banner.motion.scale.set(banner.baseScale * lerp(1, 1.026, e));
				banner.motion.rotation = banner.baseRotation;

				if (crystals) {
					updateCrystalField(crystals, lerp(0.72, 1.0, e), banner.elapsed, lerp(1.0, 1.55, e));

					for (const entry of crystals._entries ?? []) {
						if (entry.sprite.alpha <= 0.01) continue;

						const dirX = Math.sign(entry.baseX || 1);
						const dirY = Math.sign(entry.baseY || 1);

						entry.sprite.x += dirX * lerp(0, 8, e);
						entry.sprite.y += dirY * lerp(0, 4, e);
						entry.sprite.rotation += entry.rotSpeed * 2.0;
					}
				}

				if (overlay) overlay.alpha = lerp(0.44, 0.76, e);
				if (veins) veins.alpha = lerp(0.26, 0.54, e);
				if (flash) {
					const flashT = clamp01((e - 0.68) / 0.32);
					flash.alpha = Math.sin(flashT * Math.PI) * 0.24;
				}

				banner.innerGlow.alpha = lerp(0.44, 0.16, e);
				banner.motion.tint = mixHex(0xffffff, CRYSTAL_BRIGHT, e * 0.34);
				banner.shine.alpha = lerp(banner.shine.alpha, 0, 0.25);

				if (Math.random() < 0.26) spawnCrystalDust(banner, 2);
				return;
			}

			if (t < 0.78) {
				const e = clamp01((t - 0.45) / 0.33);

				banner.root.alpha = 1;
				banner.root.position.set(
					banner.baseX + randomBetween(-3.2, 3.2),
					banner.baseY + randomBetween(-2.0, 2.0)
				);
				banner.motion.scale.set(banner.baseScale * lerp(1.026, 1.05, e));
				banner.motion.rotation = banner.baseRotation + randomBetween(-0.015, 0.015);

				if (crystals) {
					updateCrystalField(crystals, 1, banner.elapsed, lerp(1.55, 1.78, e));

					for (const entry of crystals._entries ?? []) {
						if (entry.sprite.alpha <= 0.01) continue;

						const pulse = 1 + Math.sin(banner.elapsed * 0.018 + entry.baseX * 0.03) * 0.08;
						entry.sprite.scale.x *= pulse;
						entry.sprite.scale.y *= pulse;
						entry.sprite.rotation += entry.rotSpeed * 3.2;
					}
				}

				if (overlay) overlay.alpha = lerp(0.76, 0.92, e);
				if (veins) veins.alpha = lerp(0.54, 0.68, e);
				if (flash) flash.alpha = Math.sin(e * Math.PI * 2) * 0.10;

				banner.motion.tint = mixHex(CRYSTAL_MID, CRYSTAL_BRIGHT, e * 0.30);

				if (Math.random() < 0.34) spawnCrystalDust(banner, 3);
				return;
			}

			const e = clamp01((t - 0.78) / 0.22);

			banner.root.alpha = 1;
			banner.root.position.set(
				banner.baseX + lerp(0, 10, e),
				banner.baseY + lerp(0, -6, e)
			);
			banner.motion.scale.set(banner.baseScale * lerp(1.05, 1.00, e));
			banner.motion.rotation = banner.baseRotation + lerp(0, 0.02, e);

			banner.body.alpha = lerp(1, 0.03, e);
			banner.leftTail.alpha = lerp(1, 0.03, e);
			banner.rightTail.alpha = lerp(1, 0.03, e);
			banner.badge.alpha = lerp(1, 0.00, e);
			banner.text.alpha = lerp(1, 0.00, e);
			banner.innerGlow.alpha = lerp(0.16, 0, e);
			banner.topEdge.alpha = lerp(1, 0.00, e);
			banner.bottomEdge.alpha = lerp(1, 0.00, e);
			banner.shine.alpha = 0;

			if (overlay) overlay.alpha = lerp(0.92, 0.00, e);
			if (veins) veins.alpha = lerp(0.68, 0.00, e);
			if (flash) flash.alpha = 0;

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;

					const stayScale = lerp(
						entry.targetScale * 1.78 * entry.growthBias,
						entry.targetScale * 1.62 * entry.growthBias,
						e
					);

					entry.sprite.scale.set(Math.max(0.01, stayScale));
					entry.sprite.alpha = Math.max(0.82, entry.targetAlpha * 0.96);

					const dirX = Math.sign(entry.baseX || 1);
					const dirY = Math.sign(entry.baseY || 1);

					entry.sprite.x += dirX * 0.18;
					entry.sprite.y += dirY * 0.08;
					entry.sprite.rotation += entry.rotSpeed * 2.2;
				}
			}

			if (Math.random() < 0.44) spawnCrystalDust(banner, 3);
		},

		onDestroy(banner) {
			banner.motion.tint = 0xffffff;
		}
	});
})();