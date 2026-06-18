const GRID_SIZE = 6;
const MAX_UNITS = 3;
const MAX_OUTPUT = 3;
const BUILD_COST = 2;
const OWNER_NONE = 'none';
const OWNER_PLAYER = 'player';
const OWNER_AI = 'ai';

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function createInitialTiles() {
    const tiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            row.push({
                x,
                y,
                owner: OWNER_NONE,
                output: 0,
                unit: null
            });
        }
        tiles.push(row);
    }
    return tiles;
}

function createInitialUnits() {
    return {
        player: [{ id: 'p_0', x: 0, y: GRID_SIZE - 1, hasActed: false }],
        ai: [{ id: 'a_0', x: GRID_SIZE - 1, y: 0, hasActed: false }]
    };
}

function createInitialState() {
    const state = {
        tiles: createInitialTiles(),
        units: createInitialUnits(),
        currentPlayer: OWNER_PLAYER,
        turnNumber: 1,
        selectedUnit: null,
        gameOver: false,
        winner: null,
        history: []
    };

    const playerUnit = state.units.player[0];
    state.tiles[playerUnit.y][playerUnit.x].owner = OWNER_PLAYER;
    state.tiles[playerUnit.y][playerUnit.x].unit = playerUnit.id;

    const aiUnit = state.units.ai[0];
    state.tiles[aiUnit.y][aiUnit.x].owner = OWNER_AI;
    state.tiles[aiUnit.y][aiUnit.x].unit = aiUnit.id;

    return state;
}

class GameState {
    constructor() {
        this._state = createInitialState();
        this._listeners = [];
    }

    getSnapshot() {
        return deepClone(this._state);
    }

    saveToHistory() {
        this._state.history.push(this.getSnapshot());
    }

    undo() {
        if (this._state.history.length > 0) {
            this._state = this._state.history.pop();
            this._notifyListeners();
            return true;
        }
        return false;
    }

