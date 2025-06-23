
<div align="center">
  <img src="./client/src/assets/logo.png" alt="Echoes of the Void" height="500"/>
</div>

> A minimalist exploration game built on Starknet with the Dojo Engine.
> Navigate through dark chambers, use your pulse to reveal the path, and avoid the void

Map generation WIP, right now it is a bit buggy and sometimes the exit is unreachable. However core mechanics still apply

## ✨ What's Included

**🎨 Frontend**
- React + Vite + TypeScript with complete Dojo integration.
- Cartridge Controller wallet integration for a seamless user experience.
- Real-time, grid-based game UI with effects and animations.
- Custom React hooks for all on-chain player actions.

**⚙️ Backend**
- Cairo smart contracts built with the Dojo Engine.
- On-chain player state tracking including position, deaths, and pulses used.
- Game systems for movement, exploration, and progression.

## 🛠️ Tech Stack

```
Frontend: React + Vite + TypeScript + TailwindCSS + Zustand
Backend:  Cairo + Dojo Engine + Torii GraphQL Indexer
Network:  Starknet (Local/Sepolia)
Wallet:   Cartridge Controller
```

## 🎮 Game Mechanics

The core gameplay revolves around exploration and survival in a dark, mysterious world.

| Action | Effect | Description |
|--------|--------|-------------|
| ⬅️⬆️➡️⬇️ **Move** | Changes player position | Navigate the chamber one cell at a time. Walls block your path. |
| 💥 **Emit Pulse** | Temporarily reveals your surroundings | Use a pulse to see through the fog of war. This action has a cooldown. |
| ☠️ **Fall into Void** | Player dies and respawns at the entrance | Falling into a void cell resets your position and increases your death count. |

**Objective:**
Your goal is to navigate from the **Entrance** to the **Exit** of each chamber.

**🏆 Stats Tracked:**
- Chambers Completed
- Pulses Used
- Deaths

## 🚀 Key Features

**⚡ Onchain Gameplay**
- All core game logic and player state are managed by Cairo smart contracts on Starknet.
- Cartridge Controller integration for easy wallet management and session keys.

**🔧 Modern Frontend**
- Built with React, Vite, and TypeScript for a robust and maintainable codebase.
- Real-time UI updates that reflect the on-chain state.

## 🌟 Getting Started

1. **For Frontend Development:** See the [Client README](./client/README.md)
2. **For Backend Development:** See the [Contracts README](./contract/README.md)
3. **For a Complete Overview:** Read the [Integration Guide Series](./client/docs/)

## 🔗 Links

- **[Starknet](https://starknet.io)**
- **[Dojo Engine](https://dojoengine.org)**
- **[Cairo](https://cairo-lang.org)**
- **[Cartridge](https://cartridge.gg)**

---

**Built with ❤️ for the Starknet gaming community**
