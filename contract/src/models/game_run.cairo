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