#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>
#include <ctime>
#include <cmath>

using namespace std;

// ============================================================================
// 1. ABSTRACTION & ENCAPSULATION: Base Entity Class
// ============================================================================
class Entity {
protected:
    int x, y;          // Position coordinates
    char symbol;       // Display character ('P', 'Z', etc.)
    bool alive;

public:
    Entity(int startX, int startY, char sym) 
        : x(startX), y(startY), symbol(sym), alive(true) {}
    
    virtual ~Entity() {} // Virtual destructor for safe polymorphic cleanup

    // Pure Virtual Function (Abstraction: Must be implemented by derived classes)
    virtual void update() = 0;

    // Virtual Function (Polymorphism: Can be overridden)
    virtual void takeDamage(int amount) {
        (void)amount;
    }

    // Encapsulation: Controlled Getters & Setters
    int getX() const { return x; }
    int getY() const { return y; }
    void setPosition(int newX, int newY) { x = newX; y = newY; }
    char getSymbol() const { return symbol; }
    bool isAlive() const { return alive; }
    void setAlive(bool state) { alive = state; }
};

// ============================================================================
// 2. ENCAPSULATION: Gun Class (Single Weapon)
// ============================================================================
class Gun {
private:
    string name;
    int damage;
    int range;
    int ammoInClip;
    int clipCapacity;
    int totalAmmo;

public:
    Gun(string gunName = "Survival Rifle", int dmg = 25, int rng = 8, int capacity = 10, int reserve = 40)
        : name(gunName), damage(dmg), range(rng), ammoInClip(capacity), clipCapacity(capacity), totalAmmo(reserve) {}

    bool shoot() {
        if (ammoInClip <= 0) {
            return false; // Out of ammo in current clip
        }
        ammoInClip--;
        return true;
    }

    void reload() {
        int needed = clipCapacity - ammoInClip;
        if (needed <= 0 || totalAmmo <= 0) return;

        int toReload = min(needed, totalAmmo);
        ammoInClip += toReload;
        totalAmmo -= toReload;
    }

    void addReserveAmmo(int amount) {
        totalAmmo += amount;
    }

    // Encapsulation: Getters
    string getName() const { return name; }
    int getDamage() const { return damage; }
    int getRange() const { return range; }
    int getAmmoInClip() const { return ammoInClip; }
    int getClipCapacity() const { return clipCapacity; }
    int getTotalAmmo() const { return totalAmmo; }
};

// ============================================================================
// 3. INHERITANCE & COMPOSITION: Player Class
// ============================================================================
class Player : public Entity {
private:
    int score;
    int kills;
    Gun gun; // Composition: Player HAS-A Gun

public:
    Player(int startX = 10, int startY = 6) 
        : Entity(startX, startY, 'P'), score(0), kills(0), gun("Assault Rifle", 25, 7, 12, 48) {}

    void update() override {
        // Player state update logic if needed
    }

    void move(int dx, int dy, int mapWidth, int mapHeight) {
        int nextX = x + dx;
        int nextY = y + dy;
        // Keep within map borders
        if (nextX >= 1 && nextX < mapWidth - 1 && nextY >= 1 && nextY < mapHeight - 1) {
            x = nextX;
            y = nextY;
        }
    }

    bool shoot() {
        return gun.shoot();
    }

    void reload() {
        gun.reload();
    }

    void addKill(int points) {
        kills++;
        score += points;
        // Bonus ammo drop every 3 kills
        if (kills % 3 == 0) {
            gun.addReserveAmmo(6);
        }
    }

    int getScore() const { return score; }
    int getKills() const { return kills; }
    const Gun& getGun() const { return gun; }
};

// ============================================================================
// 4. INHERITANCE & POLYMORPHISM: Zombie Base Class & Specialized Types
// ============================================================================
class Zombie : public Entity {
protected:
    int health;
    int scoreValue;
    int moveFrequency; // How often this zombie takes a step (e.g. 2 = every 2 turns)

public:
    Zombie(int startX, int startY, char sym, int hp, int scoreVal, int freq = 2)
        : Entity(startX, startY, sym), health(hp), scoreValue(scoreVal), moveFrequency(freq) {}

    // Polymorphism: Derived zombies can override damage behavior
    void takeDamage(int amount) override {
        health -= amount;
        if (health <= 0) {
            alive = false;
        }
    }

