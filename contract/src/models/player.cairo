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