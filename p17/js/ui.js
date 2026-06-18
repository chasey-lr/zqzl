import { GRID } from './gameState.js';
import { GameEventBus, GameEvents } from './eventSystem.js';

class UIManager {
    constructor(gameState, aiController) {
        this.gameState = gameState;
        this.ai = aiController;
        this._elements = {};
        this._modalCallback = null;
        this._initElements();
        this._bindEvents();
    }

    _initElements() {
        this._elements = {
            map: document.getElementById('game-map'),
            playerUnits: document.getElementById('player-units'),
            playerTiles: document.getElementById('player-tiles'),
            aiUnits: document.getElementById('ai-units'),
            aiTiles: document.getElementById('ai-tiles'),
            turnNumber: document.getElementById('turn-number'),
            currentPlayer: document.getElementById('current-player'),
            btnDevelop: document.getElementById('btn-develop'),
            btnBuild: document.getElementById('btn-build'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            difficultySelect: document.getElementById('difficulty-select'),
            gameLog: document.getElementById('game-log'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalConfirm: document.getElementById('modal-confirm'),
            modalCancel: document.getElementById('modal-cancel'),
            tooltip: document.getElementById('tile-tooltip'),
            tooltipOwner: document.getElementById('tooltip-owner'),
            tooltipOutput: document.getElementById('tooltip-output'),
            tooltipUnit: document.getElementById('tooltip-unit')
        };
    }

    _bindEvents() {
        this._elements.btnDevelop.addEventListener('click', () => {
            this._handleDevelop();
        });

        this._elements.btnBuild.addEventListener('click', () => {
            this._handleBuild();
        });

        this._elements.btnEndTurn.addEventListener('click', () => {
            this._handleEndTurn();
        });

        this._elements.difficultySelect.addEventListener('change', (e) => {
            this.ai.setDifficulty(e.target.value);
            this.addLog({
                type: 'system',
                text: `AI难度切换为：${e.target.value === 'easy' ? '简单' : '困难'}`
            });
        });

        this._elements.modalConfirm.addEventListener('click', () => {
            this._closeModal();
            if (this._modalCallback) {
                const cb = this._modalCallback;
                this._modalCallback = null;
                cb(true);
            }
        });

        this._elements.modalCancel.addEventListener('click', () => {
            this._closeModal();
            if (this._modalCallback) {
                const cb = this._modalCallback;
                this._modalCallback = null;
                cb(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this._isModalOpen()) return;

            if (e.code === 'Space') {
                e.preventDefault();
                this._handleEndTurn();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.confirmReset();
            } else if (this.gameState.getCurrentPlayer() === GRID.OWNER_PLAYER &&
                       !this.gameState.isGameOver() &&
                       !this.ai.isThinking()) {
                this._handleKeyboardMove(e);
            }
        });

        GameEventBus.on(GameEvents.LOG_MESSAGE, (data) => {
            this.addLog(data);
        });

        GameEventBus.on(GameEvents.VICTORY, (data) => {
            this._showVictoryModal(data.winner);
        });

        GameEventBus.on(GameEvents.TURN_STARTED, (data) => {
            if (data.owner === GRID.OWNER_AI) {
                this.addLog({ type: 'system', text: `— AI回合开始 —` });
            } else {
                this.addLog({ type: 'system', text: `— 第${data.turnNumber}回合 / 玩家行动 —` });
            }
        });
    }

    _handleKeyboardMove(e) {
        const selectedId = this.gameState.getSelectedUnit();
        if (!selectedId) return;

        const unit = this.gameState.getUnitById(selectedId);
        if (!unit || unit.hasActed) return;

        const dirMap = {
            'ArrowUp': { dx: 0, dy: -1 },
            'ArrowDown': { dx: 0, dy: 1 },
            'ArrowLeft': { dx: -1, dy: 0 },
            'ArrowRight': { dx: 1, dy: 0 },
            'KeyW': { dx: 0, dy: -1 },
            'KeyS': { dx: 0, dy: 1 },
            'KeyA': { dx: -1, dy: 0 },
            'KeyD': { dx: 1, dy: 0 }
        };

        const dir = dirMap[e.code];
        if (!dir) return;

        e.preventDefault();
        const targetX = unit.x + dir.dx;
        const targetY = unit.y + dir.dy;

        const movable = this.gameState.getMovableTiles(selectedId);
        if (movable.some(t => t.x === targetX && t.y === targetY)) {
            this._performMove(selectedId, targetX, targetY);
        }
    }

    _handleDevelop() {
        const selectedId = this.gameState.getSelectedUnit();
        if (!selectedId) return;
        if (!this.gameState.canDevelop(selectedId)) return;

        const result = this.gameState.developTile(selectedId);
        if (result) {
            GameEventBus.emit(GameEvents.UNIT_DEVELOPED, result);
            GameEventBus.emit(GameEvents.ACTION_EXECUTED, result);
            GameEventBus.emit(GameEvents.LOG_MESSAGE, {
                type: 'player-action',
                text: `玩家在(${result.x},${result.y})开发，产出+1 → ${result.output}`
            });
            this._checkVictory();
        }
    }

    _handleBuild() {
        const selectedId = this.gameState.getSelectedUnit();
        if (!selectedId) return;
        if (!this.gameState.canBuild(selectedId)) return;

        const result = this.gameState.buildUnit(selectedId);
        if (result) {
            GameEventBus.emit(GameEvents.UNIT_BUILT, result);
            GameEventBus.emit(GameEvents.ACTION_EXECUTED, result);
            GameEventBus.emit(GameEvents.LOG_MESSAGE, {
                type: 'player-action',
                text: `玩家在(${result.x},${result.y})建造了新殖民船！`
            });
            this._checkVictory();
        }
    }

    _handleEndTurn() {
        if (this.gameState.isGameOver()) return;
        if (this.ai.isThinking()) return;
        if (this.gameState.getCurrentPlayer() !== GRID.OWNER_PLAYER) return;

        GameEventBus.emit(GameEvents.TURN_ENDED, {
            owner: GRID.OWNER_PLAYER,
            turnNumber: this.gameState.getTurnNumber()
        });
        this.gameState.endTurn();
        GameEventBus.emit(GameEvents.TURN_STARTED, {
            owner: this.gameState.getCurrentPlayer(),
            turnNumber: this.gameState.getTurnNumber()
        });
    }

    _performMove(unitId, toX, toY) {
        const result = this.gameState.moveUnit(unitId, toX, toY);
        if (result) {
            GameEventBus.emit(GameEvents.UNIT_MOVED, result);
            GameEventBus.emit(GameEvents.ACTION_EXECUTED, result);
            GameEventBus.emit(GameEvents.LOG_MESSAGE, {
                type: 'player-action',
                text: `玩家将殖民船从(${result.from.x},${result.from.y})移动到(${result.to.x},${result.to.y})`
            });
            this._checkVictory();
        }
    }

    _checkVictory() {
        if (this.gameState.isGameOver()) {
            const winner = this.gameState.getWinner();
            GameEventBus.emit(GameEvents.VICTORY, { winner });
            this.addLog({
                type: 'victory',
                text: `🎉 ${winner === GRID.OWNER_PLAYER ? '玩家' : 'AI'}获得胜利！`
            });
        }
    }

    render() {
        this._renderInfo();
        this._renderMap();
        this._renderButtons();
    }

    _renderInfo() {
        this._elements.playerUnits.textContent = this.gameState.countUnitsByOwner(GRID.OWNER_PLAYER);
        this._elements.playerTiles.textContent = this.gameState.countTilesByOwner(GRID.OWNER_PLAYER);
        this._elements.aiUnits.textContent = this.gameState.countUnitsByOwner(GRID.OWNER_AI);
        this._elements.aiTiles.textContent = this.gameState.countTilesByOwner(GRID.OWNER_AI);
        this._elements.turnNumber.textContent = this.gameState.getTurnNumber();

        const cp = this.gameState.getCurrentPlayer();
        this._elements.currentPlayer.textContent = cp === GRID.OWNER_PLAYER ? '玩家' : 'AI';
        this._elements.currentPlayer.style.color = cp === GRID.OWNER_PLAYER ? '#00aaff' : '#ffaa00';
    }

    _renderMap() {
        const tiles = this.gameState.getTiles();
        const units = this.gameState.getUnits();
        const selectedId = this.gameState.getSelectedUnit();

        const isPlayerTurn = this.gameState.getCurrentPlayer() === GRID.OWNER_PLAYER;
        const canInteract = isPlayerTurn && !this.ai.isThinking() && !this.gameState.isGameOver();

        let movableSet = new Set();
        let developableSet = new Set();
        let buildableSet = new Set();

        if (selectedId && canInteract) {
            const movable = this.gameState.getMovableTiles(selectedId);
            movable.forEach(t => movableSet.add(`${t.x},${t.y}`));

            if (this.gameState.canDevelop(selectedId)) {
                const unit = this.gameState.getUnitById(selectedId);
                developableSet.add(`${unit.x},${unit.y}`);
            }

            if (this.gameState.canBuild(selectedId)) {
                const unit = this.gameState.getUnitById(selectedId);
                buildableSet.add(`${unit.x},${unit.y}`);
            }
        }

        this._elements.map.innerHTML = '';

        for (let y = 0; y < GRID.SIZE; y++) {
            for (let x = 0; x < GRID.SIZE; x++) {
                const tile = tiles[y][x];
                const key = `${x},${y}`;
                const tileEl = document.createElement('div');
                tileEl.className = 'tile';
                tileEl.dataset.x = x;
                tileEl.dataset.y = y;

                if (tile.owner === GRID.OWNER_PLAYER) {
                    tileEl.classList.add('owned-player');
                    tileEl.classList.add('tile-owned-player');
                } else if (tile.owner === GRID.OWNER_AI) {
                    tileEl.classList.add('owned-ai');
                    tileEl.classList.add('tile-owned-ai');
                }

                const unitOnTile = tile.unit;
                if (unitOnTile) {
                    let owner = null;
                    let unitObj = null;
                    if (units.player.some(u => u.id === unitOnTile)) {
                        owner = GRID.OWNER_PLAYER;
                        unitObj = units.player.find(u => u.id === unitOnTile);
                    } else if (units.ai.some(u => u.id === unitOnTile)) {
                        owner = GRID.OWNER_AI;
                        unitObj = units.ai.find(u => u.id === unitOnTile);
                    }

                    if (unitObj && owner) {
                        const unitEl = document.createElement('div');
                        unitEl.className = `unit ${owner}`;
                        unitEl.textContent = owner === GRID.OWNER_PLAYER ? '🚀' : '👾';
                        if (unitObj.hasActed) {
                            unitEl.style.opacity = '0.5';
                            unitEl.style.filter = 'grayscale(0.6)';
                        }
                        if (unitOnTile === selectedId) {
                            tileEl.classList.add('selected');
                            unitEl.classList.add('acting');
                        }
                        if (owner === GRID.OWNER_AI && this.ai.isThinking() && !unitObj.hasActed) {
                            unitEl.classList.add('acting');
                        }
                        tileEl.appendChild(unitEl);
                    }
                }

                if (canInteract && tile.owner === GRID.OWNER_PLAYER && unitOnTile) {
                    const myUnit = units.player.find(u => u.id === unitOnTile);
                    if (myUnit && !myUnit.hasActed && unitOnTile !== selectedId) {
                    }
                }

                if (movableSet.has(key)) tileEl.classList.add('movable');
                if (developableSet.has(key)) tileEl.classList.add('developable');
                if (buildableSet.has(key)) tileEl.classList.add('buildable');

                const outputBar = document.createElement('div');
                outputBar.className = 'output-bar';
                for (let i = 0; i < GRID.MAX_OUTPUT; i++) {
                    const seg = document.createElement('div');
                    seg.className = 'output-segment';
                    if (i < tile.output) seg.classList.add('filled');
                    outputBar.appendChild(seg);
                }
                tileEl.appendChild(outputBar);

                const coord = document.createElement('div');
                coord.className = 'tile-coord';
                coord.textContent = `${x},${y}`;
                tileEl.appendChild(coord);

                tileEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleTileClick(x, y, canInteract, units.player);
                });

                tileEl.addEventListener('mouseenter', (e) => {
                    this._showTooltip(e.clientX, e.clientY, tile, unitOnTile, units);
                    GameEventBus.emit(GameEvents.TILE_HOVER, { x, y });
                });

                tileEl.addEventListener('mousemove', (e) => {
                    this._moveTooltip(e.clientX, e.clientY);
                });

                tileEl.addEventListener('mouseleave', () => {
                    this._hideTooltip();
                    GameEventBus.emit(GameEvents.TILE_LEAVE, { x, y });
                });

                this._elements.map.appendChild(tileEl);
            }
        }
    }

    _handleTileClick(x, y, canInteract, playerUnits) {
        if (!canInteract) return;

        const selectedId = this.gameState.getSelectedUnit();
        const tile = this.gameState.getTile(x, y);

        if (selectedId) {
            const movable = this.gameState.getMovableTiles(selectedId);
            if (movable.some(t => t.x === x && t.y === y)) {
                this._performMove(selectedId, x, y);
                return;
            }

            if (tile.unit) {
                const clickedPlayerUnit = playerUnits.find(u => u.id === tile.unit);
                if (clickedPlayerUnit && !clickedPlayerUnit.hasActed) {
                    if (clickedPlayerUnit.id === selectedId) {
                        this.gameState.clearSelectedUnit();
                        GameEventBus.emit(GameEvents.UNIT_DESELECTED, selectedId);
                    } else {
                        this.gameState.setSelectedUnit(clickedPlayerUnit.id);
                        GameEventBus.emit(GameEvents.UNIT_SELECTED, clickedPlayerUnit);
                    }
                    return;
                }
            }

            this.gameState.clearSelectedUnit();
            GameEventBus.emit(GameEvents.UNIT_DESELECTED, selectedId);
        } else {
            if (tile.unit) {
                const clickedPlayerUnit = playerUnits.find(u => u.id === tile.unit);
                if (clickedPlayerUnit && !clickedPlayerUnit.hasActed) {
                    this.gameState.setSelectedUnit(clickedPlayerUnit.id);
                    GameEventBus.emit(GameEvents.UNIT_SELECTED, clickedPlayerUnit);
                }
            }
        }
    }

    _renderButtons() {
        const selectedId = this.gameState.getSelectedUnit();
        const isPlayerTurn = this.gameState.getCurrentPlayer() === GRID.OWNER_PLAYER;
        const canInteract = isPlayerTurn && !this.ai.isThinking() && !this.gameState.isGameOver();

        if (selectedId && canInteract) {
            this._elements.btnDevelop.disabled = !this.gameState.canDevelop(selectedId);
            this._elements.btnBuild.disabled = !this.gameState.canBuild(selectedId);
        } else {
            this._elements.btnDevelop.disabled = true;
            this._elements.btnBuild.disabled = true;
        }

        this._elements.btnEndTurn.disabled = !canInteract;

        this._elements.difficultySelect.disabled = this.ai.isThinking();
    }

    addLog({ type, text }) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = text;
        this._elements.gameLog.appendChild(entry);
        this._elements.gameLog.scrollTop = this._elements.gameLog.scrollHeight;
    }

