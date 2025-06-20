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