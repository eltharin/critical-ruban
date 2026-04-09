import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";


/**
 * Effet d'explosion spectaculaire
 * Explosion avec onde de choc, débris et particules de feu
 */
export class MyCustomEffect extends BaseRubanEffect {

  static effectId = "custom";
  static effectTypes = ["critical", "fumble"];
  static labelKey = "critical-ruban.settings.exitEffectChoices.custom";
  

  getEnterDuration(type) {
    return 3000;
  }
  
  getHoldDuration(type) {
    return 4500;
  }
  
  getExitDuration(type) {
    return 4500;
  }

  setup(banner) {

    // Override in subclasses

    const mapremierecouche = new PIXI.Container();
    banner.addEffectLayer("mapremierecouche", mapremierecouche, { parent: "fx", alpha: 0, visible: true });

    const left = -banner.bodyGroup.width / 2;
    const top = -banner.bodyGroup.height / 2;
    const right = banner.bodyGroup.width / 2;
    const bottom = banner.bodyGroup.height / 2;

    const centerh = 0;
    
    

    const tailleFlocon = 5;

    let cols = [];
    let rows = [];

    for(let i = left; i < right; i+=tailleFlocon)
    {
      cols.push(i);
    }

    cols.push(right)
      
    for(let j = top; j < bottom; j+=tailleFlocon)
    {
      rows.push(j);
    }

    rows.push(bottom);

    let polygons = [];

    for (let i = 0; i < cols.length - 1; i++) {
      for (let j = 0; j < rows.length - 1; j++) {
        polygons.push({
          row: j,
          col: i,
          points: [
            cols[i], rows[j],
            cols[i + 1], rows[j],
            cols[i + 1], rows[j + 1],
            cols[i], rows[j + 1]
          ]
        });
      }
    }

    this.createExplosionShards(banner, polygons);
    

    mapremierecouche.addChild(this.createShardRotation());
    //shardContainer.addChild(this.createShardRotation(banner));

    let vortexLayer = new PIXI.Container();
    banner.addEffectLayer("vortexLayer", vortexLayer, { parent: "motion", alpha: 1, visible: true });
    let vortex = this.getVortex();

    
    vortexLayer.addChild(vortex);
    
    banner.root.alpha = 1;
    banner.motion.alpha = 1;
    banner.bodyGroup.alpha = 0;
  }

  onEnter(banner, t, dtMS) {

    const vortexLayer = banner.getEffectLayer("vortexLayer");
    if(t < 0.3) 
    {
      vortexLayer.alpha = t/0.3;
      vortexLayer.scale.set(t/0.3);
    }
    else {
      banner.bodyGroup.scale.set((t-0.3)/0.7);
      banner.bodyGroup.alpha = (t-0.3)/0.7;
    }

    vortexLayer.rotation += dtMS/1000;
          

    // Override in subclasses
  }

  //-- fonction executée à chaque frame pendant le maintien du ruban
  onHold(banner, t, dtMS) {
    
    const vortexLayer = banner.getEffectLayer("vortexLayer");
    vortexLayer.rotation += dtMS/1000;
    if(t < 0.3) 
    {
      vortexLayer.alpha = 1-t/0.3;
      vortexLayer.scale.set(1-t/0.3);
    }

    super.onHold(banner, t, dtMS);
    // Override in subclasses
  }

  //-- fonction executée une fois avant le début de la phase de sortie
  onPrepareExit(banner) {

    
     // banner.bodyGroup.visible = false;
    // Override in subclasses
  }

  //-- fonction exécutée à chaque frame pendant la phase de sortie
  onExit(banner, t, dtMS) {

    if(t < 0.05) {banner.bodyGroup.visible = false;}
    const progress = CriticalRubanUtils.clamp01(t);

    const mapremierecouche = banner.getEffectLayer("mapremierecouche");
    if (mapremierecouche) {
      mapremierecouche.alpha = 1; // Fait disparaître les shards progressivement
      mapremierecouche.rotation = t * 2*Math.PI; // Fait tourner les shards
    }

    const shardContainer = banner.getEffectLayer("explosionShards");
    if (shardContainer) {
      shardContainer.alpha = 1; // Fait apparaître les vrais shards
    }
    // Override in subclasses - default behavior

    
    const shards = this.createExplosionShards(banner, []);
    if (shards.length) {

      for (const piece of shards) 
      {
        //if(((20-piece.row)/20) < t)
        //{
          piece.sprite.y += 5;
          piece.sprite.x += CriticalRubanUtils.randomBetween(-3, 3) * t*15; // Légère oscillation horizontale
          piece.sprite.alpha = 1 - t;


          //piece.sprite.children[0].mask.alpha = Math.max(0, piece.sprite.children[0].mask.alpha - t); // Fait disparaître le masque en même temps que le shard
          //piece.sprite.children[0].mask.tint = 0xffffff; // Fait disparaître le masque en même temps que le shard
          
          /*
          const colorMatrix = new PIXI.ColorMatrixFilter();
          
          colorMatrix.desaturate();
          colorMatrix.brightness(1 + t); // Augmente la luminosité pour simuler une lueur

          piece.sprite.filters = [colorMatrix];
          */

        //}
      }
    }
    
  }

