(() => {
	const EFFECT_ID = "voidCrystalBloom";

	const BLOOM_DARK = 0x1c1030;
	const BLOOM_DEEP = 0x35205f;
	const BLOOM_MID = 0x7a49ff;
	const BLOOM_BRIGHT = 0xb88cff;
	const BLOOM_EDGE = 0xf3e9ff;
	const BLOOM_WHITE = 0xffffff;
	const BLOOM_CORE = 0xe4d2ff;

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

	function drawBloomOverlay(banner) {
		const c = new PIXI.Container();

		const auraOuter = new PIXI.Graphics();
		drawBodyShape(auraOuter, banner, {
			inset: -12,
			fill: BLOOM_BRIGHT,
			fillAlpha: 0.10
		});

		const auraInner = new PIXI.Graphics();
		drawBodyShape(auraInner, banner, {
			inset: -4,
			fill: BLOOM_WHITE,
			fillAlpha: 0.05
		});

		const bodyDeep = new PIXI.Graphics();
		drawBodyShape(bodyDeep, banner, {
			inset: 2,
			fill: BLOOM_DARK,
			fillAlpha: 0.16
		});

		const bodyMid = new PIXI.Graphics();
		drawBodyShape(bodyMid, banner, {
			inset: 3,
			fill: BLOOM_DEEP,
			fillAlpha: 0.16
		});

		const bodyGlow = new PIXI.Graphics();
		drawBodyShape(bodyGlow, banner, {
			inset: 10,
			fill: BLOOM_BRIGHT,
			fillAlpha: 0.12
		});

		const bodyCore = new PIXI.Graphics();
		drawBodyShape(bodyCore, banner, {
			inset: 16,
			fill: BLOOM_WHITE,
			fillAlpha: 0.06
		});

		const makeTail = (isLeft) => {
			const tail = new PIXI.Container();

			const glow = new PIXI.Graphics();
			drawTailShape(glow, banner, isLeft, {
				inset: -8,
				fill: BLOOM_BRIGHT,
				fillAlpha: 0.08
			});

			const mid = new PIXI.Graphics();
			drawTailShape(mid, banner, isLeft, {
				inset: 3,
				fill: BLOOM_DEEP,
				fillAlpha: 0.14
			});

			const shine = new PIXI.Graphics();
			drawTailShape(shine, banner, isLeft, {
				inset: 8,
				fill: BLOOM_WHITE,
				fillAlpha: 0.07
			});

			tail.addChild(glow, mid, shine);
			return tail;
		};

		const left = makeTail(true);
		const right = makeTail(false);

		left.x = -banner.mainWidth / 2 - 14;
		right.x = banner.mainWidth / 2 + 14;

		c.addChild(auraOuter, auraInner, bodyDeep, bodyMid, bodyGlow, bodyCore, left, right);
		return c;
	}

	function drawRefractedLines(banner) {
		const g = new PIXI.Graphics();

		gLineStyle(g, 2, BLOOM_EDGE, 0.28);

		const x0 = -banner.mainWidth / 2 + 18;
		const x1 = banner.mainWidth / 2 - 18;
		const y0 = -banner.height / 2 + 14;
		const y1 = banner.height / 2 - 14;

		g.moveTo(x0 + 12, -8);
		g.lineTo(x0 + 56, -18);
		g.lineTo(x0 + 104, -6);
		g.lineTo(x0 + 152, 10);

		g.moveTo(-28, y0 + 4);
		g.lineTo(0, -8);
		g.lineTo(24, 4);
		g.lineTo(40, y1 - 10);

		g.moveTo(52, -4);
		g.lineTo(96, -18);
		g.lineTo(138, -10);
		g.lineTo(182, 8);

		g.moveTo(x1 - 34, 16);
		g.lineTo(x1 - 78, 4);
		g.lineTo(x1 - 126, 16);

		return g;
	}

	function drawSweepBeam(banner) {
		const c = new PIXI.Container();

		const beam1 = new PIXI.Graphics();
		gRoundRect(
			beam1,
			-90,
			-banner.height / 2 - 8,
			78,
			banner.height + 16,
			18,
			BLOOM_WHITE,
			0.20
		);
		beam1.rotation = -0.18;

		const beam2 = new PIXI.Graphics();
		gRoundRect(
			beam2,
			-54,
			-banner.height / 2 - 10,
			52,
			banner.height + 20,
			14,
			BLOOM_BRIGHT,
			0.18
		);
		beam2.rotation = -0.18;

		const core = new PIXI.Graphics();
		gRoundRect(
			core,
			-16,
			-banner.height / 2 - 6,
			20,
			banner.height + 12,
			10,
			BLOOM_WHITE,
			0.24
		);
		core.rotation = -0.18;

		c.addChild(beam1, beam2, core);
		return c;
	}

	function drawCentralFlash(banner) {
		const c = new PIXI.Container();

		const star = new PIXI.Graphics();
		gStar(star, 0, 0, 6, 36, 12, BLOOM_WHITE, 0.24);

		const ring = new PIXI.Graphics();
		gCircle(ring, 0, 0, 28, null, 1, 2, BLOOM_EDGE, 0.36);

		const core = new PIXI.Graphics();
		gCircle(core, 0, 0, 14, BLOOM_CORE, 0.28);

		c.addChild(star, ring, core);
		return c;
	}

	function buildCrystalVariant(size, color, alpha) {
		const variants = [
			[
				0, -size * 1.45,
				size * 0.28, -size * 0.78,
				size * 0.58, -size * 0.20,
				size * 0.18, size * 1.08,
				-size * 0.18, size * 0.94,
				-size * 0.48, size * 0.18,
				-size * 0.22, -size * 0.84
			],
			[
				-size * 0.10, -size * 1.10,
				size * 0.30, -size * 0.92,
				size * 0.82, -size * 0.04,
				size * 0.42, size * 0.78,
				-size * 0.04, size * 1.14,
				-size * 0.52, size * 0.44,
				-size * 0.76, -size * 0.16,
				-size * 0.36, -size * 0.92
			],
			[
				0, -size * 1.62,
				size * 0.22, -size * 0.84,
				size * 0.52, -size * 0.18,
				size * 0.22, size * 1.00,
				-size * 0.14, size * 0.92,
				-size * 0.44, size * 0.12,
				-size * 0.18, -size * 0.90
			],
			[
				0, -size * 1.22,
				size * 0.46, -size * 0.64,
				size * 0.88, -size * 0.04,
				size * 0.30, size * 0.94,
				-size * 0.08, size * 1.12,
				-size * 0.56, size * 0.28,
				-size * 0.84, -size * 0.10,
				-size * 0.22, -size * 0.94
			]
		];

		const pts = variants[Math.floor(Math.random() * variants.length)];
		const g = new PIXI.Graphics();

		g.lineStyle(2, BLOOM_EDGE, 0.34);
		g.beginFill(color, alpha);
		g.drawPolygon(pts);
		g.endFill();

		const inner = [];
		for (let i = 0; i < pts.length; i += 2) {
			inner.push(pts[i] * 0.56, pts[i + 1] * 0.56);
		}

		g.beginFill(BLOOM_WHITE, 0.18);
		g.drawPolygon(inner);
		g.endFill();

		g.lineStyle(1.3, BLOOM_WHITE, 0.24);
		g.moveTo(pts[0], pts[1]);
		g.lineTo(pts[2], pts[3]);
		g.lineTo(pts[4], pts[5]);

		return g;
	}

	function createBloomCluster(x, y, size) {
		const c = new PIXI.Container();

		const main = buildCrystalVariant(
			size,
			Math.random() < 0.5 ? BLOOM_BRIGHT : BLOOM_MID,
			0.90
		);
		main.rotation = randomBetween(-0.22, 0.22);
		c.addChild(main);

		const childCount = Math.floor(randomBetween(1, 3));
		for (let i = 0; i < childCount; i++) {
			const shard = buildCrystalVariant(
				size * randomBetween(0.30, 0.62),
				Math.random() < 0.5 ? BLOOM_CORE : 0xc7a8ff,
				randomBetween(0.52, 0.78)
			);

			const angle = randomBetween(-2.4, 1.4);
			const dist = randomBetween(size * 0.18, size * 0.68);

			shard.x = Math.cos(angle) * dist;
			shard.y = Math.sin(angle) * dist;
			shard.rotation = randomBetween(-0.8, 0.8);

			c.addChild(shard);
		}

		const glow = new PIXI.Graphics();
		glow.beginFill(BLOOM_CORE, 0.16);
		glow.drawCircle(0, 0, size * 0.36);
		glow.endFill();
		c.addChild(glow);

		c.x = x;
		c.y = y;
		c.rotation = randomBetween(-0.28, 0.28);

		return c;
	}

	function createBloomField(banner) {
		const container = new PIXI.Container();
		const entries = [];

		const count = Math.floor(randomBetween(22, 30));

		for (let i = 0; i < count; i++) {
			const x = randomBetween(-banner.totalWidth * 0.40, banner.totalWidth * 0.40);
			const y = randomBetween(-banner.height * 0.30, banner.height * 0.30);

			const centerBias = 1 - Math.abs(x) / (banner.totalWidth * 0.40);
			const size = randomBetween(8, 17) + centerBias * randomBetween(1, 4);

			const cluster = createBloomCluster(x, y, size);
			cluster.alpha = 0;
			cluster.scale.set(0.10);

			container.addChild(cluster);
			entries.push({
				sprite: cluster,
				baseX: x,
				baseY: y,
				baseRotation: cluster.rotation,
				appearAt: randomBetween(0.00, 0.80),
				appearWindow: randomBetween(0.08, 0.16),
				targetScale: randomBetween(0.84, 1.10),
				targetAlpha: randomBetween(0.58, 0.90),
				driftX: randomBetween(1.0, 4.0),
				driftY: randomBetween(1.0, 3.6),
				floatLift: randomBetween(3.0, 10.0),
				rotSpeed: randomBetween(0.0010, 0.0032),
				growthBias: randomBetween(0.92, 1.12)
			});
		}

		entries.sort((a, b) => a.appearAt - b.appearAt);
		container._entries = entries;
		return container;
	}

	function updateBloomField(crystals, progress, elapsed, growthMultiplier = 1, liftMultiplier = 1) {
		const entries = crystals?._entries ?? [];
		const time = elapsed ?? 0;

		for (const entry of entries) {
			const localT = clamp01((progress - entry.appearAt) / entry.appearWindow);

			if (localT <= 0) {
				entry.sprite.alpha = 0;
				entry.sprite.scale.set(0.10);
				entry.sprite.x = entry.baseX;
				entry.sprite.y = entry.baseY;
				entry.sprite.rotation = entry.baseRotation;
				continue;
			}

			const e = easeOutBackSoft(localT);
			const baseScale = lerp(0.10, entry.targetScale * growthMultiplier * entry.growthBias, e);

			entry.sprite.alpha = entry.targetAlpha * clamp01(localT);
			entry.sprite.scale.set(baseScale);

			const pulse = 1 + Math.sin(time * 0.004 + entry.baseX * 0.018 + entry.baseY * 0.024) * 0.030;
			entry.sprite.scale.x *= pulse;
			entry.sprite.scale.y *= pulse;

			entry.sprite.rotation = entry.baseRotation + Math.sin(time * entry.rotSpeed) * 0.06;
			entry.sprite.x = entry.baseX + Math.sin(time * 0.0016 + entry.baseY * 0.02) * entry.driftX;
			entry.sprite.y = entry.baseY - Math.sin(time * 0.0018 + entry.baseX * 0.016) * entry.driftY - progress * entry.floatLift * liftMultiplier;
		}
	}

	function spawnBloomDust(banner, count = 10) {
		for (let i = 0; i < count; i++) {
			const colorRoll = Math.random();
			const color = colorRoll < 0.42 ? BLOOM_WHITE : (colorRoll < 0.74 ? BLOOM_BRIGHT : BLOOM_CORE);

			banner.spawnParticle({
				parent: "fx",
				x: randomBetween(-banner.totalWidth * 0.42, banner.totalWidth * 0.42),
				y: randomBetween(-banner.height * 0.34, banner.height * 0.24),
				radius: randomBetween(1.8, 4.8),
				color,
				alpha: randomBetween(0.52, 0.94),
				vx: randomBetween(-90, 90),
				vy: randomBetween(-90, 20),
				vr: randomBetween(-0.05, 0.05),
				life: randomBetween(360, 920),
				scaleFrom: randomBetween(0.8, 1.1),
				scaleTo: 0.10
			});
		}
	}

	globalThis.CriticalRubanEffects.registerRubanEffect({
		id: EFFECT_ID,
		types: ["critical"],
		startDelay: 3000,
		totalDuration: 1250,

		setup(banner) {
			banner.addEffectLayer("bloomOverlay", drawBloomOverlay(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("refractedLines", drawRefractedLines(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("sweepBeam", drawSweepBeam(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("centralFlash", drawCentralFlash(banner), {
				parent: "bodyGroup",
				alpha: 0
			});

			banner.addEffectLayer("bloomField", createBloomField(banner), {
				parent: "fx",
				alpha: 1
			});
		},

		onHold(banner, t) {
			const crystals = banner.getEffectLayer("bloomField");
			const overlay = banner.getEffectLayer("bloomOverlay");
			const lines = banner.getEffectLayer("refractedLines");
			const sweep = banner.getEffectLayer("sweepBeam");
			const flash = banner.getEffectLayer("centralFlash");

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;
				updateBloomField(crystals, t, banner.elapsed, 1, 0.55);

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha > 0.02) {
						entry.sprite.rotation += entry.rotSpeed * 0.16;
					}
				}
			}

			if (overlay) {
				overlay.alpha = lerp(0.08, 0.38, easeInOutQuad(t));
			}

			if (lines) {
				lines.alpha = 0.08 + easeInOutQuad(t) * 0.18 + Math.sin((banner.elapsed / 1000) * 3.8) * 0.03;
			}

			if (sweep) {
				const pulse = ((banner.elapsed / 1000) * 0.85) % 1.0;
				sweep.alpha = 0.04 + Math.sin(clamp01(pulse) * Math.PI) * 0.12;
				sweep.x = lerp(-banner.mainWidth * 0.55, banner.mainWidth * 0.55, clamp01(pulse));
			}

			if (flash) {
				flash.alpha = 0.02 + Math.sin((banner.elapsed / 1000) * 4.2) * 0.02;
				flash.scale.set(1 + Math.sin((banner.elapsed / 1000) * 3.6) * 0.04);
			}

			banner.motion.tint = mixHex(0xffffff, BLOOM_BRIGHT, 0.12 + t * 0.12);
			banner.innerGlow.alpha = 0.54 + Math.sin((banner.elapsed / 1000) * 4.6) * 0.06;

			if (Math.random() < 0.26) {
				spawnBloomDust(banner, 1);
			}
		},

		onPrepareExit(banner) {
			banner.resetVisualState();

			const crystals = banner.getEffectLayer("bloomField");
			const overlay = banner.getEffectLayer("bloomOverlay");
			const lines = banner.getEffectLayer("refractedLines");
			const sweep = banner.getEffectLayer("sweepBeam");
			const flash = banner.getEffectLayer("centralFlash");

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;
				updateBloomField(crystals, 1, banner.elapsed, 1, 0.60);
			}

			if (overlay) overlay.alpha = 0.38;
			if (lines) lines.alpha = 0.22;
			if (sweep) {
				sweep.alpha = 0.08;
				sweep.x = 0;
			}
			if (flash) {
				flash.alpha = 0.04;
				flash.scale.set(1);
			}

			spawnBloomDust(banner, 16);
		},

		onExit(banner, t) {
			const crystals = banner.getEffectLayer("bloomField");
			const overlay = banner.getEffectLayer("bloomOverlay");
			const lines = banner.getEffectLayer("refractedLines");
			const sweep = banner.getEffectLayer("sweepBeam");
			const flash = banner.getEffectLayer("centralFlash");

			if (crystals) {
				crystals.visible = true;
				crystals.alpha = 1;
			}

			if (t < 0.38) {
				const e = easeOutCubic(t / 0.38);

				banner.root.alpha = 1;
				banner.root.position.set(banner.baseX, banner.baseY);
				banner.motion.scale.set(banner.baseScale * lerp(1, 1.022, e));
				banner.motion.rotation = banner.baseRotation;

				if (crystals) {
					updateBloomField(crystals, lerp(0.70, 1.0, e), banner.elapsed, lerp(1.0, 1.34, e), lerp(0.60, 0.95, e));

					for (const entry of crystals._entries ?? []) {
						if (entry.sprite.alpha <= 0.01) continue;
						entry.sprite.rotation += entry.rotSpeed * 0.9;
					}
				}

				if (overlay) overlay.alpha = lerp(0.38, 0.56, e);
				if (lines) lines.alpha = lerp(0.22, 0.46, e);

				if (sweep) {
					sweep.alpha = lerp(0.10, 0.42, e);
					sweep.x = lerp(-banner.mainWidth * 0.65, banner.mainWidth * 0.30, e);
				}

				if (flash) {
					flash.alpha = lerp(0.04, 0.16, e);
					flash.scale.set(lerp(1, 1.18, e));
				}

				banner.innerGlow.alpha = lerp(0.52, 0.74, e);
				banner.motion.tint = mixHex(0xffffff, BLOOM_BRIGHT, e * 0.28);
				banner.shine.alpha = lerp(banner.shine.alpha, 0.18, 0.20);

				if (Math.random() < 0.24) spawnBloomDust(banner, 2);
				return;
			}

			if (t < 0.68) {
				const e = clamp01((t - 0.38) / 0.30);

				banner.root.alpha = 1;
				banner.root.position.set(banner.baseX, banner.baseY + Math.sin(banner.elapsed * 0.006) * 0.8);
				banner.motion.scale.set(banner.baseScale * lerp(1.022, 1.05, e));
				banner.motion.rotation = banner.baseRotation + Math.sin(banner.elapsed * 0.0032) * 0.006;

				if (crystals) {
					updateBloomField(crystals, 1, banner.elapsed, lerp(1.34, 1.56, e), lerp(0.95, 1.15, e));

					for (const entry of crystals._entries ?? []) {
						if (entry.sprite.alpha <= 0.01) continue;

						const pulse = 1 + Math.sin(banner.elapsed * 0.016 + entry.baseX * 0.024) * 0.06;
						entry.sprite.scale.x *= pulse;
						entry.sprite.scale.y *= pulse;
						entry.sprite.rotation += entry.rotSpeed * 1.2;
					}
				}

				if (overlay) overlay.alpha = lerp(0.56, 0.70, e);
				if (lines) lines.alpha = lerp(0.46, 0.58, e);

				if (sweep) {
					sweep.alpha = lerp(0.42, 0.18, e);
					sweep.x = lerp(banner.mainWidth * 0.30, banner.mainWidth * 0.72, e);
				}

				if (flash) {
					flash.alpha = Math.sin(e * Math.PI) * 0.34;
					flash.scale.set(lerp(1.18, 1.55, e));
				}

				banner.innerGlow.alpha = lerp(0.74, 0.92, e);
				banner.motion.tint = mixHex(BLOOM_BRIGHT, BLOOM_WHITE, e * 0.22);
				banner.shine.alpha = lerp(0.18, 0.26, e);

				if (Math.random() < 0.32) spawnBloomDust(banner, 3);
				return;
			}

			const e = clamp01((t - 0.68) / 0.32);

			banner.root.alpha = 1 - easeInQuad(e);
			banner.root.position.set(
				banner.baseX + lerp(0, 22, e),
				banner.baseY + lerp(0, -16, e)
			);
			banner.motion.scale.set(banner.baseScale * lerp(1.05, 1.10, e));
			banner.motion.rotation = banner.baseRotation + lerp(0, 0.014, e);

			banner.innerGlow.alpha = lerp(0.92, 0.0, e);
			banner.bodyGroup.alpha = lerp(1, 0.10, e);
			banner.shine.alpha = lerp(0.26, 0.0, e);
			banner.motion.tint = mixHex(BLOOM_WHITE, BLOOM_CORE, e * 0.14);

			if (overlay) overlay.alpha = lerp(0.70, 0.04, e);
			if (lines) lines.alpha = lerp(0.58, 0.00, e);

			if (sweep) {
				sweep.alpha = lerp(0.18, 0.00, e);
				sweep.x = lerp(banner.mainWidth * 0.72, banner.mainWidth * 1.05, e);
			}

			if (flash) {
				flash.alpha = lerp(0.18, 0.00, e);
				flash.scale.set(lerp(1.55, 1.90, e));
			}

			if (crystals) {
				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;

					const riseScale = lerp(
						entry.targetScale * 1.56 * entry.growthBias,
						entry.targetScale * 0.86,
						e
					);

					entry.sprite.scale.set(Math.max(0.01, riseScale));
					entry.sprite.alpha = lerp(entry.targetAlpha, 0, e);
					entry.sprite.y -= 0.22 + entry.floatLift * 0.014;
					entry.sprite.rotation += entry.rotSpeed * 1.8;
				}
			}

			if (Math.random() < 0.44) spawnBloomDust(banner, 4);
		},

		onDestroy(banner) {
			banner.motion.tint = 0xffffff;
		}
	});
})();