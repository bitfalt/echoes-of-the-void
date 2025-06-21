use starknet::ContractAddress;

#[derive(Drop, Serde)]
#[dojo::model]
pub struct GameRun {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub run_id: u32,
    pub score: u32,
    pub completed_chambers: u32,
    pub timestamp: u64,
}

#[generate_trait]
pub impl GameRunImpl of GameRunTrait {
    fn new(player: ContractAddress) -> GameRun {
        GameRun {
            player,
            run_id: 0,
            score: 0,
            completed_chambers: 0,
            timestamp: 0,
        }
    }
}