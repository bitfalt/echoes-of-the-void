import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `echoes_of_the_void::models::chamber::Chamber` struct
export interface Chamber {
	chamber_id: BigNumberish;
	map: Array<BigNumberish>;
	width: BigNumberish;
	height: BigNumberish;
	start_x: BigNumberish;
	start_y: BigNumberish;
	exit_x: BigNumberish;
	exit_y: BigNumberish;
	seed: BigNumberish;
}

// Type definition for `echoes_of_the_void::models::chamber::ChamberValue` struct
export interface ChamberValue {
	map: Array<BigNumberish>;
	width: BigNumberish;
	height: BigNumberish;
	start_x: BigNumberish;
	start_y: BigNumberish;
	exit_x: BigNumberish;
	exit_y: BigNumberish;
	seed: BigNumberish;
}

// Type definition for `echoes_of_the_void::models::game_run::GameRun` struct
export interface GameRun {
	player: string;
	run_id: BigNumberish;
	score: BigNumberish;
	completed_chambers: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `echoes_of_the_void::models::game_run::GameRunValue` struct
export interface GameRunValue {
	score: BigNumberish;
	completed_chambers: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `echoes_of_the_void::models::player::Player` struct
export interface Player {
	player: string;
	chamber_id: BigNumberish;
	x: BigNumberish;
	y: BigNumberish;
	pulses_used: BigNumberish;
	deaths: BigNumberish;
}

// Type definition for `echoes_of_the_void::models::player::PlayerValue` struct
export interface PlayerValue {
	chamber_id: BigNumberish;
	x: BigNumberish;
	y: BigNumberish;
	pulses_used: BigNumberish;
	deaths: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::ChamberCompleted` struct
export interface ChamberCompleted {
	player: string;
	chamber_id: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::ChamberCompletedValue` struct
export interface ChamberCompletedValue {
	chamber_id: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::ChamberCreated` struct
export interface ChamberCreated {
	chamber_id: BigNumberish;
	seed: BigNumberish;
	width: BigNumberish;
	height: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::ChamberCreatedValue` struct
export interface ChamberCreatedValue {
	seed: BigNumberish;
	width: BigNumberish;
	height: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::ChamberEntered` struct
export interface ChamberEntered {
	player: string;
	chamber_id: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::ChamberEnteredValue` struct
export interface ChamberEnteredValue {
	chamber_id: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::PlayerMoved` struct
export interface PlayerMoved {
	player: string;
	chamber_id: BigNumberish;
	x: BigNumberish;
	y: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::PlayerMovedValue` struct
export interface PlayerMovedValue {
	chamber_id: BigNumberish;
	x: BigNumberish;
	y: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::PulseEmitted` struct
export interface PulseEmitted {
	player: string;
	chamber_id: BigNumberish;
	x: BigNumberish;
	y: BigNumberish;
	radius: BigNumberish;
}

// Type definition for `echoes_of_the_void::systems::game::game::PulseEmittedValue` struct
export interface PulseEmittedValue {
	chamber_id: BigNumberish;
	x: BigNumberish;
	y: BigNumberish;
	radius: BigNumberish;
}

export interface SchemaType extends ISchemaType {
	echoes_of_the_void: {
		Chamber: Chamber,
		ChamberValue: ChamberValue,
		GameRun: GameRun,
		GameRunValue: GameRunValue,
		Player: Player,
		PlayerValue: PlayerValue,
		ChamberCompleted: ChamberCompleted,
		ChamberCompletedValue: ChamberCompletedValue,
		ChamberCreated: ChamberCreated,
		ChamberCreatedValue: ChamberCreatedValue,
		ChamberEntered: ChamberEntered,
		ChamberEnteredValue: ChamberEnteredValue,
		PlayerMoved: PlayerMoved,
		PlayerMovedValue: PlayerMovedValue,
		PulseEmitted: PulseEmitted,
		PulseEmittedValue: PulseEmittedValue,
	},
}
export const schema: SchemaType = {
	echoes_of_the_void: {
		Chamber: {
			chamber_id: 0,
			map: [0],
			width: 0,
			height: 0,
			start_x: 0,
			start_y: 0,
			exit_x: 0,
			exit_y: 0,
			seed: 0,
		},
		ChamberValue: {
			map: [0],
			width: 0,
			height: 0,
			start_x: 0,
			start_y: 0,
			exit_x: 0,
			exit_y: 0,
			seed: 0,
		},
		GameRun: {
			player: "",
			run_id: 0,
			score: 0,
			completed_chambers: 0,
			timestamp: 0,
		},
		GameRunValue: {
			score: 0,
			completed_chambers: 0,
			timestamp: 0,
		},
		Player: {
			player: "",
			chamber_id: 0,
			x: 0,
			y: 0,
			pulses_used: 0,
			deaths: 0,
		},
		PlayerValue: {
			chamber_id: 0,
			x: 0,
			y: 0,
			pulses_used: 0,
			deaths: 0,
		},
		ChamberCompleted: {
			player: "",
			chamber_id: 0,
		},
		ChamberCompletedValue: {
			chamber_id: 0,
		},
		ChamberCreated: {
			chamber_id: 0,
			seed: 0,
			width: 0,
			height: 0,
		},
		ChamberCreatedValue: {
			seed: 0,
			width: 0,
			height: 0,
		},
		ChamberEntered: {
			player: "",
			chamber_id: 0,
		},
		ChamberEnteredValue: {
			chamber_id: 0,
		},
		PlayerMoved: {
			player: "",
			chamber_id: 0,
			x: 0,
			y: 0,
		},
		PlayerMovedValue: {
			chamber_id: 0,
			x: 0,
			y: 0,
		},
		PulseEmitted: {
			player: "",
			chamber_id: 0,
			x: 0,
			y: 0,
			radius: 0,
		},
		PulseEmittedValue: {
			chamber_id: 0,
			x: 0,
			y: 0,
			radius: 0,
		},
	},
};
export enum ModelsMapping {
	Chamber = 'echoes_of_the_void-Chamber',
	ChamberValue = 'echoes_of_the_void-ChamberValue',
	GameRun = 'echoes_of_the_void-GameRun',
	GameRunValue = 'echoes_of_the_void-GameRunValue',
	Player = 'echoes_of_the_void-Player',
	PlayerValue = 'echoes_of_the_void-PlayerValue',
	ChamberCompleted = 'echoes_of_the_void-ChamberCompleted',
	ChamberCompletedValue = 'echoes_of_the_void-ChamberCompletedValue',
	ChamberCreated = 'echoes_of_the_void-ChamberCreated',
	ChamberCreatedValue = 'echoes_of_the_void-ChamberCreatedValue',
	ChamberEntered = 'echoes_of_the_void-ChamberEntered',
	ChamberEnteredValue = 'echoes_of_the_void-ChamberEnteredValue',
	PlayerMoved = 'echoes_of_the_void-PlayerMoved',
	PlayerMovedValue = 'echoes_of_the_void-PlayerMovedValue',
	PulseEmitted = 'echoes_of_the_void-PulseEmitted',
	PulseEmittedValue = 'echoes_of_the_void-PulseEmittedValue',
}