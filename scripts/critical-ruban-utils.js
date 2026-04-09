

export class CriticalRubanUtils {
  static MODULE_ID = "critical-ruban";
  static DEFAULT_EFFECT_ID = "current";
  static BANNER_SLOTS = [
    { x: 0.50, y: 0.50, scale: 1.00, rotation: 0 },
    { x: 0.42, y: 0.33, scale: 0.95, rotation: -0.08 },
    { x: 0.58, y: 0.67, scale: 0.95, rotation: 0.08 },
    { x: 0.61, y: 0.24, scale: 0.92, rotation: 0.10 },
    { x: 0.39, y: 0.76, scale: 0.92, rotation: -0.10 },
    { x: 0.67, y: 0.50, scale: 0.88, rotation: 0.12 }
  ];
  static COLORS = {
    gold: 0xe6c45e,
    goldBright: 0xffe8a8,
    red: 0xc53c34,
    redBright: 0xff9c74,
    ice: 0xaee4ff,
    iceBright: 0xebf9ff,
    ember: 0xffb066,
    shadow: 0x000000,
    white: 0xffffff
  };
  static bannerSlotTimers = new Map();

  static gRoundRect(g, x, y, w, h, r, fillColor = null, fillAlpha = 1, lineWidth = 0, lineColor = 0x000000, lineAlpha = 1) {
    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fillColor !== null && fillColor !== undefined) g.beginFill(fillColor, fillAlpha);
    g.drawRoundedRect(x, y, w, h, r);
    if (fillColor !== null && fillColor !== undefined) g.endFill();
    return g;
  }

  static gCircle(g, x, y, radius, fillColor = null, fillAlpha = 1, lineWidth = 0, lineColor = 0x000000, lineAlpha = 1) {
    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fillColor !== null && fillColor !== undefined) g.beginFill(fillColor, fillAlpha);
    g.drawCircle(x, y, radius);
    if (fillColor !== null && fillColor !== undefined) g.endFill();
    return g;
  }

  static gEllipse(g, x, y, rx, ry, fillColor = null, fillAlpha = 1, lineWidth = 0, lineColor = 0x000000, lineAlpha = 1) {
    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fillColor !== null && fillColor !== undefined) g.beginFill(fillColor, fillAlpha);
    g.drawEllipse(x, y, rx, ry);
    if (fillColor !== null && fillColor !== undefined) g.endFill();
    return g;
  }

  static gPoly(g, points, fillColor = null, fillAlpha = 1, lineWidth = 0, lineColor = 0x000000, lineAlpha = 1) {
    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fillColor !== null && fillColor !== undefined) g.beginFill(fillColor, fillAlpha);
    g.drawPolygon(points);
    if (fillColor !== null && fillColor !== undefined) g.endFill();
    return g;
  }

  static gLineStyle(g, width, color, alpha = 1) {
    g.lineStyle(width, color, alpha);
    return g;
  }

  static gStar(g, x, y, points, outerRadius, innerRadius, fillColor = null, fillAlpha = 1, lineWidth = 0, lineColor = 0x000000, lineAlpha = 1) {
    const pts = [];
    const step = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = -Math.PI / 2 + i * step;
      pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    return this.gPoly(g, pts, fillColor, fillAlpha, lineWidth, lineColor, lineAlpha);
  }

  static playRubanSound(type) {
    if (!game.settings.get(this.MODULE_ID, "enableSound")) return;

    const customPath = game.settings.get(this.MODULE_ID, type === "fumble" ? "fumbleSoundPath" : "criticalSoundPath");
    const soundPath = customPath || `modules/${this.MODULE_ID}/assets/${type === "fumble" ? "fumble" : "critical"}.ogg`;
    const volume = (game.settings.get(this.MODULE_ID, "soundVolume") ?? 80) / 100;

    try {
      foundry.audio.AudioHelper.play({ src: soundPath, volume, autoplay: true, loop: false }, false);
    } catch (err) {
      console.warn(`${this.MODULE_ID} | Unable to play sound:`, err);
    }
  }

  static acquireBannerSlot() {
    const slots = this.bannerSlotTimers;
    const now = Date.now();

    for (let i = 0; i < this.BANNER_SLOTS.length; i++) {
      const until = slots.get(i) ?? 0;
      if (until <= now) {
        slots.set(i, now + 5000);
        return i;
      }
    }

    let chosen = 0;
    let oldest = Number.POSITIVE_INFINITY;

    for (let i = 0; i < BANNER_SLOTS.length; i++) {
      const until = slots.get(i) ?? 0;
      if (until < oldest) {
        oldest = until;
        chosen = i;
      }
    }

    slots.set(chosen, now + 5000);
    return chosen;
  }

  static releaseBannerSlot(index) {
    this.bannerSlotTimers.delete(index);
  }

  static normalizeHexColor(value) {
    if (!value) return null;
    if (typeof value === "number") return `#${value.toString(16).padStart(6, "0")}`;

    const str = String(value).trim();

    if (/^#[0-9a-f]{6}$/i.test(str)) return str.toLowerCase();

    if (/^#[0-9a-f]{3}$/i.test(str)) {
      const [, r, g, b] = str;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    const m = str.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (m) {
      const r = Number(m[1]).toString(16).padStart(2, "0");
      const g = Number(m[2]).toString(16).padStart(2, "0");
      const b = Number(m[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }

    return null;
  }

  static cssToHex(value) {
    const normalized = this.normalizeHexColor(value) ?? "#8b0000";
    return Number.parseInt(normalized.slice(1), 16);
  }

  static darkenHex(hex, amount) {
    return this.mixHex(hex, 0x000000, amount);
  }

  static lightenHex(hex, amount) {
    return this.mixHex(hex, 0xffffff, amount);
  }

  static mixHex(a, b, amount) {
    amount = this.clamp01(amount);

    const ar = (a >> 16) & 0xff;
    const ag = (a >> 8) & 0xff;
    const ab = a & 0xff;

    const br = (b >> 16) & 0xff;
    const bg = (b >> 8) & 0xff;
    const bb = b & 0xff;

    const r = Math.round(this.lerp(ar, br, amount));
    const g = Math.round(this.lerp(ag, bg, amount));
    const bl = Math.round(this.lerp(ab, bb, amount));

    return (r << 16) | (g << 8) | bl;
  }

  static clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  static randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  static easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInCubic(t) {
    return t * t * t;
  }

  static easeInQuad(t) {
    return t * t;
  }

  static easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  static easeOutBackSoft(t) {
    const c1 = 1.12;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
