const MODULE_ID = "critical-ruban";

const BANNER_SLOTS = [
  { top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(1) rotate(0deg)" },

  { top: "33%", left: "42%", transform: "translate(-50%, -50%) scale(0.95) rotate(-7deg)" },
  { top: "67%", left: "58%", transform: "translate(-50%, -50%) scale(0.95) rotate(7deg)" },

  { top: "24%", left: "61%", transform: "translate(-50%, -50%) scale(0.95) rotate(9deg)" },
  { top: "76%", left: "39%", transform: "translate(-50%, -50%) scale(0.95) rotate(-9deg)" },

  { top: "50%", left: "67%", transform: "translate(-50%, -50%) scale(0.88) rotate(11deg)" }
];

const EXIT_EFFECTS = {
  CURRENT: "current",
  ICE_SHATTER: "iceShatter",
  FIRE_BURN: "fireBurn"
};

const EXIT_TIMINGS = {
  current: {
    startDelay: 3000,
    totalDuration: 1300
  },
  iceShatter: {
    startDelay: 3000,
    freezeDuration: 460,
    crackDuration: 220,
    shatterDuration: 820,
    totalDuration: 1650
  },
  fireBurn: {
    startDelay: 3000,
    igniteDuration: 260,
    burnDuration: 820,
    emberDuration: 520,
    totalDuration: 1750
  }
};

const ICE_SHARD_POLYGONS = [
  "polygon(50% 0%, 100% 20%, 82% 100%, 18% 88%, 0% 28%)",
  "polygon(20% 0%, 100% 14%, 88% 76%, 44% 100%, 0% 54%)",
  "polygon(0% 16%, 62% 0%, 100% 42%, 82% 100%, 24% 86%)",
  "polygon(34% 0%, 100% 26%, 70% 100%, 0% 74%, 10% 18%)",
  "polygon(8% 0%, 74% 0%, 100% 58%, 58% 100%, 0% 72%)",
  "polygon(24% 0%, 100% 10%, 86% 58%, 54% 100%, 0% 80%, 8% 24%)",
  "polygon(0% 30%, 42% 0%, 100% 18%, 92% 84%, 28% 100%, 8% 62%)",
  "polygon(14% 0%, 82% 8%, 100% 54%, 72% 100%, 0% 88%, 4% 30%)"
];

Hooks.once("ready", () => {
  registerSettings();

  globalThis.__critBannerShown ??= new Set();
  globalThis.__critBannerPending ??= new Map();
  globalThis.__critBannerSlots ??= new Map();

  globalThis.CriticalRuban = {
    show: showBannerManually,
    showCritical: (name, color) => showBannerManually({ type: "critical", name, color }),
    showFumble: (name, color) => showBannerManually({ type: "fumble", name, color })
  };

  Hooks.on("renderChatMessageHTML", onRenderChatMessageHTML);

  if (game.modules.get("dice-so-nice")?.active) {
    Hooks.on("diceSoNiceRollComplete", onDiceSoNiceRollComplete);
  }
});

function registerSettings() {
  game.settings.register(MODULE_ID, "enableBanner", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.enableBanner.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.enableBanner.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "enableSound", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.enableSound.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.enableSound.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "soundVolume", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.soundVolume.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.soundVolume.hint"),
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 100,
      step: 5
    },
    default: 80
  });

  game.settings.register(MODULE_ID, "criticalSoundPath", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.criticalSoundPath.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.criticalSoundPath.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "",
    filePicker: "audio"
  });

  game.settings.register(MODULE_ID, "fumbleSoundPath", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.fumbleSoundPath.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.fumbleSoundPath.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "",
    filePicker: "audio"
  });

  game.settings.register(MODULE_ID, "criticalExitEffect", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.criticalExitEffect.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.criticalExitEffect.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      [EXIT_EFFECTS.CURRENT]: game.i18n.localize("CRITICAL_RUBAN.settings.exitEffectChoices.current")
    },
    default: EXIT_EFFECTS.CURRENT
  });

  game.settings.register(MODULE_ID, "fumbleExitEffect", {
    name: game.i18n.localize("CRITICAL_RUBAN.settings.fumbleExitEffect.name"),
    hint: game.i18n.localize("CRITICAL_RUBAN.settings.fumbleExitEffect.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      [EXIT_EFFECTS.CURRENT]: game.i18n.localize("CRITICAL_RUBAN.settings.exitEffectChoices.current"),
      [EXIT_EFFECTS.ICE_SHATTER]: game.i18n.localize("CRITICAL_RUBAN.settings.exitEffectChoices.iceShatter"),
      [EXIT_EFFECTS.FIRE_BURN]: game.i18n.localize("CRITICAL_RUBAN.settings.exitEffectChoices.fireBurn")
    },
    default: EXIT_EFFECTS.CURRENT
  });
}

