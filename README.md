# 🧟 Zombie Apocalypse Survival Simulator – OOP Project

A clean, simple, and easily explainable **Zombie Survival Game** demonstrating the **Four Fundamental Pillars of Object-Oriented Programming (OOP)**.

This repository includes **two identical OOP implementations**:
1. **Console Edition (C++14)**: Clean, single-file, easy to explain during a viva or presentation.
2. **Web Edition (HTML5 / Canvas / OOP JavaScript)**: Ready for **1-click deployment on Netlify**.

---

## 🎮 Game Rules & Mechanics

- **One Objective:** Survive against incoming zombies and earn the highest score.
- **One Gun:** Assault Rifle with ammunition clips, reload mechanic (`R`), and reserve ammo.
- **Instant Death:** If **any** zombie touches the player, it is instant **Game Over**.
- **Dynamic Difficulty:** Zombies respawn at intervals (starts at ~3.2s intervals on Web / 5 turns in Console); as time/turns progress, the spawn rate gradually increases.
- **Zombie Types & Speeds:**
  - `Z` – **Normal Zombie** (Slower walker: 10 pts, takes 1 shot)
  - `F` – **Fast Runner** (Moderated runner: 20 pts, takes 1 shot)
  - `T` – **Tank Juggernaut** (Heavy slow brute: 50 pts, takes 3 shots)
- **Controls:**
  - `W`, `A`, `S`, `D`: Move Survivor
  - `I`, `J`, `K`, `L` (or Mouse on Web): Shoot Gun
  - `R`: Reload Gun
  - `H`: View In-Game Manual
  - `Q`: Quit Game

---

## 🏛️ How to Explain the 4 OOP Pillars

### 1. 🛡️ Encapsulation
- **What it is:** Wrapping data and functions into a single unit and restricting direct access to object internals.
- **In our code:**
  - `Entity`, `Player`, `Zombie`, and `Gun` classes protect their data members (`health`, `x`, `y`, `ammoInClip`, `totalAmmo`, `score`) using `protected`/`private` access.
  - State changes happen only through validated methods (e.g. `gun.shoot()`, `gun.reload()`, `player.move()`).

### 2. 🧬 Inheritance
- **What it is:** Creating new classes based on existing ones to promote code reuse.
- **In our code:**
  - `Entity` is the base class for both `Player` and `Zombie`.
  - `Zombie` is the base class for `NormalZombie`, `FastZombie`, and `TankZombie`.
  - Derived classes inherit position, symbol, and alive status while adding their own specialized behaviors.

### 3. 🎭 Polymorphism
- **What it is:** Allowing different classes to be treated through a common interface with specialized runtime behaviors.
- **In our code:**
  - `virtual void update() = 0;` (pure virtual abstraction)
  - `virtual void takeDamage(int amount);`
  - `virtual void moveTowards(int tx, int ty);`
  - The `FastZombie` moves every turn, while `NormalZombie` moves every 2 turns and `TankZombie` moves every 3 turns.
  - The `TankZombie` has higher health and takes 3 shots before dying.
  - In `GameEngine`, all zombies are stored as `vector<Zombie*>`, and calling `z->moveTowards()` or `z->takeDamage()` dynamically executes the correct derived behavior.

### 4. 🧩 Abstraction
- **What it is:** Hiding complex low-level implementation details behind a clean, simple public interface.
- **In our code:**
  - `GameEngine` exposes simple functions (`run()`, `render()`, `resetGame()`), completely hiding internal grid coordinate calculations, raycasting bullet trajectories, and AI movement from `main()`.

### 5. 🧱 Composition
- `Player` **HAS-A** `Gun`. The gun object is managed as a component inside the player class rather than inheriting from it.

---

## 💻 Running the C++ Console Game

### Quick Compile & Run (Windows):
Double-click `build.bat` or run:
```cmd
g++ -std=c++14 -Wall -Wextra main.cpp -o ZombieGame.exe
ZombieGame.exe
```

---

## 🌐 Deploying to Netlify (Web Edition)

The project includes `index.html`, `style.css`, `game.js`, and `netlify.toml` in the root directory.

### Method 1: Netlify Drop (Instant – No Terminal Required)
1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Sign in to your Netlify account (free).
3. Drag and drop this entire project folder (`OOP Project`) into the browser.
4. Netlify will publish your site in seconds and give you a live shareable URL (e.g., `https://zombie-survival-sim.netlify.app`)!

### Method 2: Deploy with Git & Netlify
1. Push this project folder to a GitHub repository:
   ```cmd
   git init
   git add .
   git commit -m "Initial commit - Zombie Survival Simulator"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Log into [Netlify](https://app.netlify.com/), click **"Add new site"** $\rightarrow$ **"Import an existing project"**.
3. Select your GitHub repository. Netlify detects `netlify.toml` automatically.
4. Click **"Deploy site"**.
