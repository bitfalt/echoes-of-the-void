#[derive(Serde, Drop, Introspect, PartialEq, Debug)]
pub enum MapCellType {
    Wall,    // 0
    Player,  // 1
    Path,    // 2
    Void,    // 3
    Exit     // 4
} 