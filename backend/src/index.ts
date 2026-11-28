// Internal backend API (never expose getInternalState without server authorization).
export {EngineService} from './engine/service.js';
export {RuleRegistry} from './engine/rules.js';
export {SqliteRepository} from './persistence/sqlite.js';
export {KernelError} from './common/errors.js';
export {draw,verifyDraw,deterministicIndex} from './engine/rng.js';
export {replay} from './engine/replay.js';
export {projectState,projectEvents} from './engine/visibility.js';