    showModal(title, message, showCancel = false, callback = null) {
        this._elements.modalTitle.textContent = title;
        this._elements.modalMessage.textContent = message;
        this._elements.modalCancel.classList.toggle('hidden', !showCancel);
        this._modalCallback = callback;
        this._elements.modalOverlay.classList.remove('hidden');
    }

    _closeModal() {
        this._elements.modalOverlay.classList.add('hidden');
    }

    _isModalOpen() {
        return !this._elements.modalOverlay.classList.contains('hidden');
    }

    _showVictoryModal(winner) {
        const isPlayer = winner === GRID.OWNER_PLAYER;
        const title = isPlayer ? '🏆 胜利！' : '💀 失败...';
        const message = isPlayer
            ? `恭喜你成功殖民星球！\n在第${this.gameState.getTurnNumber()}回合取得了胜利。`
            : `AI成功统治了星球！\n再接再厉，下次一定能赢！`;

        this.showModal(title, message, false, () => {
            this._resetGame();
        });

        this._elements.modalConfirm.textContent = '🔄 重新开始';
    }

    confirmReset() {
        this.showModal('确认重置', '确定要重新开始游戏吗？当前进度将丢失。', true, (confirmed) => {
            if (confirmed) {
                this._resetGame();
            }
            this._elements.modalConfirm.textContent = '确定';
        });
        this._elements.modalConfirm.textContent = '重新开始';
    }