function onRenderChatMessageHTML(message) {
  try {
    if (!game.settings.get(MODULE_ID, "enableBanner")) return;
    if (!message?.isRoll) return;
    if (!message?.visible) return;

    const roll = message.rolls?.[0];
    if (!roll) return;

    const d20Term = roll.terms?.find((t) => t?.faces === 20);
    if (!d20Term) return;

    const isCritical = roll.isCritical === true;
    const isFumble = roll.isFumble === true;

    if (!isCritical && !isFumble) return;
    if (globalThis.__critBannerShown.has(message.id)) return;

    const nom_pj = message.speaker?.alias || game.user?.name || "Inconnu";
    const user = message.author;
    const couleur =
      user?.color?.css ??
      user?.color?.toString?.() ??
      user?.color ??
      "#8b0000";

    const payload = {
      messageId: message.id,
      rollId: roll.id,
      nom_pj,
      couleur,
      type: isCritical ? "critical" : "fumble"
    };

    if (game.modules.get("dice-so-nice")?.active) {
      if (message.id) globalThis.__critBannerPending.set(message.id, payload);
      if (roll.id) globalThis.__critBannerPending.set(roll.id, payload);

      setTimeout(() => {
        const pending =
          globalThis.__critBannerPending.get(message.id) ||
          globalThis.__critBannerPending.get(roll.id);

        if (!pending) return;
        consumePendingRuban(pending);
      }, 8000);

      return;
    }

    requestAnimationFrame(() => showRubanOnce(payload));
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur dans renderChatMessageHTML :`, err);
  }
}

function onDiceSoNiceRollComplete(id) {
  try {
    const payload = globalThis.__critBannerPending.get(id);
    if (!payload) return;

    consumePendingRuban(payload);
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur dans diceSoNiceRollComplete :`, err);
  }
}

function consumePendingRuban(payload) {
  if (!payload) return;

  if (payload.messageId) globalThis.__critBannerPending.delete(payload.messageId);
  if (payload.rollId) globalThis.__critBannerPending.delete(payload.rollId);

  requestAnimationFrame(() => {
    showRubanOnce(payload);
  });
}

function showRubanOnce({ messageId, nom_pj, couleur, type }) {
  if (messageId && globalThis.__critBannerShown.has(messageId)) return;

  if (messageId) {
    globalThis.__critBannerShown.add(messageId);
    setTimeout(() => globalThis.__critBannerShown.delete(messageId), 10000);
  }

  showRollRuban(nom_pj, couleur, type);
}

function showBannerManually({
  type = "critical",
  name = game.user?.character?.name || game.user?.name || "Inconnu",
  color = game.user?.color?.css ?? game.user?.color?.toString?.() ?? game.user?.color ?? "#8b0000"
} = {}) {
  if (!game.settings.get(MODULE_ID, "enableBanner")) return;
  if (type !== "critical" && type !== "fumble") type = "critical";

  requestAnimationFrame(() => {
    showRollRuban(name, color, type);
  });
}

