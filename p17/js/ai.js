import { GRID } from './gameState.js';
import { GameEventBus, GameEvents } from './eventSystem.js';

const DIFFICULTY_EASY = 'easy';
const DIFFICULTY_HARD = 'hard';
const EASY_RANDOM_CHANCE = 0.3;

class AIController {
    constructor(gameState) {
        this.gameState = gameState;
        this.difficulty = DIFFICULTY_HARD;
        this._thinking = false;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        GameEventBus.emit(GameEvents.DIFFICULTY_CHANGED, difficulty);
    }

    getDifficulty() {
        return this.difficulty;
    }

    isThinking() {
        return this._thinking;
    }

    async executeTurn() {
        if (this._thinking) return;
        this._thinking = true;

        await this._delay(600 + Math.random() * 400);

        let acted = true;
        let safety = 0;
        const maxActions = GRID.MAX_UNITS * 3;

        while (acted && safety < maxActions) {
            safety++;
            acted = this._executeOneAction();
            if (this.gameState.isGameOver()) break;
            await this._delay(500 + Math.random() * 300);
        }

        this._thinking = false;

        if (!this.gameState.isGameOver()) {
            GameEventBus.emit(GameEvents.TURN_ENDED, {
                owner: GRID.OWNER_AI,
                turnNumber: this.gameState.getTurnNumber()
            });
            this.gameState.endTurn();
            GameEventBus.emit(GameEvents.TURN_STARTED, {
                owner: this.gameState.getCurrentPlayer(),
                turnNumber: this.gameState.getTurnNumber()
            });
        }
    }

    _executeOneAction() {
        if (this.difficulty === DIFFICULTY_EASY && Math.random() < EASY_RANDOM_CHANCE) {
            return this._executeRandomAction();
        }
        return this._executeOptimalAction();
    }

    _executeRandomAction() {
        const aiUnits = this.gameState.getUnits(GRID.OWNER_AI)
            .filter(u => !u.hasActed);

        if (aiUnits.length === 0) return false;

        const unit = aiUnits[Math.floor(Math.random() * aiUnits.length)];
        const actionTypes = [];

        if (this.gameState.canDevelop(unit.id)) actionTypes.push('develop');
        if (this.gameState.canBuild(unit.id)) actionTypes.push('build');
        const movableTiles = this.gameState.getMovableTiles(unit.id);
        if (movableTiles.length > 0) actionTypes.push('move');

        if (actionTypes.length === 0) return false;

        const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];

