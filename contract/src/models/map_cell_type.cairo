#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum MapCellType {
    Wall,    // 0
    Player,  // 1
    Path,    // 2
    Void,    // 3
    Exit,    // 4
}

impl MapCellTypeIntoU8 of Into<MapCellType, u8> {
    fn into(self: MapCellType) -> u8 {
        match self {
            MapCellType::Wall => 0,
            MapCellType::Player => 1,
            MapCellType::Path => 2,
            MapCellType::Void => 3,
            MapCellType::Exit => 4,
        }
    }
} 

impl MapCellTypeFromU8 of Into<u8, MapCellType> {
    fn into(self: u8) -> MapCellType {
        match self {
            0 => MapCellType::Wall,
            1 => MapCellType::Player,
            2 => MapCellType::Path,
            3 => MapCellType::Void,
            4 => MapCellType::Exit,
            _ => MapCellType::Void,
        }
    }
}