function showRollRuban(nom_pj, couleur, type = "critical") {
  const id = `critical-ruban-${foundry.utils.randomID()}`;
  const slotIndex = acquireBannerSlot();
  const slotStyle = getBannerSlotStyle(slotIndex);

  const isFumble = type === "fumble";
  const isCritical = type === "critical";
  const baseColor = normalizeHexColor(couleur) ?? "#8b0000";

  const mainColor = isFumble
    ? shiftColorTowardRed(baseColor, 0.42, 0.32)
    : baseColor;

  const dark = darkenColor(mainColor, 0.28);
  const darker = darkenColor(mainColor, 0.45);
  const light = lightenColor(mainColor, 0.18);

  const accent = isFumble ? "#c93b32" : "#e3c35a";
  const label = isFumble
    ? game.i18n.localize("CRITICAL_RUBAN.ruban.label.criticalFailure")
    : game.i18n.localize("CRITICAL_RUBAN.ruban.label.criticalSuccess");

const mainExtraClass = [
  isFumble ? "broken" : "",
  isCritical ? "golden" : ""
].filter(Boolean).join(" ");

  const iconHTML = isFumble
    ? `<img src="modules/${MODULE_ID}/assets/fumble.svg" class="crit-d20" aria-hidden="true">`
    : `<img src="icons/svg/d20.svg" class="crit-d20" aria-hidden="true">`;

  const div = document.createElement("div");
  div.id = id;
  div.dataset.type = type;
  div.dataset.exitEffect = getExitEffect(type);
  div.dataset.slotIndex = String(slotIndex);

  div.innerHTML = `
    <div class="crit-ribbon-wrap crit-enter ${isFumble ? "is-fumble" : "is-critical"}">
      <div class="crit-tail crit-tail-left"></div>

      <div class="crit-main-wrap">
        <div class="crit-fold-under crit-fold-left"></div>
        <div class="crit-fold-under crit-fold-right"></div>

        <div class="crit-main ${mainExtraClass}" style="
          background: linear-gradient(180deg, ${light} 0%, ${mainColor} 48%, ${dark} 100%);
          border-color: ${accent};
        ">
          <div class="crit-shine"></div>
          <div class="crit-frost-overlay" aria-hidden="true"></div>
          <div class="crit-crack-overlay" aria-hidden="true"></div>
          <div class="crit-fire-overlay" aria-hidden="true"></div>
          <div class="crit-burn-overlay" aria-hidden="true"></div>
          <div class="crit-heat-overlay" aria-hidden="true"></div>
          ${iconHTML}
          <span class="crit-text">${label} : ${nom_pj}</span>
        </div>
      </div>

      <div class="crit-tail crit-tail-right"></div>
    </div>
  `;

  Object.assign(div.style, {
    position: "fixed",
    top: slotStyle.top,
    left: slotStyle.left,
    transform: slotStyle.transform,
    zIndex: String(10000 - slotIndex),
    pointerEvents: "none"
  });

  const tails = div.querySelectorAll(".crit-tail");
  tails.forEach((tail) => {
    Object.assign(tail.style, {
      background: `linear-gradient(180deg, ${dark} 0%, ${darker} 100%)`,
      borderTopColor: accent,
      borderBottomColor: accent
    });
  });

  const folds = div.querySelectorAll(".crit-fold-under");
  folds.forEach((fold) => {
    fold.style.background = darker;
  });

  document.body.appendChild(div);
  playRubanSound(type);

  const wrap = div.querySelector(".crit-ribbon-wrap");
  scheduleRubanExit(div, wrap, type);
}

function getExitEffect(type) {
  return game.settings.get(
    MODULE_ID,
    type === "fumble" ? "fumbleExitEffect" : "criticalExitEffect"
  );
}

function scheduleRubanExit(div, wrap, type) {
  const effect = getExitEffect(type);
  const timings = EXIT_TIMINGS[effect] ?? EXIT_TIMINGS.current;
  const slotIndex = Number(div.dataset.slotIndex);

  setTimeout(() => {
    playExitEffect(div, wrap, type, effect);
  }, timings.startDelay);

  setTimeout(() => {
    releaseBannerSlot(slotIndex);
    div.remove();
  }, timings.startDelay + timings.totalDuration + 180);
}

function playExitEffect(div, wrap, type, effect) {
  if (effect === EXIT_EFFECTS.ICE_SHATTER && type === "fumble") {
    playIceShatterExit(div, wrap);
    return;
  }

  if (effect === EXIT_EFFECTS.FIRE_BURN) {
    playFireBurnExit(div, wrap);
    return;
  }

  wrap.classList.remove("crit-enter");
  wrap.classList.add("crit-exit");
}

