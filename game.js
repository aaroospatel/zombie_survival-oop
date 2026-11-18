/**
 * ============================================================================
 * ZOMBIE APOCALYPSE SURVIVAL SIMULATOR – OOP WEB EDITION
 * Demonstrating the 4 Pillars of Object-Oriented Programming (OOP):
 * 1. Encapsulation: Private class fields (#), controlled getters/setters.
 * 2. Inheritance: Entity -> Player, Zombie; Zombie -> Normal, Fast, Tank.
 * 3. Polymorphism: Subclasses override update(), moveTowards(), takeDamage(), render().
 * 4. Abstraction: GameEngine encapsulates 60FPS loop, vector collision, and audio.
 * ============================================================================
 */

// Simple Web Audio API Synthesizer (Zero External Dependencies)
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playLaser() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playHit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playReload() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.setValueAtTime(650, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playGameOver() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }
}

const sfx = new SoundFX();

// ============================================================================
// 1. ABSTRACTION & ENCAPSULATION: Base Entity Class
// ============================================================================
class Entity {
  #x;
  #y;
  #radius;
  #alive;

  constructor(x, y, radius) {
    if (new.target === Entity) {
      throw new TypeError("Cannot construct Abstract instance directly.");
    }
    this.#x = x;
    this.#y = y;
    this.#radius = radius;
    this.#alive = true;
  }

  // Pure virtual / abstract method
  update(dt) {
    throw new Error("Abstract method update() must be implemented.");
  }

  render(ctx) {
    throw new Error("Abstract method render() must be implemented.");
  }

  takeDamage(amount) {
    // Override in derived classes
  }

