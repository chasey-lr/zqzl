import { GameStateManager, GRID } from './gameState.js';
import { AIController, DIFFICULTY_HARD } from './ai.js';
import { UIManager } from './ui.js';
import { GameEventBus, GameEvents } from './eventSystem.js';

class Game {
    constructor() {
        this.gameState = new GameStateManager();
        this.ai = new AIController(this.gameState);
        this.ui = new UIManager(this.gameState, this.ai);

        this._init();
    }

    _init() {
        this.gameState.subscribe(() => {
            this.ui.render();
        });

        GameEventBus.on(GameEvents.TURN_STARTED, (data) => {
            if (data.owner === GRID.OWNER_AI && !this.gameState.isGameOver()) {
                setTimeout(() => {
                    this.ai.executeTurn();
                }, 100);
            }
        });

        this.ai.setDifficulty(DIFFICULTY_HARD);
        this.ui.render();

        this.ui.addLog({ type: 'system', text: '🚀 游戏开始！玩家先手行动。' });
        GameEventBus.emit(GameEvents.TURN_STARTED, {
            owner: this.gameState.getCurrentPlayer(),
            turnNumber: this.gameState.getTurnNumber()
        });

        console.log('[星球殖民] 游戏初始化完成！');
        console.log('[星球殖民] 操作说明：');
        console.log('  - 点击己方殖民船选中单位');
        console.log('  - 绿色格子：可移动目标');
        console.log('  - 蓝色格子：可开发（当前位置）');
        console.log('  - 橙色边框：可建造新单位（消耗2产出）');
        console.log('  - 空格键：结束回合');
        console.log('  - R键：重置游戏');
        console.log('  - 方向键/WASD：选中后移动单位');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.__game = new Game();
});
