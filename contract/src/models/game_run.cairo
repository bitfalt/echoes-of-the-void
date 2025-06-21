use starknet::ContractAddress;

#[derive(Drop, Serde)]
#[dojo::model]
pub struct GameRun {
    #[key]
    pub player: ContractAddress,
    pub score: u32,
    pub completed_chambers: u32,
}

#[generate_trait]
pub impl GameRunImpl of GameRunTrait {
    fn new(player: ContractAddress) -> GameRun {
        GameRun {
            player,
            score: 0,
            completed_chambers: 0,
        }
    }
}