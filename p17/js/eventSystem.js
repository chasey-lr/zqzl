class EventEmitter {
    constructor() {
        this._events = new Map();
        this._maxListeners = 100;
    }

    on(eventName, listener) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        const listeners = this._events.get(eventName);
        if (listeners.length >= this._maxListeners) {
            console.warn(`EventEmitter: 事件 "${eventName}" 的监听器数量已达上限 (${this._maxListeners})`);
        }
        listeners.push(listener);
        return () => this.off(eventName, listener);
    }

    once(eventName, listener) {
        const onceWrapper = (...args) => {
            this.off(eventName, onceWrapper);
            return listener(...args);
        };
        return this.on(eventName, onceWrapper);
    }

    off(eventName, listener) {
        if (!this._events.has(eventName)) return;
        const listeners = this._events.get(eventName);
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
            this._events.delete(eventName);
        }
    }

    emit(eventName, ...args) {
        if (!this._events.has(eventName)) return false;
        const listeners = this._events.get(eventName).slice();
        for (const listener of listeners) {
            try {
                listener(...args);
            } catch (err) {
                console.error(`EventEmitter: 事件 "${eventName}" 的监听器抛出异常:`, err);
            }
        }
        return true;
    }

    listenerCount(eventName) {
        if (!this._events.has(eventName)) return 0;
        return this._events.get(eventName).length;
    }

    removeAllListeners(eventName) {
        if (eventName === undefined) {
            this._events.clear();
        } else {
            this._events.delete(eventName);
        }
    }

    setMaxListeners(n) {
        this._maxListeners = n;
    }
}

export const GameEvents = {
    STATE_CHANGED: 'state:changed',
    UNIT_SELECTED: 'unit:selected',
    UNIT_DESELECTED: 'unit:deselected',
    UNIT_MOVED: 'unit:moved',
    UNIT_DEVELOPED: 'unit:developed',
    UNIT_BUILT: 'unit:built',
    TURN_STARTED: 'turn:started',
    TURN_ENDED: 'turn:ended',
    PLAYER_TURN: 'turn:player',
    AI_TURN: 'turn:ai',
    ACTION_EXECUTED: 'action:executed',
    LOG_MESSAGE: 'log:message',
    VICTORY: 'game:victory',
    GAME_RESET: 'game:reset',
    DIFFICULTY_CHANGED: 'difficulty:changed',
    TILE_HOVER: 'tile:hover',
    TILE_LEAVE: 'tile:leave',
    TILE_CLICK: 'tile:click'
};

export const GameEventBus = new EventEmitter();