  onDestroy(banner) {

    // Override in subclasses
  }





  createShardRotation()
  {
    const flameGraphic = new PIXI.Graphics();


    flameGraphic.beginFill(0xFF4500, 0.8);
    flameGraphic.drawRect(0, 0, 30, 30);
    flameGraphic.endFill();

      
    flameGraphic.beginFill(0x4500FF, 0.8);
    flameGraphic.drawRect(-30, -30, 30, 30);
    flameGraphic.endFill();

    return flameGraphic;
  }


  createFixedShard()
  {
    
  }





  getVortex()
  {

const galaxy = new PIXI.Container();

const arms = 4;               // nombre de bras
const segments = 260;          // finesse des bras
const outerRadius = 560;      // taille de la galaxie
const innerRadius = 5;       // cœur
const twist = 3.2;            // torsion des bras
const ellipseFactor = 1;   // écrasement vertical
const color = 0xFF39F4;            // couleur de base (rose vif)

// --- CŒUR ---
const core = new PIXI.Graphics();
core.beginFill(color, 0.95);
core.drawCircle(0, 0, innerRadius);
core.endFill();
galaxy.addChild(core);

// --- BRAS ---
for (let a = 0; a < arms; a++) {
    const arm = new PIXI.Graphics();

    for (let i = 0; i < segments; i++) {
        const p = i / segments;

        // rayon intérieur et extérieur du segment
        const r1 = innerRadius + (outerRadius - innerRadius) * p;
        const r2 = innerRadius + (outerRadius - innerRadius) * (p + 1 / segments);

        // angle du bras
        const baseAngle = (a / arms) * Math.PI * 2;

        // torsion progressive
        const angle1 = baseAngle + p * twist * Math.PI * 2;
        const angle2 = baseAngle + (p + 1 / segments) * twist * Math.PI * 2;

        // --- ÉPAISSEUR DU BRAS (version très épaisse) ---
        // 80px au centre → 12px au bout
        const thickness = 80 * Math.pow(1 - p, 1.2) + 12;

        // alpha
        const alpha = 0.32 * (1 - p * 0.7);

        arm.beginFill(color, alpha);

        // points extérieurs
        const x1 = Math.cos(angle1) * r1;
        const y1 = Math.sin(angle1) * r1 * ellipseFactor;

        const x2 = Math.cos(angle2) * r2;
        const y2 = Math.sin(angle2) * r2 * ellipseFactor;

        // points intérieurs (épaisseur du bras)
        const x3 = Math.cos(angle2) * (r2 - thickness);
        const y3 = Math.sin(angle2) * (r2 - thickness) * ellipseFactor;

        const x4 = Math.cos(angle1) * (r1 - thickness);
        const y4 = Math.sin(angle1) * (r1 - thickness) * ellipseFactor;

        // polygone du segment
        arm.moveTo(x1, y1);
        arm.lineTo(x2, y2);
        arm.lineTo(x3, y3);
        arm.lineTo(x4, y4);
        arm.closePath();

        arm.endFill();
    }

    galaxy.addChild(arm);
}

// position à adapter
return galaxy

  }











































  createExplosionShards(banner, polygons) {

    const existing = banner.getEffectLayer("explosionShards");
    if (existing) return existing._shards ?? [];

    const snapshot = banner.captureBodyGroupTexture();
    if (!snapshot?.texture || !snapshot?.bounds) return [];

    const shardContainer = new PIXI.Container();
    banner.addEffectLayer("explosionShards", shardContainer, { parent: "fx", alpha: 0, visible: true });

    const pieces = [];

    for (const forme of polygons) {
      const { shard, cx, cy } = banner.createTexturedShard(forme.points, snapshot.texture, snapshot.bounds, banner.accentColor);
      shardContainer.addChild(shard);

      const gotoX = shard.x + 100;
      const startX = shard.x;
      const startY = shard.y;
      const launchDelay = CriticalRubanUtils.randomBetween(0.12, 0.18);
      const quadrantX = Math.sign(cx) || (Math.random() > 0.5 ? 1 : -1);
      const quadrantY = Math.sign(cy) || (cy < 0 ? -1 : 1);
      const isCenter = Math.abs(cx) < banner.mainWidth * 0.16 && Math.abs(cy) < banner.height * 0.16;
      const speedX = isCenter ? 0 : quadrantX * CriticalRubanUtils.randomBetween(220, 320) + cx * 0.1;
      const speedY = isCenter ? 0 : quadrantY * CriticalRubanUtils.randomBetween(130, 210) + cy * 0.08;
      const rotationSpeed = isCenter ? 0 : CriticalRubanUtils.randomBetween(-2.0, 2.0);

      pieces.push({
        sprite: shard,
        destination: { x: gotoX, y: shard.y - 80 },
        start: { x: startX, y: startY },
        row: forme.row,
        col: forme.col,
      });
    }

     const flameGraphic = new PIXI.Graphics();


    shardContainer._shards = pieces;
    shardContainer._snapshot = snapshot.texture;
    return pieces;
  }












}