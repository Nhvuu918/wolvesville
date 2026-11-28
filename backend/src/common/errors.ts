export type KernelErrorCode =
  | 'NOT_FOUND' | 'INVALID_ARGUMENT' | 'INVALID_TRANSITION' | 'GAME_COMPLETED'
  | 'UNAUTHORIZED' | 'PHASE_CLOSED' | 'OUT_OF_PHASE' | 'TARGET_INVALID'
  | 'RESOURCE_INSUFFICIENT' | 'SKILL_LOCKED' | 'RULE_UNRESOLVED'
  | 'IDEMPOTENCY_CONFLICT' | 'PENDING_ACTIONS' | 'REVISION_CONFLICT' | 'RNG_DOMAIN_EMPTY'
  | 'REPLAY_CORRUPTED' | 'PERSISTENCE_FAILED';
export class KernelError extends Error {
  constructor(public readonly code: KernelErrorCode, message: string) { super(message); this.name='KernelError'; }
}
export function invariant(value: unknown, code: KernelErrorCode, message: string): asserts value {
  if (!value) throw new KernelError(code,message);
}