        switch (action) {
            case 'develop':
                return this._performDevelop(unit.id);
            case 'build':
                return this._performBuild(unit.id);
            case 'move':
                const tile = movableTiles[Math.floor(Math.random() * movableTiles.length)];
                return this._performMove(unit.id, tile.x, tile.y);
            default:
                return false;
        }
    }

    _executeOptimalAction() {
        const scoredActions = this._scoreAllActions();
        if (scoredActions.length === 0) return false;

        scoredActions.sort((a, b) => b.score - a.score);
        const bestScore = scoredActions[0].score;
        const candidates = scoredActions.filter(a => a.score === bestScore);
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];

        switch (chosen.type) {
            case 'develop':
                return this._performDevelop(chosen.unitId);
            case 'build':
                return this._performBuild(chosen.unitId);
            case 'move':
                return this._performMove(chosen.unitId, chosen.x, chosen.y);
            default:
                return false;
        }
    }

    _scoreAllActions() {
        const actions = [];
        const aiUnits = this.gameState.getUnits(GRID.OWNER_AI)
            .filter(u => !u.hasActed);

        for (const unit of aiUnits) {
            if (this.gameState.canDevelop(unit.id)) {
                const score = this._scoreDevelop(unit.id);
                actions.push({ type: 'develop', unitId: unit.id, score });
            }
            if (this.gameState.canBuild(unit.id)) {
                const score = this._scoreBuild(unit.id);
                actions.push({ type: 'build', unitId: unit.id, score });
            }
            const movableTiles = this.gameState.getMovableTiles(unit.id);
            for (const tile of movableTiles) {
                const score = this._scoreMove(unit.id, tile.x, tile.y);
                actions.push({ type: 'move', unitId: unit.id, x: tile.x, y: tile.y, score });
            }
        }

        return actions;
    }

    _scoreDevelop(unitId) {
        const unit = this.gameState.getUnitById(unitId);
        if (!unit) return -Infinity;

        const tile = this.gameState.getTile(unit.x, unit.y);
        if (!tile) return -Infinity;

        const outputGain = 1;
        let score = outputGain * 10;

        if (tile.output === 0) score += 5;
        else if (tile.output === 1) score += 3;
        else if (tile.output === 2) score += 1;

        if (tile.output + 1 >= GRID.BUILD_COST) {
            score += 4;
        }

        const aiUnits = this.gameState.getUnits(GRID.OWNER_AI);
        const tilesWithUnits = new Set(aiUnits.map(u => `${u.x},${u.y}`));
        if (!tilesWithUnits.has(`${unit.x},${unit.y}`)) {
            score += 0;
        }

        return score;
    }

    _scoreBuild(unitId) {
        const unit = this.gameState.getUnitById(unitId);
        if (!unit) return -Infinity;

        const tile = this.gameState.getTile(unit.x, unit.y);
        if (!tile) return -Infinity;

        const aiUnitCount = this.gameState.countUnitsByOwner(GRID.OWNER_AI);
        const aiTileCount = this.gameState.countTilesByOwner(GRID.OWNER_AI);

        let score = 18;

        if (aiUnitCount === 1) score += 8;
        else if (aiUnitCount === 2) score += 4;

        if (aiTileCount >= 3) score += 3;

        if (tile.output >= GRID.MAX_OUTPUT - 1) score -= 2;

        if (aiUnitCount >= 2 && aiTileCount >= 3) score += 5;

        return score;
    }

    _scoreMove(unitId, toX, toY) {
        const unit = this.gameState.getUnitById(unitId);
        if (!unit) return -Infinity;

        const targetTile = this.gameState.getTile(toX, toY);
        if (!targetTile) return -Infinity;

        let score = 2;

        if (targetTile.owner === GRID.OWNER_NONE) {
            score += 5;
        } else if (targetTile.owner === GRID.OWNER_PLAYER) {
            score += 8;
        } else {
            score += 0;
        }

        const playerUnits = this.gameState.getUnits(GRID.OWNER_PLAYER);
        if (playerUnits.length > 0) {
            let minDistance = Infinity;
            for (const pu of playerUnits) {
                const d = this.gameState.getDistance(toX, toY, pu.x, pu.y);
                if (d < minDistance) minDistance = d;
            }
            score += Math.max(0, (10 - minDistance));

            const curDistance = this.gameState.getDistance(unit.x, unit.y,
                playerUnits[0].x, playerUnits[0].y);
            if (minDistance < curDistance) {
                score += 3;
            }
        }

        const tiles = this.gameState.getTiles();
        const adjacent = this.gameState.getAdjacentTiles(toX, toY);
        let highOutputAdjacent = 0;
        for (const adj of adjacent) {
            const t = tiles[adj.y][adj.x];
            if (t && t.owner === GRID.OWNER_AI && t.output >= 2) {
                highOutputAdjacent++;
            }
        }
        score += highOutputAdjacent * 2;

        const aiTiles = this.gameState.countTilesByOwner(GRID.OWNER_AI);
        if (aiTiles < 4) {
            score += 4;
        }

        return score;
    }

    _performDevelop(unitId) {
        const result = this.gameState.developTile(unitId);
        if (result) {
            GameEventBus.emit(GameEvents.UNIT_DEVELOPED, result);
            GameEventBus.emit(GameEvents.ACTION_EXECUTED, result);
            GameEventBus.emit(GameEvents.LOG_MESSAGE, {
                type: 'ai-action',
                text: `AI 在(${result.x},${result.y})开发，产出+1 → ${result.output}`
            });
            return true;
        }
        return false;
    }

    _performBuild(unitId) {
        const result = this.gameState.buildUnit(unitId);
        if (result) {
            GameEventBus.emit(GameEvents.UNIT_BUILT, result);
            GameEventBus.emit(GameEvents.ACTION_EXECUTED, result);
            GameEventBus.emit(GameEvents.LOG_MESSAGE, {
                type: 'ai-action',
                text: `AI 在(${result.x},${result.y})建造了新殖民船！`
            });
            return true;
        }
        return false;
    }

    _performMove(unitId, toX, toY) {
        const result = this.gameState.moveUnit(unitId, toX, toY);
        if (result) {
            GameEventBus.emit(GameEvents.UNIT_MOVED, result);
            GameEventBus.emit(GameEvents.ACTION_EXECUTED, result);
            GameEventBus.emit(GameEvents.LOG_MESSAGE, {
                type: 'ai-action',
                text: `AI 将殖民船从(${result.from.x},${result.from.y})移动到(${result.to.x},${result.to.y})`
            });
            return true;
        }
        return false;
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export { AIController, DIFFICULTY_EASY, DIFFICULTY_HARD };
