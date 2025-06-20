Game context created by Gemini 2.5 Flash

---

### "Echoes of the Void" - On-Chain Core Summary

**Game Idea:**
"Echoes of the Void" is a minimalist, turn-based, grid-based puzzle-platformer set in a completely dark environment. Players navigate by emitting a "sound pulse" that momentarily reveals a portion of the hidden map. The goal is to find the exit of each procedurally generated chamber. The game leverages Starknet and Dojo to make key gameplay elements, including the map state and player movement, provably on-chain.

**Core Mechanics:**

1.  **Grid-Based Movement:** Player moves one cell at a time (left, right, jump), consuming a "turn" and triggering an on-chain transaction. Physics like gravity would also be turn-based or automatically applied after horizontal moves.
2.  **Sound Pulse:** Players can emit a pulse from their current location. This action triggers an on-chain update that changes the state of hidden map cells within the pulse's radius from "void" to their actual type (wall, path, exit).
3.  **Dynamic Visibility:** Only cells revealed by a pulse are visible. Unrevealed cells cannot be interacted with or moved through.
4.  **Procedural Chambers:** Each chamber's underlying layout (walls, paths, start, exit) is deterministically generated from an on-chain seed.
5.  **Chamber Progression:** Players advance to the next chamber by reaching the exit cell, which updates their on-chain progress.

---

### On-Chain vs. Off-Chain Actions

Given your goal for "a lot of actions on-chain," here's the breakdown:

**On-Chain Actions (Core Game Logic & State):**

*   **Starting a New Game Run:** Initializes a unique game session for the player, generating and committing the seed for all subsequent chambers.
*   **Initializing a New Chamber:** When a player progresses to the next chamber, the Dojo contract sets up its initial "void" state (with player start and exit marked) on-chain.
*   **Player Movement (Left, Right, Jump, Fall):** Every single discrete step or jump is an on-chain transaction. The smart contract validates if the move is valid (e.g., within bounds, not into a wall, on a revealed path).
*   **Emitting a Sound Pulse:** The action of sending out a pulse. The smart contract calculates the pulse's radius, then updates the `ChamberMap` by changing relevant "void" cells to their true type (path, wall, exit).
*   **Completing a Chamber:** When the player successfully lands on the exit cell, this action is submitted to increment their on-chain progress.
*   **Ending a Game Run (Failure/Completion):** Submitting the final outcome of a player's attempt.

**Off-Chain Actions (Client-Side for UX & Rendering):**

*   **Real-time Rendering of Game State:** The visual display of the player, the revealed parts of the map, and the dynamic effects of the sound pulse (e.g., expanding wave, temporary light effects).
*   **Optimistic Movement Prediction:** The client immediately moves the player visually when input is received, *before* the on-chain transaction confirms. If the transaction fails, the client reverts the player's position. This is crucial for responsive feel.
*   **UI Elements:** Displaying current chamber, total pulses, run time, menus, etc.
*   **Audio:** Sound effects and background music.
*   **Input Handling:** Converting keyboard/controller inputs into calls for on-chain transactions.
*   **Pre-computation for Pathing/Jump Validation (Client-Side):** The client might calculate valid paths or jump destinations before sending the transaction, to give instant feedback to the player. The ultimate validation, however, remains on-chain.

---