    subscribe(listener) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }

    _notifyListeners() {
        const snapshot = this.getSnapshot();
        this._listeners.forEach(l => l(snapshot));
    }

    getState() {
        return this.getSnapshot();
    }

    getTiles() {
        return deepClone(this._state.tiles);
    }

    getTile(x, y) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return null;
        }
        return deepClone(this._state.tiles[y][x]);
    }

    getUnits(owner) {
        if (owner) {
            return deepClone(this._state.units[owner] || []);
        }
        return deepClone(this._state.units);
    }

    getUnitById(unitId) {
        for (const owner of [OWNER_PLAYER, OWNER_AI]) {
            const unit = this._state.units[owner].find(u => u.id === unitId);
            if (unit) return deepClone(unit);
        }
        return null;
    }

    getUnitOwner(unitId) {
        for (const owner of [OWNER_PLAYER, OWNER_AI]) {
            if (this._state.units[owner].some(u => u.id === unitId)) {
                return owner;
            }
        }
        return null;
    }

    getCurrentPlayer() {
        return this._state.currentPlayer;
    }

    getTurnNumber() {
        return this._state.turnNumber;
    }

    getSelectedUnit() {
        return this._state.selectedUnit ? deepClone(this._state.selectedUnit) : null;
    }

    setSelectedUnit(unitId) {
        this._state.selectedUnit = unitId;
        this._notifyListeners();
    }

    clearSelectedUnit() {
        this._state.selectedUnit = null;
        this._notifyListeners();
    }

    isGameOver() {
        return this._state.gameOver;
    }

    getWinner() {
        return this._state.winner;
    }

    getAdjacentTiles(x, y) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        const result = [];
        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                result.push({ x: nx, y: ny });
            }
        }
        return result;
    }

    getMovableTiles(unitId) {
        const unit = this.getUnitById(unitId);
        if (!unit || unit.hasActed) return [];

        const owner = this.getUnitOwner(unitId);
        if (owner !== this._state.currentPlayer) return [];

        const adjacent = this.getAdjacentTiles(unit.x, unit.y);
        return adjacent.filter(pos => {
            const tile = this._state.tiles[pos.y][pos.x];
            return !tile.unit;
        });
    }

    canDevelop(unitId) {
        const unit = this.getUnitById(unitId);
        if (!unit || unit.hasActed) return false;

        const owner = this.getUnitOwner(unitId);
        if (owner !== this._state.currentPlayer) return false;

        const tile = this._state.tiles[unit.y][unit.x];
        return tile.owner === owner && tile.output < MAX_OUTPUT;
    }

    canBuild(unitId) {
        const unit = this.getUnitById(unitId);
        if (!unit || unit.hasActed) return false;

        const owner = this.getUnitOwner(unitId);
        if (owner !== this._state.currentPlayer) return false;

        if (this._state.units[owner].length >= MAX_UNITS) return false;

        const tile = this._state.tiles[unit.y][unit.x];
        return tile.owner === owner && tile.output >= BUILD_COST;
    }

    moveUnit(unitId, toX, toY) {
        this.saveToHistory();

        const owner = this.getUnitOwner(unitId);
        const unit = this._state.units[owner].find(u => u.id === unitId);
        if (!unit) return false;

        if (unit.hasActed) return false;
        if (owner !== this._state.currentPlayer) return false;

        const movable = this.getMovableTiles(unitId);
        if (!movable.some(t => t.x === toX && t.y === toY)) return false;

        this._state.tiles[unit.y][unit.x].unit = null;

        unit.x = toX;
        unit.y = toY;
        unit.hasActed = true;

        this._state.tiles[toY][toX].unit = unitId;
        this._state.tiles[toY][toX].owner = owner;

        this._state.selectedUnit = null;

        this._checkVictory();
        this._notifyListeners();

        return {
            action: 'move',
            owner,
            unitId,
            from: { x: unit.x, y: unit.y },
            to: { x: toX, y: toY }
        };
    }

    developTile(unitId) {
        this.saveToHistory();

        const owner = this.getUnitOwner(unitId);
        const unit = this._state.units[owner].find(u => u.id === unitId);
        if (!unit) return false;

        if (!this.canDevelop(unitId)) return false;

        const tile = this._state.tiles[unit.y][unit.x];
        tile.output += 1;
        unit.hasActed = true;

        this._state.selectedUnit = null;

        this._checkVictory();
        this._notifyListeners();

        return {
            action: 'develop',
            owner,
            unitId,
            x: unit.x,
            y: unit.y,
            output: tile.output
        };
    }

    buildUnit(unitId) {
        this.saveToHistory();

        const owner = this.getUnitOwner(unitId);
        const unit = this._state.units[owner].find(u => u.id === unitId);
        if (!unit) return false;

        if (!this.canBuild(unitId)) return false;

        const tile = this._state.tiles[unit.y][unit.x];
        tile.output -= BUILD_COST;

        const unitCount = this._state.units[owner].length;
        const prefix = owner === OWNER_PLAYER ? 'p' : 'a';
        const newUnit = {
            id: `${prefix}_${unitCount}`,
            x: unit.x,
            y: unit.y,
            hasActed: true
        };

        this._state.units[owner].push(newUnit);
        unit.hasActed = true;

        this._state.selectedUnit = null;

        this._checkVictory();
        this._notifyListeners();

        return {
            action: 'build',
            owner,
            unitId,
            x: unit.x,
            y: unit.y,
            newUnitId: newUnit.id
        };
    }

    _eliminateDefeatedUnits() {
        for (const owner of [OWNER_PLAYER, OWNER_AI]) {
            const enemyOwner = owner === OWNER_PLAYER ? OWNER_AI : OWNER_PLAYER;
            const survivingUnits = [];

            for (const unit of this._state.units[owner]) {
                const adjacent = this.getAdjacentTiles(unit.x, unit.y);
                const hasEnemyAdjacent = adjacent.some(pos => {
                    const t = this._state.tiles[pos.y][pos.x];
                    return t.owner === enemyOwner;
                });

                const tile = this._state.tiles[unit.y][unit.x];
                const isOnEnemyTile = tile.owner === enemyOwner;
                const tileSurroundedByEnemy = isOnEnemyTile && hasEnemyAdjacent;

                if (!tileSurroundedByEnemy) {
                    survivingUnits.push(unit);
                } else {
                    this._state.tiles[unit.y][unit.x].unit = null;
                }
            }

            this._state.units[owner] = survivingUnits;
        }
    }

    endTurn() {
        this.saveToHistory();

        this._state.selectedUnit = null;

        for (const owner of [OWNER_PLAYER, OWNER_AI]) {
            for (const unit of this._state.units[owner]) {
                unit.hasActed = false;
            }
        }

        if (this._state.currentPlayer === OWNER_PLAYER) {
            this._state.currentPlayer = OWNER_AI;
        } else {
            this._state.currentPlayer = OWNER_PLAYER;
            this._state.turnNumber += 1;
        }

        this._eliminateDefeatedUnits();
        this._checkVictory();
        this._notifyListeners();
    }

    reset() {
        this._state = createInitialState();
        this._notifyListeners();
    }

    _checkVictory() {
        if (this._state.gameOver) return;

        const playerUnits = this._state.units[OWNER_PLAYER].length;
        const aiUnits = this._state.units[OWNER_AI].length;

        if (playerUnits === 0) {
            this._state.gameOver = true;
            this._state.winner = OWNER_AI;
            return;
        }
        if (aiUnits === 0) {
            this._state.gameOver = true;
            this._state.winner = OWNER_PLAYER;
            return;
        }

        let playerTiles = 0;
        let aiTiles = 0;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this._state.tiles[y][x];
                if (tile.owner === OWNER_PLAYER) playerTiles++;
                else if (tile.owner === OWNER_AI) aiTiles++;
            }
        }

        if (playerUnits >= 3 && playerTiles >= 4) {
            this._state.gameOver = true;
            this._state.winner = OWNER_PLAYER;
            return;
        }
        if (aiUnits >= 3 && aiTiles >= 4) {
            this._state.gameOver = true;
            this._state.winner = OWNER_AI;
            return;
        }
    }

    countTilesByOwner(owner) {
        let count = 0;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this._state.tiles[y][x].owner === owner) count++;
            }
        }
        return count;
    }

    countUnitsByOwner(owner) {
        return this._state.units[owner].length;
    }

    getUnitActable(owner) {
        const ownerUnits = this._state.units[owner];
        return ownerUnits.some(u => !u.hasActed);
    }

    getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
}

export const GameStateManager = GameState;
export const GRID = {
    SIZE: GRID_SIZE,
    MAX_UNITS,
    MAX_OUTPUT,
    BUILD_COST,
    OWNER_NONE,
    OWNER_PLAYER,
    OWNER_AI
};