function playIceShatterExit(div, wrap) {
  const timings = EXIT_TIMINGS.iceShatter;
  const main = wrap.querySelector(".crit-main");
  const mainWrap = wrap.querySelector(".crit-main-wrap");
  const tails = [...wrap.querySelectorAll(".crit-tail")];
  const folds = [...wrap.querySelectorAll(".crit-fold-under")];

  wrap.classList.remove("crit-enter");
  wrap.classList.add("crit-exit-ice");

  main.classList.add("ice-freezing");
  tails.forEach((el) => el.classList.add("ice-freezing"));
  folds.forEach((el) => el.classList.add("ice-freezing"));

  setTimeout(() => {
    wrap.classList.add("ice-cracking");
  }, Math.max(120, timings.freezeDuration - 70));

  setTimeout(() => {
    shatterMainBanner(div, mainWrap, main, {
      shatterDuration: timings.shatterDuration
    });

    tails.forEach((el) => el.classList.add("ice-fade-out"));
    folds.forEach((el) => el.classList.add("ice-fade-out"));
  }, timings.freezeDuration + timings.crackDuration);
}

function playFireBurnExit(div, wrap) {
  const timings = EXIT_TIMINGS.fireBurn;

  const main = wrap.querySelector(".crit-main");
  const tails = [...wrap.querySelectorAll(".crit-tail")];
  const folds = [...wrap.querySelectorAll(".crit-fold-under")];

  wrap.classList.remove("crit-enter");
  wrap.classList.add("crit-exit-fire");

  main.classList.add("fire-igniting");
  tails.forEach(el => el.classList.add("fire-igniting"));
  folds.forEach(el => el.classList.add("fire-igniting"));

  setTimeout(() => {
    wrap.classList.add("fire-burning");

    main.classList.add("fire-burning");
    tails.forEach(el => el.classList.add("fire-burning"));
    folds.forEach(el => el.classList.add("fire-burning"));

    createEmberParticles(div, 18, timings.emberDuration);
  }, timings.igniteDuration);

  setTimeout(() => {
    main.classList.add("fire-charring");
    tails.forEach(el => el.classList.add("fire-charring"));
    folds.forEach(el => el.classList.add("fire-charring"));
  }, timings.igniteDuration + 180);

  setTimeout(() => {
    main.classList.add("fire-hidden");
    tails.forEach(el => el.classList.add("fire-hidden"));
    folds.forEach(el => el.classList.add("fire-hidden"));
  }, timings.igniteDuration + timings.burnDuration);
}

function shatterMainBanner(container, mainWrap, main, { shatterDuration = 700 } = {}) {
  if (!container?.isConnected || !mainWrap || !main) return;

  const existingLayer = container.querySelector(".crit-shatter-layer");
  if (existingLayer) existingLayer.remove();

  const layer = document.createElement("div");
  layer.className = "crit-shatter-layer";

  const columns = 4;
  const rows = 3;
  const pieceWidth = main.offsetWidth / columns;
  const pieceHeight = main.offsetHeight / rows;

  const centerX = main.offsetWidth / 2;
  const centerY = main.offsetHeight / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const piece = document.createElement("div");
      piece.className = "crit-shatter-piece";

      const x = col * pieceWidth;
      const y = row * pieceHeight;

      const shardCenterX = x + pieceWidth / 2;
      const shardCenterY = y + pieceHeight / 2;

      const dx = shardCenterX - centerX;
      const dy = shardCenterY - centerY;
      const distanceFactor = Math.max(0.65, Math.min(1.35, Math.hypot(dx, dy) / 120 + 0.7));

      const driftX = (dx * 0.26) + randomBetween(-34, 34) * distanceFactor;
      const driftY = 58 + (Math.abs(dy) * 0.3) + randomBetween(18, 62) * distanceFactor;
      const rotate = randomBetween(-28, 28);
      const delay = randomBetween(0, 90);

      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.width = `${pieceWidth}px`;
      piece.style.height = `${pieceHeight}px`;
      piece.style.backgroundImage = getComputedStyle(main).backgroundImage;
      piece.style.backgroundSize = `${main.offsetWidth}px ${main.offsetHeight}px`;
      piece.style.backgroundPosition = `${-x}px ${-y}px`;
      piece.style.borderColor = getComputedStyle(main).borderColor;
      piece.style.clipPath = pickRandom(ICE_SHARD_POLYGONS);
      piece.style.setProperty("--drift-x", `${driftX}px`);
      piece.style.setProperty("--drift-y", `${driftY}px`);
      piece.style.setProperty("--rotate", `${rotate}deg`);
      piece.style.setProperty("--shard-blur", `${randomBetween(0, 1.2).toFixed(2)}px`);
      piece.style.animationDuration = `${shatterDuration}ms`;
      piece.style.animationDelay = `${delay}ms`;

      layer.appendChild(piece);
    }
  }

  createIceParticles(layer, 18, main.offsetWidth, main.offsetHeight, shatterDuration);

  main.classList.add("ice-hidden");
  mainWrap.appendChild(layer);
}