  // Encapsulation Getters & Setters
  get x() { return this.#x; }
  set x(val) { this.#x = val; }

  get y() { return this.#y; }
  set y(val) { this.#y = val; }

  get radius() { return this.#radius; }
  set radius(val) { this.#radius = val; }

  get isAlive() { return this.#alive; }
  set isAlive(state) { this.#alive = state; }

  distanceTo(other) {
    const dx = this.#x - other.x;
    const dy = this.#y - other.y;
    return Math.hypot(dx, dy);
  }

  collidesWith(other) {
    return this.distanceTo(other) < (this.#radius + other.radius);
  }
}

// ============================================================================
// 2. ENCAPSULATION: Gun Class (Single Weapon)
// ============================================================================
class Gun {
  #name;
  #damage;
  #ammoInClip;
  #clipCapacity;
  #totalAmmo;

  constructor(name = "Survival Rifle", damage = 25, clip = 12, reserve = 48) {
    this.#name = name;
    this.#damage = damage;
    this.#clipCapacity = clip;
    this.#ammoInClip = clip;
    this.#totalAmmo = reserve;
  }

  shoot() {
    if (this.#ammoInClip <= 0) return false;
    this.#ammoInClip--;
    sfx.playLaser();
    return true;
  }

  reload() {
    const needed = this.#clipCapacity - this.#ammoInClip;
    if (needed <= 0 || this.#totalAmmo <= 0) return false;

    const toReload = Math.min(needed, this.#totalAmmo);
    this.#ammoInClip += toReload;
    this.#totalAmmo -= toReload;
    sfx.playReload();
    return true;
  }

  addReserveAmmo(amount) {
    this.#totalAmmo += amount;
  }

  get name() { return this.#name; }
  get damage() { return this.#damage; }
  get ammoInClip() { return this.#ammoInClip; }
  get clipCapacity() { return this.#clipCapacity; }
  get totalAmmo() { return this.#totalAmmo; }
}

// ============================================================================
// 3. INHERITANCE & COMPOSITION: Player Class
// ============================================================================
class Player extends Entity {
  #speed;
  #score;
  #kills;
  #gun;
  #angle;

  constructor(x, y) {
    super(x, y, 14);
    this.#speed = 190; // Pixels per sec
    this.#score = 0;
    this.#kills = 0;
    this.#angle = 0;
    this.#gun = new Gun("Assault Rifle", 25, 12, 48); // Composition
  }

  update(dt, input, canvasWidth, canvasHeight) {
    let dx = 0;
    let dy = 0;

    if (input.keys["KeyW"] || input.keys["ArrowUp"]) dy -= 1;
    if (input.keys["KeyS"] || input.keys["ArrowDown"]) dy += 1;
    if (input.keys["KeyA"] || input.keys["ArrowLeft"]) dx -= 1;
    if (input.keys["KeyD"] || input.keys["ArrowRight"]) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.x = Math.max(this.radius + 6, Math.min(canvasWidth - this.radius - 6, this.x + dx * this.#speed * dt));
    this.y = Math.max(this.radius + 6, Math.min(canvasHeight - this.radius - 6, this.y + dy * this.#speed * dt));

    // Update aim angle from mouse coordinates
    this.#angle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
  }

  shoot() {
    return this.#gun.shoot();
  }

  reload() {
    return this.#gun.reload();
  }

  recordKill(points) {
    this.#kills++;
    this.#score += points;
    if (this.#kills % 3 === 0) {
      this.#gun.addReserveAmmo(6);
    }
  }

  get score() { return this.#score; }
  get kills() { return this.#kills; }
  get gun() { return this.#gun; }
  get angle() { return this.#angle; }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.#angle);

    // ── SHADOW ───────────────────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(1, 4, 10, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // ── LEGS (behind body, slightly spread) ─────────────────
    // Left leg
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.ellipse(-3, 7, 3.5, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right leg
    ctx.beginPath();
    ctx.ellipse(3, 7, 3.5, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Boots
    ctx.fillStyle = '#1a252f';
    ctx.beginPath(); ctx.ellipse(-3, 11, 3, 2.5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, 11, 3, 2.5, 0.1, 0, Math.PI * 2); ctx.fill();

    // ── BODY / TORSO ─────────────────────────────────────────
    // Tactical vest
    ctx.fillStyle = '#3d5a3e';
    ctx.beginPath();
    ctx.ellipse(0, 1, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Vest highlight stripe
    ctx.fillStyle = '#4a7a4c';
    ctx.fillRect(-1.5, -6, 3, 10);

    // ── LEFT ARM (rear, holding grip) ───────────────────────
    ctx.fillStyle = '#c68642';
    ctx.beginPath();
    ctx.ellipse(-8, 2, 3, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // ── GUN ──────────────────────────────────────────────────
    // Grip
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(5, 0, 5, 7);
    // Receiver/body
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(7, -3, 14, 5);
    // Magazine
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(11, 2, 4, 5);
    // Barrel
    ctx.fillStyle = '#3a3a55';
    ctx.fillRect(21, -2, 10, 3);
    // Muzzle tip
    ctx.fillStyle = '#555577';
    ctx.fillRect(30, -1.5, 3, 2);

    // ── RIGHT ARM (front, on foregrip) ──────────────────────
    ctx.fillStyle = '#c68642';
    ctx.beginPath();
    ctx.ellipse(14, 1, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── HEAD ─────────────────────────────────────────────────
    // Helmet
    ctx.fillStyle = '#3d5a3e';
    ctx.beginPath();
    ctx.arc(0, -7, 8, Math.PI, 0); // top dome
    ctx.fill();
    ctx.fillRect(-8, -9, 16, 4);
    // Helmet brim
    ctx.fillStyle = '#2d442e';
    ctx.fillRect(-9, -6, 18, 2);

    // Face / balaclava
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes — white with colored iris, alert
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-2.5, -6, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.5, -6, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5bc8f5';
    ctx.beginPath(); ctx.arc(-2.5, -6, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -6, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-2.5, -6, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -6, 0.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

// ============================================================================
// 4. INHERITANCE & POLYMORPHISM: Zombie Hierarchy
// ============================================================================
class Zombie extends Entity {
  #health;
  #maxHealth;
  #speed;
  #scoreValue;
  #color;
  #label;
  #angle;  // facing direction toward player

  constructor(x, y, radius, hp, speed, score, color, label) {
    super(x, y, radius);
    this.#health = hp;
    this.#maxHealth = hp;
    this.#speed = speed;
    this.#scoreValue = score;
    this.#color = color;
    this.#label = label;
    this.#angle = 0;
  }

  takeDamage(amount) {
    this.#health -= amount;
    sfx.playHit();
    if (this.#health <= 0) {
      this.isAlive = false;
    }
  }

  update(dt, player) {
    // AI Chasing: Move directly towards the survivor
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.#angle = Math.atan2(dy, dx);
      this.x += (dx / dist) * this.#speed * dt;
      this.y += (dy / dist) * this.#speed * dt;
    }
  }

  render(ctx) {
    const isTank  = this.#label === 'T';
    const isFast  = this.#label === 'F';
    const scale   = isTank ? 1.45 : isFast ? 0.88 : 1.0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.#angle);
    ctx.scale(scale, scale);

    // ── SHADOW ──────────────────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(1, 5, 9, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // ── LEGS — dragging, uneven ──────────────────────────────
    const skinDark = isTank ? '#5a3e28' : '#4a7a3a';  // dark rot-green skin
    const clothRot = isTank ? '#3a2010' : '#2a3a1a';
    // Left leg — bent outward
    ctx.fillStyle = clothRot;
    ctx.beginPath();
    ctx.ellipse(-4, 8, 3.5, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Right leg — dragging
    ctx.beginPath();
    ctx.ellipse(3, 9, 3, 5.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── TORSO — rotting, hunched ──────────────────────────────
    const torsoColor = isTank ? '#2d3b1a' : isFast ? '#1a3b2a' : '#253320';
    ctx.fillStyle = torsoColor;
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Torn shirt lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(-2, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -5);  ctx.lineTo(2, 3);  ctx.stroke();

    // ── ARMS — outstretched reaching ────────────────────────
    const armColor = isTank ? '#6b5030' : '#4a7a3a';
    // Left arm stretched forward
    ctx.fillStyle = armColor;
    ctx.beginPath();
    ctx.ellipse(-8, -2, 3.5, 7, 1.0, 0, Math.PI * 2);
    ctx.fill();
    // Left hand claw
    ctx.fillStyle = armColor;
    ctx.beginPath(); ctx.arc(-10, -7, 3, 0, Math.PI * 2); ctx.fill();
    // Claw fingers
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(-12,-13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(-10,-14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(-8,-13);  ctx.stroke();

    // Right arm stretched forward
    ctx.fillStyle = armColor;
    ctx.beginPath();
    ctx.ellipse(8, -2, 3.5, 7, -1.0, 0, Math.PI * 2);
    ctx.fill();
    // Right hand claw
    ctx.beginPath(); ctx.arc(10, -7, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(12,-13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(10,-14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(8,-13);  ctx.stroke();

    // ── HEAD — rotting, asymmetric ──────────────────────────
    const headColor = isTank ? '#7a5a30' : isFast ? '#4a8a50' : '#5a8a3a';
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(0, -9, isTank ? 9 : 7, 0, Math.PI * 2);
    ctx.fill();
    // Hair / scalp — matted, dark
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(0, -12, isTank ? 8 : 6, Math.PI, 0);
    ctx.fill();

    // ── EYES — dead, glowing ────────────────────────────────
    const eyeGlow = isTank ? '#ff4400' : isFast ? '#ffaa00' : '#aaff44';
    // Sunken sockets
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath(); ctx.ellipse(-2.5, -10, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.5, -10, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    // Glowing pupils
    ctx.fillStyle = eyeGlow;
    ctx.beginPath(); ctx.arc(-2.5, -10, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -10, 1.2, 0, Math.PI * 2); ctx.fill();

    // ── MOUTH — snarling ───────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -7, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Teeth
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-2.5, -8, 2, 1.5);
    ctx.fillRect(0.5, -8, 2, 1.5);

    // ── HEALTH BAR for Tank only ────────────────────────────
    if (this.#maxHealth > 25) {
      ctx.restore();  // pop scale before drawing bar in screen-space
      ctx.save();
      const barW = 32;
      const barH = 3;
      const pct = Math.max(0, this.#health / this.#maxHealth);
      const bx = this.x - barW / 2;
      const by = this.y - this.radius * scale - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#f05454';
      ctx.fillRect(bx, by, barW * pct, barH);
      ctx.restore();
      return;
    }

    ctx.restore();
  }

  get scoreValue() { return this.#scoreValue; }
  get label() { return this.#label; }
  get health() { return this.#health; }
}

class NormalZombie extends Zombie {
  constructor(x, y) {
    super(x, y, 13, 25, 42, 10, "rgba(100,220,120,0.9)", "Z"); // Walker
  }
}

class FastZombie extends Zombie {
  constructor(x, y) {
    super(x, y, 11, 25, 68, 20, "rgba(240,160,60,0.9)", "F"); // Runner
  }
}

class TankZombie extends Zombie {
  constructor(x, y) {
    super(x, y, 19, 75, 28, 50, "rgba(240,84,84,0.9)", "T"); // Tank
  }
}

// Projectile Bullet
class Bullet {
  constructor(x, y, angle, damage = 25) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * 750;
    this.vy = Math.sin(angle) * 750;
    this.radius = 3;
    this.damage = damage;
    this.alive = true;
    this.distanceTraveled = 0;
    this.maxRange = 650;
  }

  update(dt) {
    const stepX = this.vx * dt;
    const stepY = this.vy * dt;
    this.x += stepX;
    this.y += stepY;
    this.distanceTraveled += Math.hypot(stepX, stepY);
    if (this.distanceTraveled >= this.maxRange) {
      this.alive = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // rotate bullet to travel direction
    ctx.rotate(Math.atan2(this.vy, this.vx));
    // Bullet trail
    const grad = ctx.createLinearGradient(-10, 0, 4, 0);
    grad.addColorStop(0, 'rgba(232,245,98,0)');
    grad.addColorStop(1, 'rgba(232,245,98,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(-10, -1.5, 10, 3);
    // Bullet tip
    ctx.fillStyle = '#e8f562';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Particle Effect
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 2 + Math.random() * 2;
    this.color = color;
    this.alpha = 1;
    this.decay = 1.8 + Math.random() * 2.5;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.alpha -= this.decay * dt;
  }

  render(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// 5. ABSTRACTION & ENGINE: GameEngine Class
// ============================================================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // UI elements
    this.scoreDisplay = document.getElementById("scoreDisplay");
    this.highScoreDisplay = document.getElementById("highScoreDisplay");
    this.killsDisplay = document.getElementById("killsDisplay");
    this.timeDisplay = document.getElementById("timeDisplay");
    this.spawnRateDisplay = document.getElementById("spawnRateDisplay");
    this.ammoDisplay = document.getElementById("ammoDisplay");
    this.reserveDisplay = document.getElementById("reserveDisplay");
    this.statusMessage = document.getElementById("statusMessage");

    this.overlay = document.getElementById("screenOverlay");
    this.overlayTitle = document.getElementById("overlayTitle");
    this.overlaySubtitle = document.getElementById("overlaySubtitle");
    this.finalStats = document.getElementById("finalStats");
    this.finalScoreVal = document.getElementById("finalScoreVal");
    this.finalBestVal = document.getElementById("finalBestVal");
    this.finalKillsVal = document.getElementById("finalKillsVal");
    this.finalTimeVal = document.getElementById("finalTimeVal");
    this.actionBtn = document.getElementById("actionBtn");

    this.manualModal = document.getElementById("manualModal");

    // Load High Score
    this.highScore = parseInt(localStorage.getItem("zombie_highscore") || "0", 10);
    if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.highScore;

    // Game state
    this.player = null;
    this.zombies = [];
    this.bullets = [];
    this.particles = [];

    this.isRunning = false;
    this.isGameOver = false;
    this.elapsedTime = 0;
    this.spawnTimer = 0;
    this.baseSpawnInterval = 3.2; // Moderated spawn rate (starts at 3.2s between spawns)
    this.currentSpawnInterval = 3.2;

    this.lastFrameTime = 0;

    this.input = {
      keys: {},
      mouseX: this.canvas.width / 2,
      mouseY: this.canvas.height / 2,
    };

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("keydown", (e) => {
      this.input.keys[e.code] = true;

      // Start / Retry game with Space or Enter when overlay is active
      if ((e.code === "Space" || e.code === "Enter") && !this.isRunning) {
        if (this.manualModal.style.display !== "flex") {
          e.preventDefault();
          sfx.init();
          this.startNewGame();
          return;
        }
      }

      if (e.code === "KeyR" && this.isRunning) {
        if (this.player.reload()) {
          this.setStatus("Reloaded weapon!");
        } else {
          this.setStatus("Clip full or out of reserve ammo!");
        }
      } else if (e.code === "KeyH") {
        this.toggleManual();
      } else if (e.code === "KeyQ" && this.isRunning) {
        this.gameOver("Mission abandoned by survivor.");
      } else if (e.code === "Escape") {
        this.closeManual();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.input.keys[e.code] = false;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.input.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.input.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0 && this.isRunning) {
        this.firePlayerGun();
      }
    });

    // Keyboard shooting support with IJKL
    window.addEventListener("keydown", (e) => {
      if (!this.isRunning) return;
      let angle = null;
      if (e.code === "KeyI") angle = -Math.PI / 2;
      else if (e.code === "KeyK") angle = Math.PI / 2;
      else if (e.code === "KeyJ") angle = Math.PI;
      else if (e.code === "KeyL") angle = 0;

      if (angle !== null) {
        this.firePlayerGunAngle(angle);
      }
    });

    this.actionBtn.addEventListener("click", () => {
      sfx.init();
      this.startNewGame();
    });

    document.getElementById("btnManual").addEventListener("click", () => this.toggleManual());
    document.getElementById("manualBtnOverlay").addEventListener("click", () => this.toggleManual());
    document.getElementById("closeManualBtn").addEventListener("click", () => this.closeManual());
    document.getElementById("btnReload").addEventListener("click", () => {
      if (this.isRunning) this.player.reload();
    });
    document.getElementById("btnQuit").addEventListener("click", () => {
      if (this.isRunning) this.gameOver("Mission aborted.");
    });
  }

  toggleManual() {
    this.manualModal.style.display = (this.manualModal.style.display === "none") ? "flex" : "none";
  }

  closeManual() {
    this.manualModal.style.display = "none";
  }

  setStatus(msg) {
    this.statusMessage.textContent = msg;
  }

  startNewGame() {
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
    this.zombies = [];
    this.bullets = [];
    this.particles = [];
    this.elapsedTime = 0;
    this.spawnTimer = 0;
    this.baseSpawnInterval = 3.2;
    this.currentSpawnInterval = 3.2;

    this.isRunning = true;
    this.isGameOver = false;

    this.overlay.style.display = "none";
    this.finalStats.style.display = "none";
    this.actionBtn.textContent = "Play";
    this.overlayTitle.textContent = "Dead Zone";
    this.overlaySubtitle.textContent = "Zombies close in from every direction.\nOne touch means instant infection — game over.";
    this.closeManual();
    this.setStatus("Outbreak active. Survive as long as you can.");

    // Spawn 2 initial zombies
    this.spawnZombie();
    this.spawnZombie();

    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  firePlayerGun() {
    if (!this.player.shoot()) {
      this.setStatus("*CLICK!* Clip empty! Press 'R' to reload.");
      return;
    }
    const bullet = new Bullet(this.player.x, this.player.y, this.player.angle, this.player.gun.damage);
    this.bullets.push(bullet);
    this.createMuzzleFlash(this.player.x, this.player.y, this.player.angle);
  }

  firePlayerGunAngle(angle) {
    if (!this.player.shoot()) {
      this.setStatus("*CLICK!* Clip empty! Press 'R' to reload.");
      return;
    }
    const bullet = new Bullet(this.player.x, this.player.y, angle, this.player.gun.damage);
    this.bullets.push(bullet);
    this.createMuzzleFlash(this.player.x, this.player.y, angle);
  }

  createMuzzleFlash(x, y, angle) {
    const tipX = x + Math.cos(angle) * 16;
    const tipY = y + Math.sin(angle) * 16;
    for (let i = 0; i < 4; i++) {
      this.particles.push(new Particle(tipX, tipY, '#e8f562'));
    }
  }

  createBloodSplatter(x, y) {
    for (let i = 0; i < 7; i++) {
      this.particles.push(new Particle(x, y, '#6b0000'));
    }
  }

  spawnZombie() {
    // Spawn along canvas borders
    const side = Math.floor(Math.random() * 4);
    let sx = 0, sy = 0;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (side === 0) { sx = Math.random() * w; sy = -15; }
    else if (side === 1) { sx = w + 15; sy = Math.random() * h; }
    else if (side === 2) { sx = Math.random() * w; sy = h + 15; }
    else { sx = -15; sy = Math.random() * h; }

    const roll = Math.random();
    let z;
    if (roll < 0.50) {
      z = new NormalZombie(sx, sy);
    } else if (roll < 0.80) {
      z = new FastZombie(sx, sy);
    } else {
      z = new TankZombie(sx, sy);
    }

    this.zombies.push(z);
  }

  gameOver(reason) {
    this.isRunning = false;
    this.isGameOver = true;
    sfx.playGameOver();

    // High Score tracking
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      localStorage.setItem("zombie_highscore", this.highScore.toString());
      if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.highScore;
    }

    this.overlayTitle.textContent = "Infected";
    this.overlaySubtitle.textContent = reason || "A zombie caught you. No second chances.";

    // Fill in Scorecard
    if (this.finalScoreVal) this.finalScoreVal.textContent = `${this.player.score} PTS`;
    if (this.finalBestVal) this.finalBestVal.textContent = `${this.highScore} PTS`;
    if (this.finalKillsVal) this.finalKillsVal.textContent = this.player.kills.toString();
    if (this.finalTimeVal) this.finalTimeVal.textContent = `${Math.floor(this.elapsedTime)}s`;

    this.finalStats.style.display = "block";
    this.actionBtn.textContent = "Try Again";
    this.overlay.style.display = "flex";
    this.setStatus("Round over. Press Space or click Try Again.");
  }

  update(dt) {
    this.elapsedTime += dt;

    // Progressive spawn acceleration: starts at 3.2s, gradually decreases down to 1.3s
    this.currentSpawnInterval = Math.max(1.3, this.baseSpawnInterval - (this.elapsedTime * 0.02));
    const rateVal = this.baseSpawnInterval / this.currentSpawnInterval;
    let threat = rateVal < 1.4 ? 'LOW' : rateVal < 1.9 ? 'MED' : rateVal < 2.4 ? 'HIGH' : 'CRIT';
    this.spawnRateDisplay.textContent = threat;
    const spawnPill = document.getElementById('spawnPill');
    if (spawnPill) spawnPill.classList.toggle('warn', rateVal >= 1.9);

    // Zombie respawn timer
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnZombie();
      if (this.elapsedTime > 45 && Math.random() < 0.35) {
        this.spawnZombie(); // Occasional extra spawn as survival passes 45s
      }
    }

    // 1. Update Survivor
    this.player.update(dt, this.input, this.canvas.width, this.canvas.height);

    // 2. Update Bullets & Collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt);

      if (!b.alive) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with zombies
      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const z = this.zombies[j];
        if (z.isAlive && b.alive && Math.hypot(b.x - z.x, b.y - z.y) < (b.radius + z.radius)) {
          b.alive = false;
          z.takeDamage(b.damage);
          this.createBloodSplatter(z.x, z.y);

          if (!z.isAlive) {
            this.player.recordKill(z.scoreValue);
            this.setStatus(`Neutralized ${z.label === 'T' ? 'Tank' : (z.label === 'F' ? 'Runner' : 'Walker')}! (+${z.scoreValue} pts)`);
            this.zombies.splice(j, 1);
          }
          break;
        }
      }
    }

    // 3. Update Zombies & Survivor Collision
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      z.update(dt, this.player);

      // Instant game over if any zombie touches the player!
      if (z.collidesWith(this.player)) {
        this.gameOver(`A ${z.label === 'T' ? 'Tank' : (z.label === 'F' ? 'Fast Runner' : 'Normal Zombie')} caught and infected you!`);
        return;
      }
    }

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Update HUD Displays
    this.scoreDisplay.textContent = this.player.score;
    this.killsDisplay.textContent = this.player.kills;
    this.timeDisplay.textContent = `${Math.floor(this.elapsedTime)}s`;
    this.ammoDisplay.textContent = this.player.gun.ammoInClip;
    this.reserveDisplay.textContent = `· ${this.player.gun.totalAmmo}`;
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // ── Background ──────────────────────────────────────────
    ctx.fillStyle = '#07080b';
    ctx.fillRect(0, 0, W, H);

    // Subtle dot-grid (very faint depth cue)
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    const DOT_SPACING = 48;
    for (let gx = DOT_SPACING / 2; gx < W; gx += DOT_SPACING) {
      for (let gy = DOT_SPACING / 2; gy < H; gy += DOT_SPACING) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Danger border — thin, dim red ───────────────────────
    ctx.strokeStyle = 'rgba(240,84,84,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // ── Particles ────────────────────────────────────────────
    for (const p of this.particles) {
      p.render(ctx);
    }

    // ── Bullets ──────────────────────────────────────────────
    for (const b of this.bullets) {
      b.render(ctx);
    }

    // ── Zombies ──────────────────────────────────────────────
    for (const z of this.zombies) {
      z.render(ctx);
    }

    // ── Player ───────────────────────────────────────────────
    if (this.player) {
      this.player.render(ctx);
    }
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start engine when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new GameEngine();
});