    // AI Movement towards Player
    virtual void moveTowards(int targetX, int targetY) {
        int dx = (targetX > x) ? 1 : ((targetX < x) ? -1 : 0);
        int dy = (targetY > y) ? 1 : ((targetY < y) ? -1 : 0);

        // Move along the axis that is further away
        if (abs(targetX - x) > abs(targetY - y)) {
            x += dx;
        } else if (dy != 0) {
            y += dy;
        } else {
            x += dx;
        }
    }

    // Pure virtual method: Polymorphic description
    virtual string getType() const = 0;

    int getScoreValue() const { return scoreValue; }
    int getHealth() const { return health; }
    int getMoveFrequency() const { return moveFrequency; }
};

// --- Derived Zombie 1: Normal Walker ---
class NormalZombie : public Zombie {
public:
    NormalZombie(int startX, int startY) 
        : Zombie(startX, startY, 'Z', 25, 10, 2) {} // Moves every 2 turns (slower walker)

    void update() override {}
    string getType() const override { return "Normal Zombie"; }
};

// --- Derived Zombie 2: Fast Runner ---
class FastZombie : public Zombie {
public:
    FastZombie(int startX, int startY) 
        : Zombie(startX, startY, 'F', 20, 20, 1) {} // Moves every 1 turn (faster than walker)

    void update() override {}
    string getType() const override { return "Fast Zombie"; }
};

// --- Derived Zombie 3: Tank Juggernaut ---
class TankZombie : public Zombie {
public:
    TankZombie(int startX, int startY) 
        : Zombie(startX, startY, 'T', 75, 50, 3) {} // Moves every 3 turns (slow heavy brute)

    void update() override {}
    string getType() const override { return "Tank Zombie"; }
};

// ============================================================================
// 5. ABSTRACTION & ENGINE: GameEngine Class
// ============================================================================
class GameEngine {
private:
    const int MAP_WIDTH = 25;
    const int MAP_HEIGHT = 14;

    Player player;
    vector<Zombie*> zombies; // Polymorphic collection of zombies
    int turnCount;
    int spawnInterval;       // Decreases over time to increase spawn rate
    bool isRunning;
    string lastMessage;

public:
    GameEngine() 
        : player(MAP_WIDTH / 2, MAP_HEIGHT / 2), turnCount(1), spawnInterval(5), isRunning(true) {
        srand(static_cast<unsigned int>(time(nullptr)));
        lastMessage = "Survive! Do not let any zombie touch you.";
    }

    ~GameEngine() {
        cleanZombies();
    }

    void cleanZombies() {
        for (Zombie* z : zombies) {
            delete z;
        }
        zombies.clear();
    }

    void resetGame() {
        cleanZombies();
        player = Player(MAP_WIDTH / 2, MAP_HEIGHT / 2);
        turnCount = 1;
        spawnInterval = 5; // Balanced 5-turn spawn interval
        isRunning = true;
        lastMessage = "New game started! Good luck, survivor.";
        spawnZombie();
    }

    void spawnZombie() {
        // Spawn randomly at borders
        int side = rand() % 4;
        int sx = 1, sy = 1;
        if (side == 0) { sx = 1 + rand() % (MAP_WIDTH - 2); sy = 1; }
        else if (side == 1) { sx = 1 + rand() % (MAP_WIDTH - 2); sy = MAP_HEIGHT - 2; }
        else if (side == 2) { sx = 1; sy = 1 + rand() % (MAP_HEIGHT - 2); }
        else { sx = MAP_WIDTH - 2; sy = 1 + rand() % (MAP_HEIGHT - 2); }

        int roll = rand() % 10;
        Zombie* newZombie = nullptr;
        if (roll < 5) {
            newZombie = new NormalZombie(sx, sy);
        } else if (roll < 8) {
            newZombie = new FastZombie(sx, sy);
        } else {
            newZombie = new TankZombie(sx, sy);
        }
        zombies.push_back(newZombie);
    }

