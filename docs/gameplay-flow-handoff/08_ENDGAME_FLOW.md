# Endgame / Victory Flow — PARTIAL

```mermaid
flowchart TD
 A[Committed authoritative state]-->B[Extract verified facts]
 B --> C[#28 hanged fact / #8 sole-survivor fact]
 C --> D{Full applicable victory predicates + competing winners + VH03?}
 D -->|Không đủ| E[PARTIAL: facts only, no GAME_COMPLETED]
 D -->|Đủ sau các Sprint kế| F[DESIGNED ONLY: evaluate concurrently]
 F --> G[DESIGNED ONLY: resolve co-win]
 G --> H[DESIGNED ONLY: commit winnerIds + endgame]
```

**IMPLEMENTED & TESTED:** `evaluateVerifiedVictoryFacts` (#28 hanging after a committed trigger); `evaluateVerifiedSoleSurvivorFacts` (#8 is sole counted survivor); `countsTowardFaction` (ngủ đông, chờ hồi sinh); `canHangHeadlessKnight` (còn Sói thì không treo #8). Đây là các hàm **pure facts**, không kết thúc trận.

**BLOCKED BY RULE / DESIGN:** chung kết phe Dân/Sói/phe Ba, thứ tự tranh thắng, pending after-death chain và kết thúc game thật. `GAME_COMPLETED` vẫn được Kernel từ chối, không có winner giả. Nguyên tắc đồng thắng VH03 không được bỏ qua.
