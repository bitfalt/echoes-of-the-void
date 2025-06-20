#[starknet::interface]
pub trait IGame<T> {
    fn enter_chamber(ref self: T, chamber_id: u32);
    fn move_player(ref self: T, dx: i32, dy: i32);
    fn emit_pulse(ref self: T, radius: u32);
    fn complete_chamber(ref self: T);
}

#[dojo::contract]
pub mod game {
    use super::{IGame};
    use starknet::{ContractAddress, get_caller_address};
    use crate::models::player::Player;
    use crate::models::chamber::Chamber;
    use crate::models::game_run::GameRun;
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

    #[abi(embed_v0)]
    impl GameImpl of IGame<ContractState> {
        fn enter_chamber(ref self: ContractState, chamber_id: u32) {
            let mut world = self.world(@"echoes_of_the_void");
            let player = get_caller_address();
            let chamber: Chamber = world.read_model(chamber_id);
            let mut player_state: Player = world.read_model(player);
            player_state.chamber_id = chamber_id;
            player_state.x = chamber.start_x;
            player_state.y = chamber.start_y;
            player_state.pulses_used = 0;
            player_state.deaths = 0;
            world.write_model(@player_state);
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
            let mut run: GameRun = world.read_model((player, 0)); // Example: run_id=0
            run.completed_chambers += 1;
            run.score += 1;
            world.write_model(@run);
        }
    }
}