    void shootDirection(int dx, int dy) {
        if (!player.shoot()) {
            lastMessage = "CLICK! Out of ammo in clip! Press 'R' to reload.";
            return;
        }

        // Raycast bullet
        int range = player.getGun().getRange();
        int damage = player.getGun().getDamage();
        bool hit = false;

        for (int step = 1; step <= range; ++step) {
            int bx = player.getX() + (dx * step);
            int by = player.getY() + (dy * step);

            for (size_t i = 0; i < zombies.size(); ++i) {
                if (zombies[i]->isAlive() && zombies[i]->getX() == bx && zombies[i]->getY() == by) {
                    zombies[i]->takeDamage(damage);
                    hit = true;
                    if (!zombies[i]->isAlive()) {
                        lastMessage = "Killed " + zombies[i]->getType() + "! (+" + to_string(zombies[i]->getScoreValue()) + " pts)";
                        player.addKill(zombies[i]->getScoreValue());
                    } else {
                        lastMessage = "Hit " + zombies[i]->getType() + "! HP: " + to_string(zombies[i]->getHealth());
                    }
                    break;
                }
            }
            if (hit) break;
        }

        if (!hit) {
            lastMessage = "Shot fired, but missed!";
        }
    }

    void showManual() {
        cout << "\n=======================================================\n";
        cout << "                  SURVIVAL MANUAL                      \n";
        cout << "=======================================================\n";
        cout << "OBJECTIVE:\n";
        cout << "  Zombies are constantly moving toward you.\n";
        cout << "  If ANY zombie touches you, GAME OVER!\n";
        cout << "  Survive as long as possible and earn the highest score.\n\n";
        cout << "CONTROLS:\n";
        cout << "  W / A / S / D : Move Survivor (Up, Left, Down, Right)\n";
        cout << "  I / J / K / L : Shoot Gun (Up, Left, Down, Right)\n";
        cout << "  R             : Reload Gun\n";
        cout << "  H             : View this manual\n";
        cout << "  Q             : Quit Game\n\n";
        cout << "ZOMBIE TYPES:\n";
        cout << "  Z - Normal Zombie (Moves every 2 turns, 10 pts, 1 shot)\n";
        cout << "  F - Fast Runner   (Moves every turn, 20 pts, 1 shot)\n";
        cout << "  T - Tank Zombie   (Moves every 3 turns, 50 pts, 3 shots)\n";
        cout << "=======================================================\n";
        cout << "Press Enter to return to game...";
        cin.ignore(1000, '\n');
        cin.get();
    }

    void render() {
        // Clear screen
        cout << "\033[2J\033[1;1H";

        cout << "=======================================================\n";
        cout << "      ZOMBIE APOCALYPSE SURVIVAL (OOP CONSOLE)         \n";
        cout << "=======================================================\n";
        cout << "Score: " << player.getScore() << " | Kills: " << player.getKills()
             << " | Turn: " << turnCount << "\n";
        cout << "Gun: " << player.getGun().getName() 
             << " | Ammo: " << player.getGun().getAmmoInClip() << "/" << player.getGun().getClipCapacity()
             << " (Reserve: " << player.getGun().getTotalAmmo() << ")\n";
        cout << "-------------------------------------------------------\n";

        // Build grid
        vector<string> grid(MAP_HEIGHT, string(MAP_WIDTH, '.'));
        for (int y = 0; y < MAP_HEIGHT; ++y) {
            for (int x = 0; x < MAP_WIDTH; ++x) {
                if (x == 0 || x == MAP_WIDTH - 1 || y == 0 || y == MAP_HEIGHT - 1) {
                    grid[y][x] = '#';
                }
            }
        }

        // Place Zombies
        for (Zombie* z : zombies) {
            if (z->isAlive()) {
                grid[z->getY()][z->getX()] = z->getSymbol();
            }
        }

        // Place Player
        grid[player.getY()][player.getX()] = player.getSymbol();

        // Print Grid with Legend
        for (int y = 0; y < MAP_HEIGHT; ++y) {
            cout << "  " << grid[y];
            if (y == 2)  cout << "   LEGEND:";
            if (y == 3)  cout << "   P : Survivor (You)";
            if (y == 4)  cout << "   Z : Normal Zombie";
            if (y == 5)  cout << "   F : Fast Runner";
            if (y == 6)  cout << "   T : Tank Zombie";
            if (y == 7)  cout << "   # : Border Wall";
            cout << "\n";
        }

        cout << "-------------------------------------------------------\n";
        cout << "STATUS: " << lastMessage << "\n";
        cout << "CONTROLS: [WASD] Move | [IJKL] Shoot | [R] Reload | [H] Manual | [Q] Quit\n";
        cout << "Action: ";
    }