function createIceParticles(container, count, width, height, duration) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "crit-ice-particle";
    p.style.left = `${randomBetween(width * 0.08, width * 0.92)}px`;
    p.style.top = `${randomBetween(height * 0.08, height * 0.82)}px`;
    p.style.setProperty("--drift-x", `${randomBetween(-74, 74)}px`);
    p.style.setProperty("--drift-y", `${randomBetween(45, 140)}px`);
    p.style.setProperty("--rotate", `${randomBetween(-65, 65)}deg`);
    p.style.setProperty("--particle-scale", `${randomBetween(0.7, 1.25).toFixed(2)}`);
    p.style.animationDuration = `${Math.max(500, duration - 60)}ms`;
    container.appendChild(p);
  }
}

function playRubanSound(type) {
  if (!game.settings.get(MODULE_ID, "enableBanner")) return;
  if (!game.settings.get(MODULE_ID, "enableSound")) return;

  const defaultSrc = `modules/${MODULE_ID}/assets/${type === "fumble" ? "fumble.ogg" : "critical.ogg"}`;
  const customSetting = type === "fumble" ? "fumbleSoundPath" : "criticalSoundPath";
  const customSrc = game.settings.get(MODULE_ID, customSetting)?.trim();
  const src = customSrc || defaultSrc;

  const volumePercent = game.settings.get(MODULE_ID, "soundVolume");
  const volume = volumePercent / 100;

  try {
    foundry.audio.AudioHelper.play(
      { src, volume, autoplay: true, loop: false },
      false
    );
  } catch (err) {
    console.warn(`${MODULE_ID} | Impossible de jouer le son ${src}`, err);
  }
}

function darkenColor(hex, amount = 0.25) {
  if (!hex || typeof hex !== "string") return "#5a0000";

  let color = hex.replace("#", "").trim();
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  if (color.length !== 6) return "#5a0000";

  const num = parseInt(color, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function lightenColor(hex, amount = 0.2) {
  if (!hex || typeof hex !== "string") return "#aa3333";

  let color = hex.replace("#", "").trim();
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  if (color.length !== 6) return "#aa3333";

  const num = parseInt(color, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function normalizeHexColor(color) {
  if (!color || typeof color !== "string") return null;

  let hex = color.trim().replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toLowerCase()}`;
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;

  const value = normalized.slice(1);
  const num = parseInt(value, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function shiftColorTowardRed(hex, redPull = 0.35, darken = 0.25) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#7a1f1f";

  let { r, g, b } = rgb;

  r = r + (210 - r) * redPull;
  g = g * (1 - redPull * 0.55);
  b = b * (1 - redPull * 0.75);

  r = r * (1 - darken);
  g = g * (1 - darken);
  b = b * (1 - darken);

  return rgbToHex(r, g, b);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function acquireBannerSlot() {
  for (let i = 0; i < BANNER_SLOTS.length; i++) {
    if (!globalThis.__critBannerSlots.has(i)) {
      globalThis.__critBannerSlots.set(i, true);
      return i;
    }
  }

  // Si tous les slots sont occupés, on réutilise le dernier
  return BANNER_SLOTS.length - 1;
}

function releaseBannerSlot(slotIndex) {
  if (typeof slotIndex !== "number") return;
  globalThis.__critBannerSlots.delete(slotIndex);
}

function getBannerSlotStyle(slotIndex) {
  return BANNER_SLOTS[slotIndex] ?? BANNER_SLOTS[0];
}

function createEmberParticles(container, count, duration) {
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "crit-ember-particle";

    p.style.left = `${randomBetween(width * 0.18, width * 0.82)}px`;
    p.style.top = `${randomBetween(height * 0.45, height * 0.92)}px`;
    p.style.setProperty("--drift-x", `${randomBetween(-55, 55)}px`);
    p.style.setProperty("--drift-y", `${randomBetween(35, 120)}px`);
    p.style.setProperty("--ember-scale", `${randomBetween(0.7, 1.35).toFixed(2)}`);
    p.style.animationDuration = `${duration + randomBetween(-80, 120)}ms`;

    container.appendChild(p);
  }
}