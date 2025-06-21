#[starknet::interface]
pub trait IGame<T> {
    fn create_player(ref self: T);
    fn create_game_run(ref self: T);
    fn create_chamber(ref self: T, chamber_id: u32, seed: u32, width: u32, height: u32);
    fn enter_chamber(ref self: T, chamber_id: u32);
    fn move_player(ref self: T, dx: i32, dy: i32);
    fn emit_pulse(ref self: T, radius: u32);
    fn complete_chamber(ref self: T);
}

#[dojo::contract]
pub mod game {
    use super::{IGame};
    use starknet::{ContractAddress, get_caller_address};
    use crate::models::player::{Player, PlayerTrait};
    use crate::models::chamber::{Chamber, ChamberTrait};
    use crate::models::game_run::{GameRun, GameRunTrait};
    use dojo::model::ModelStorage;
    use dojo::event::EventStorage;
    use core::traits::TryInto;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PulseEmitted {
        #[key]
        pub player: ContractAddress,
        pub chamber_id: u32,
        pub x: u32,
        pub y: u32,
        pub radius: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerMoved {
        #[key]
        pub player: ContractAddress,
        pub chamber_id: u32,
        pub x: u32,
        pub y: u32,
    }
    
    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ChamberCreated {
        #[key]
        pub chamber_id: u32,
        pub seed: u32,
        pub width: u32,
        pub height: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ChamberEntered {
        #[key]
        pub player: ContractAddress,
        pub chamber_id: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ChamberCompleted {
        #[key]
        pub player: ContractAddress,
        pub chamber_id: u32,
    }

    #[abi(embed_v0)]
    impl GameImpl of IGame<ContractState> {
        fn create_player(ref self: ContractState) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let mut player_state: Player = PlayerTrait::new(player);
            world.write_model(@player_state);
        }

        fn create_game_run(ref self: ContractState) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let mut game_run: GameRun = GameRunTrait::new(player);
            world.write_model(@game_run);
        }

        fn create_chamber(ref self: ContractState, chamber_id: u32, seed: u32, width: u32, height: u32) {
            let mut world = self.world(@"echoes_of_the_void");
            let chamber: Chamber = ChamberTrait::new(chamber_id, seed, width, height);
            world.write_model(@chamber);
            world.emit_event(@ChamberCreated {
                chamber_id,
                seed,
                width,
                height,
            });
        }

        fn enter_chamber(ref self: ContractState, chamber_id: u32) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let chamber: Chamber = world.read_model(chamber_id);
            let mut player_state: Player = world.read_model(player);
            player_state.chamber_id = chamber_id;
            player_state.x = chamber.start_x;
            player_state.y = chamber.start_y;
            world.write_model(@player_state);
            world.emit_event(@ChamberEntered {
                player,
                chamber_id,
            });
        }

        fn move_player(ref self: ContractState, dx: i32, dy: i32) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let mut player_state: Player = world.read_model(player);
            let chamber: Chamber = world.read_model(player_state.chamber_id);

            // Convert player_state.x/y and chamber.width/height to i32 for math
            let x_i32: i32 = player_state.x.try_into().unwrap();
            let y_i32: i32 = player_state.y.try_into().unwrap();
            let width_i32: i32 = chamber.width.try_into().unwrap();
            let height_i32: i32 = chamber.height.try_into().unwrap();

            let new_x_i32 = x_i32 + dx;
            let new_y_i32 = y_i32 + dy;

            // Bounds check: new_x and new_y must be >= 0 and < width/height
            assert(new_x_i32 >= 0, 'Out of bounds');
            assert(new_x_i32 < width_i32, 'Out of bounds');
            assert(new_y_i32 >= 0, 'Out of bounds');
            assert(new_y_i32 < height_i32, 'Out of bounds');

            // Convert back to u32 for indexing
            let new_x: u32 = new_x_i32.try_into().unwrap();
            let new_y: u32 = new_y_i32.try_into().unwrap();

            // Calculate index in flattened map array
            let idx: u32 = new_y * chamber.width + new_x;
            let idx_usize: usize = idx.try_into().unwrap();
            let cell = *chamber.map.at(idx_usize);
            assert(cell != 0, 'Cannot move into wall');
            if cell == 3 {
                // Fell into void: reset to start, increment deaths
                player_state.x = chamber.start_x;
                player_state.y = chamber.start_y;
                player_state.deaths += 1;
            } else {
                player_state.x = new_x;
                player_state.y = new_y;
            }
            world.write_model(@player_state);
            world.emit_event(@PlayerMoved {
                player,
                chamber_id: player_state.chamber_id,
                x: player_state.x,
                y: player_state.y,
            });
        }

        fn emit_pulse(ref self: ContractState, radius: u32) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let mut player_state: Player = world.read_model(player);
            player_state.pulses_used += 1;
            world.write_model(@player_state);
            world.emit_event(@PulseEmitted {
                player,
                chamber_id: player_state.chamber_id,
                x: player_state.x,
                y: player_state.y,
                radius,
            });
        }

        fn complete_chamber(ref self: ContractState) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let mut player_state: Player = world.read_model(player);
            let chamber: Chamber = world.read_model(player_state.chamber_id);
            assert(player_state.x == chamber.exit_x, 'Not at exit');
            assert(player_state.y == chamber.exit_y, 'Not at exit');
            let mut run: GameRun = world.read_model((player, 0));
            run.completed_chambers += 1;
            run.score += 100;
            world.write_model(@run);
            world.emit_event(@ChamberCompleted {
                player,
                chamber_id: player_state.chamber_id,
            });
            player_state.chamber_id = 0;
            player_state.x = 0;
            player_state.y = 0;
            world.write_model(@player_state);
        }
    }
}
