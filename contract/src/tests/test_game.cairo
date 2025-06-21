use echoes_of_the_void::systems::game::IGameDispatcherTrait;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::utils::utils;
    use crate::models::player::Player;
    use crate::models::chamber::Chamber;
    use crate::models::game_run::GameRun;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress};

    // 3x3 grid:
    // [0,2,0]
    // [2,2,4]
    // [0,2,3]
    // Indices: 0 1 2
    //          3 4 5
    //          6 7 8
    fn mock_chamber() -> Chamber {
        let map = array![0_u8,2,0, 2,2,4, 0,2,3]; // (2,2) is now void (3)
        Chamber {
            chamber_id: 1,
            map,
            seed: 12345,
            width: 3,
            height: 3,
            start_x: 1,
            start_y: 1,
            exit_x: 2,
            exit_y: 1,
        }
    }

    fn mock_player(addr: ContractAddress) -> Player {
        Player {
            player: addr,
            chamber_id: 0,
            x: 1,
            y: 1,
            pulses_used: 0,
            deaths: 0,
        }
    }

    fn mock_game_run(addr: ContractAddress) -> GameRun {
        GameRun {
            player: addr,
            run_id: 0,
            score: 0,
            completed_chambers: 0,
            timestamp: 0,
        }
    }

    #[test]
    fn test_move_to_path() {
        // Move left from (1,1) to (0,1) which is cell 2 (path)
        let mut world = utils::create_test_world();
        let player_addr = utils::PLAYER();
        let chamber = mock_chamber();
        let mut player = mock_player(player_addr);
        world.write_model(@chamber);
        world.write_model(@player);
        utils::cheat_caller_address(player_addr);
        let mut game = utils::create_game_system(world);
        game.enter_chamber(1);
        game.move_player(-1, 0); // (1,1) -> (0,1)
        let updated: Player = world.read_model(player_addr);
        assert(updated.x == 0 && updated.y == 1, 'Moved to path');
        assert(updated.deaths == 0, 'No deaths on path');
    }

    #[test]
    #[should_panic]
    fn test_move_to_wall() {
        // Move up from (1,1) to (1,0) which is cell 2 (path), then left to (0,0) which is cell 0 (wall)
        let mut world = utils::create_test_world();
        let player_addr = utils::PLAYER();
        let chamber = mock_chamber();
        let mut player = mock_player(player_addr);
        world.write_model(@chamber);
        world.write_model(@player);
        utils::cheat_caller_address(player_addr);
        let mut game = utils::create_game_system(world);
        game.enter_chamber(1);
        game.move_player(0, -1); // (1,1) -> (1,0) (path)
        game.move_player(-1, 0); // (1,0) -> (0,0) (wall, should panic)
    }

    #[test]
    fn test_move_to_void() {
        // Move down from (1,1) to (1,2) (path), then right to (2,2) (void)
        let mut world = utils::create_test_world();
        let player_addr = utils::PLAYER();
        let chamber = mock_chamber();
        let mut player = mock_player(player_addr);
        world.write_model(@chamber);
        world.write_model(@player);
        utils::cheat_caller_address(player_addr);
        let mut game = utils::create_game_system(world);
        game.enter_chamber(1);
        // Move down to (1,2) (path)
        game.move_player(0, 1);
        // Move right to (2,2) (void)
        game.move_player(1, 0);
        let updated: Player = world.read_model(player_addr);
        // After falling into void, player should be reset to start
        assert(updated.x == chamber.start_x && updated.y == chamber.start_y, 'Reset to start after void');
        assert(updated.deaths == 1, 'Deaths incremented after void');
    }

    #[test]
    #[should_panic]
    fn test_wall_after_void_reset() {
        // Move down to (1,2) (path), right to (2,2) (void), then up to (1,1) (reset), then left to (0,1) (path), then up to (0,0) (wall, should panic)
        let mut world = utils::create_test_world();
        let player_addr = utils::PLAYER();
        let chamber = mock_chamber();
        let mut player = mock_player(player_addr);
        world.write_model(@chamber);
        world.write_model(@player);
        utils::cheat_caller_address(player_addr);
        let mut game = utils::create_game_system(world);
        game.enter_chamber(1);
        // Move down to (1,2) (path)
        game.move_player(0, 1);
        // Move right to (2,2) (void)
        game.move_player(1, 0);
        // Now at start (1,1) after void
        // Move left to (0,1) (path)
        game.move_player(-1, 0);
        // Move up to (0,0) (wall, should panic)
        game.move_player(0, -1);
    }

    #[test]
    fn test_move_to_exit() {
        // Move right from (1,1) to (2,1) which is cell 4 (exit)
        let mut world = utils::create_test_world();
        let player_addr = utils::PLAYER();
        let chamber = mock_chamber();
        let mut player = mock_player(player_addr);
        world.write_model(@chamber);
        world.write_model(@player);
        utils::cheat_caller_address(player_addr);
        let mut game = utils::create_game_system(world);
        game.enter_chamber(1);
        game.move_player(1, 0); // (1,1) -> (2,1)
        let updated: Player = world.read_model(player_addr);
        assert(updated.x == 2 && updated.y == 1, 'Moved to exit');
        assert(updated.deaths == 0, 'No deaths on exit');
    }
}
