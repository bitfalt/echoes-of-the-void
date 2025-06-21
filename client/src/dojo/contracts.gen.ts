import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish } from "starknet";

export function setupWorld(provider: DojoProvider) {

	const build_game_completeChamber_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "complete_chamber",
			calldata: [],
		};
	};

	const game_completeChamber = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_completeChamber_calldata(),
				"echoes_of_the_void",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_emitPulse_calldata = (radius: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "emit_pulse",
			calldata: [radius],
		};
	};

	const game_emitPulse = async (snAccount: Account | AccountInterface, radius: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_emitPulse_calldata(radius),
				"echoes_of_the_void",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_enterChamber_calldata = (chamberId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "enter_chamber",
			calldata: [chamberId],
		};
	};

	const game_enterChamber = async (snAccount: Account | AccountInterface, chamberId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_enterChamber_calldata(chamberId),
				"echoes_of_the_void",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_movePlayer_calldata = (dx: BigNumberish, dy: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "move_player",
			calldata: [dx, dy],
		};
	};

	const game_movePlayer = async (snAccount: Account | AccountInterface, dx: BigNumberish, dy: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_movePlayer_calldata(dx, dy),
				"echoes_of_the_void",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		game: {
			completeChamber: game_completeChamber,
			buildCompleteChamberCalldata: build_game_completeChamber_calldata,
			emitPulse: game_emitPulse,
			buildEmitPulseCalldata: build_game_emitPulse_calldata,
			enterChamber: game_enterChamber,
			buildEnterChamberCalldata: build_game_enterChamber_calldata,
			movePlayer: game_movePlayer,
			buildMovePlayerCalldata: build_game_movePlayer_calldata,
		},
	};
}