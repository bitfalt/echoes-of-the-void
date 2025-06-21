use starknet::ContractAddress;

#[derive(Drop, Serde)]
#[dojo::model]
pub struct Player {
    #[key]
    pub player: ContractAddress,
    pub chamber_id: u32,
    pub x: u32,
    pub y: u32,
    pub pulses_used: u32,
    pub deaths: u32,
}

#[generate_trait]
pub impl PlayerImpl of PlayerTrait {
    fn new(player: ContractAddress) -> Player {
        Player {
            player, chamber_id: 0, x: 0, y: 0, pulses_used: 0, deaths: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use starknet::{contract_address_const};
    use echoes_of_the_void::models::player::{PlayerTrait};

    #[test]
    #[available_gas(100000)]
    fn test_player_creation() {
        let player_address = contract_address_const::<'PLAYER_1'>();
        let player = PlayerTrait::new(player_address);

        assert(player.player == player_address, 'Incorrect player address');
        assert(player.chamber_id == 0, 'Incorrect initial chamber_id');
        assert(player.x == 0, 'Incorrect initial x');
        assert(player.y == 0, 'Incorrect initial y');
        assert(player.pulses_used == 0, 'Incorrect initial pulses_used');
        assert(player.deaths == 0, 'Incorrect initial deaths');
    }
} 