    void run() {
        resetGame();

        while (isRunning) {
            render();

            char cmd;
            if (!(cin >> cmd)) break;

            bool actionTaken = false;

            // Player Actions
            if (cmd == 'w' || cmd == 'W') { player.move(0, -1, MAP_WIDTH, MAP_HEIGHT); actionTaken = true; }
            else if (cmd == 's' || cmd == 'S') { player.move(0, 1, MAP_WIDTH, MAP_HEIGHT); actionTaken = true; }
            else if (cmd == 'a' || cmd == 'A') { player.move(-1, 0, MAP_WIDTH, MAP_HEIGHT); actionTaken = true; }
            else if (cmd == 'd' || cmd == 'D') { player.move(1, 0, MAP_WIDTH, MAP_HEIGHT); actionTaken = true; }
            else if (cmd == 'i' || cmd == 'I') { shootDirection(0, -1); actionTaken = true; }
            else if (cmd == 'k' || cmd == 'K') { shootDirection(0, 1); actionTaken = true; }
            else if (cmd == 'j' || cmd == 'J') { shootDirection(-1, 0); actionTaken = true; }
            else if (cmd == 'l' || cmd == 'L') { shootDirection(1, 0); actionTaken = true; }
            else if (cmd == 'r' || cmd == 'R') {
                player.reload();
                lastMessage = "Reloaded weapon!";
                actionTaken = true;
            }
            else if (cmd == 'h' || cmd == 'H') {
                showManual();
            }
            else if (cmd == 'q' || cmd == 'Q') {
                cout << "\nYou fled the infected zone. Game exited.\n";
                return;
            }

            // If a gameplay turn was taken:
            if (actionTaken) {
                turnCount++;

                // 1. Clean dead zombies
                for (auto it = zombies.begin(); it != zombies.end(); ) {
                    if (!(*it)->isAlive()) {
                        delete *it;
                        it = zombies.erase(it);
                    } else {
                        ++it;
                    }
                }

                // 2. Slower Zombies move toward player according to their individual move frequency
                for (Zombie* z : zombies) {
                    if (z->isAlive()) {
                        // Slower movement: only step when turn aligns with frequency
                        if (turnCount % z->getMoveFrequency() == 0) {
                            z->moveTowards(player.getX(), player.getY());
                        }

                        // Collision check: If any zombie touches player -> GAME OVER!
                        if (z->getX() == player.getX() && z->getY() == player.getY()) {
                            render();
                            cout << "\n=======================================================\n";
                            cout << "                   *** GAME OVER ***                   \n";
                            cout << "=======================================================\n";
                            cout << "  A " << z->getType() << " reached and infected you!\n\n";
                            cout << "  --- FINAL MISSION REPORT ---\n";
                            cout << "  Final Score         : " << player.getScore() << " PTS\n";
                            cout << "  Zombies Eliminated  : " << player.getKills() << "\n";
                            cout << "  Turns Survived      : " << turnCount << "\n";
                            cout << "=======================================================\n";
                            cout << "Would you like to retry? (Y/N): ";
                            char retry;
                            cin >> retry;
                            if (retry == 'y' || retry == 'Y') {
                                resetGame();
                            } else {
                                isRunning = false;
                            }
                            break;
                        }
                    }
                }

                // 3. Dynamic Respawn: Moderated spawn rate with gradual acceleration
                if (turnCount > 35 && spawnInterval > 3) spawnInterval = 3;
                else if (turnCount > 18 && spawnInterval > 4) spawnInterval = 4;

                if (turnCount % spawnInterval == 0) {
                    spawnZombie();
                }
            }
        }
    }
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
int main() {
    GameEngine game;
    bool inMenu = true;

    while (inMenu) {
        cout << "\033[2J\033[1;1H";
        cout << "=======================================================\n";
        cout << "      ZOMBIE APOCALYPSE SURVIVAL (OOP CONSOLE)         \n";
        cout << "=======================================================\n";
        cout << "Outbreak Status: CRITICAL INFECTION IN SECTOR 7\n";
        cout << "Do you want to play?\n\n";
        cout << "  [1] Start Survival Game\n";
        cout << "  [2] View Survival Manual (H)\n";
        cout << "  [3] Exit (Q)\n";
        cout << "-------------------------------------------------------\n";
        cout << "Select option (1-3): ";

        int choice;
        if (!(cin >> choice)) {
            cin.clear();
            string dummy;
            getline(cin, dummy);
            continue;
        }

        if (choice == 1) {
            game.run();
        } else if (choice == 2) {
            game.showManual();
        } else if (choice == 3) {
            inMenu = false;
            cout << "\nYou avoided the infected zone. Stay safe, survivor!\n";
        }
    }

    return 0;
}