    _resetGame() {
        this.gameState.reset();
        GameEventBus.emit(GameEvents.GAME_RESET);
        this._elements.gameLog.innerHTML = '';
        this.addLog({ type: 'system', text: '🚀 游戏开始！玩家先手行动。' });
        GameEventBus.emit(GameEvents.TURN_STARTED, {
            owner: this.gameState.getCurrentPlayer(),
            turnNumber: this.gameState.getTurnNumber()
        });
    }

    _showTooltip(clientX, clientY, tile, unitId, allUnits) {
        const ownerMap = {
            [GRID.OWNER_PLAYER]: '玩家',
            [GRID.OWNER_AI]: 'AI',
            [GRID.OWNER_NONE]: '无主'
        };

        this._elements.tooltipOwner.textContent = `归属：${ownerMap[tile.owner]}`;
        this._elements.tooltipOutput.textContent = `产出：${tile.output} / ${GRID.MAX_OUTPUT}`;

        if (unitId) {
            let unitOwner = '无';
            if (allUnits.player.some(u => u.id === unitId)) {
                unitOwner = '玩家殖民船';
            } else if (allUnits.ai.some(u => u.id === unitId)) {
                unitOwner = 'AI殖民船';
            }
            this._elements.tooltipUnit.textContent = `单位：${unitOwner}`;
        } else {
            this._elements.tooltipUnit.textContent = `单位：无`;
        }

        this._moveTooltip(clientX, clientY);
        this._elements.tooltip.classList.remove('hidden');
    }

    _moveTooltip(clientX, clientY) {
        const tooltipEl = this._elements.tooltip;
        const padding = 15;
        const rect = tooltipEl.getBoundingClientRect();
        let x = clientX + padding;
        let y = clientY + padding;

        if (x + rect.width > window.innerWidth) {
            x = clientX - rect.width - padding;
        }
        if (y + rect.height > window.innerHeight) {
            y = clientY - rect.height - padding;
        }

        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
    }

    _hideTooltip() {
        this._elements.tooltip.classList.add('hidden');
    }
}

export { UIManager };
