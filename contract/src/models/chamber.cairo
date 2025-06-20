use starknet::ContractAddress;
use super::map_cell_type::MapCellType;

#[derive(Drop, Serde)]
#[dojo::model]
pub struct Chamber {
    #[key]
    pub chamber_id: u32,
    pub map: Array<u8>, // 2D grid flattened, cell type as u8 (see MapCellType)
    pub width: u32,
    pub height: u32,
    pub start_x: u32,
    pub start_y: u32,
    pub exit_x: u32,
    pub exit_y: u32,
} 