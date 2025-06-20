use starknet::ContractAddress;
use echoes_of_the_void::models::map_cell_type::MapCellType;
use echoes_of_the_void::constants::lcg;


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

#[generate_trait]
pub impl ChamberImpl of ChamberTrait {
    fn new(chamber_id: u32, seed: u32, width: u32, height: u32) -> Chamber {
        let mut path_locations: Array<(u32, u32)> = ArrayTrait::new();
        let mut first_pass_seed = seed;

        // First pass: Determine path locations without building the map
        let mut y: u32 = 0;
        loop {
            if y >= height { break; }
            let mut x: u32 = 0;
            loop {
                if x >= width { break; }
                if !(x == 0 || x == width - 1 || y == 0 || y == height - 1) {
                    first_pass_seed = lcg(first_pass_seed);
                    let random_value = first_pass_seed % 10; // 0-9
                    if random_value >= 5 { // 50% chance of path
                        path_locations.append((x, y));
                    }
                }
                x += 1;
            };
            y += 1;
        };

        assert(path_locations.len() >= 2, 'Not enough path tiles');

        // Select start and exit points from available paths
        let mut selection_seed = first_pass_seed;
        selection_seed = lcg(selection_seed);
        let start_index = selection_seed % path_locations.len();
        let (start_x, start_y) = *path_locations.at(start_index);

        selection_seed = lcg(selection_seed);
        let mut exit_index = selection_seed % path_locations.len();
        if exit_index == start_index {
            exit_index = (exit_index + 1) % path_locations.len();
        }
        let (exit_x, exit_y) = *path_locations.at(exit_index);
        
        // Second pass: Build the final, immutable map
        let mut map: Array<u8> = ArrayTrait::new();
        let mut second_pass_seed = seed;
        y = 0;
        loop {
            if y >= height { break; }
            let mut x: u32 = 0;
            loop {
                if x >= width { break; }
                
                if x == exit_x && y == exit_y {
                    map.append(MapCellType::Exit.into());
                } else if x == 0 || x == width - 1 || y == 0 || y == height - 1 {
                    map.append(MapCellType::Wall.into());
                } else {
                    second_pass_seed = lcg(second_pass_seed);
                    let random_value = second_pass_seed % 10;
                    if random_value < 2 {
                        map.append(MapCellType::Void.into());
                    } else if random_value < 5 {
                        map.append(MapCellType::Wall.into());
                    } else {
                        map.append(MapCellType::Path.into());
                    }
                }
                x += 1;
            };
            y += 1;
        };

        Chamber {
            chamber_id,
            map,
            width,
            height,
            start_x,
            start_y,
            exit_x,
            exit_y,
        }
    }
}

#[cfg(test)]
mod tests {
    use starknet::ContractAddress;
    use echoes_of_the_void::models::chamber::{Chamber, ChamberTrait};
    use echoes_of_the_void::models::map_cell_type::MapCellType;

    const WIDTH: u32 = 20;
    const HEIGHT: u32 = 20;
    const SEED_1: u32 = 12345;
    const SEED_2: u32 = 54321;

    #[test]
    #[available_gas(200000000)]
    fn test_chamber_creation() {
        let chamber = ChamberTrait::new(1, SEED_1, WIDTH, HEIGHT);

        // Test dimensions
        assert(chamber.width == WIDTH, 'Incorrect width');
        assert(chamber.height == HEIGHT, 'Incorrect height');
        assert(chamber.map.len() == (WIDTH * HEIGHT).into(), 'Incorrect map size');

        // Test borders are walls
        let mut y: u32 = 0;
        loop {
            if y >= HEIGHT { break; }
            let mut x: u32 = 0;
            loop {
                if x >= WIDTH { break; }
                if x == 0 || x == WIDTH - 1 || y == 0 || y == HEIGHT - 1 {
                    let cell_type: MapCellType = (*chamber.map.at(y * WIDTH + x)).try_into().unwrap();
                    assert(cell_type == MapCellType::Wall, 'Border is not wall');
                }
                x += 1;
            };
            y += 1;
        };
    }

    #[test]
    #[available_gas(200000000)]
    fn test_start_and_exit_placement() {
        let chamber = ChamberTrait::new(1, SEED_1, WIDTH, HEIGHT);

        // Test start and exit are within bounds
        assert(chamber.start_x > 0 && chamber.start_x < WIDTH - 1, 'Start X out of bounds');
        assert(chamber.start_y > 0 && chamber.start_y < HEIGHT - 1, 'Start Y out of bounds');
        assert(chamber.exit_x > 0 && chamber.exit_x < WIDTH - 1, 'Exit X out of bounds');
        assert(chamber.exit_y > 0 && chamber.exit_y < HEIGHT - 1, 'Exit Y out of bounds');

        // Test exit is on an Exit tile
        let exit_index = chamber.exit_y * chamber.width + chamber.exit_x;
        let exit_cell: MapCellType = (*chamber.map.at(exit_index)).try_into().unwrap();
        assert(exit_cell == MapCellType::Exit, 'Exit tile not Exit');

        // Test start is on a Path tile (originally, before exit is placed)
        // This is tricky because the exit might have replaced a path tile that was selected for start
        // A better test is to ensure start is NOT a Wall or Void
         let start_index = chamber.start_y * chamber.width + chamber.start_x;
        let start_cell: MapCellType = (*chamber.map.at(start_index)).try_into().unwrap();
        assert(start_cell != MapCellType::Wall, 'Start is wall');
        assert(start_cell != MapCellType::Void, 'Start is void');
    }
    
    #[test]
    #[available_gas(400000000)]
    fn test_chamber_determinism() {
        let chamber1 = ChamberTrait::new(1, SEED_1, WIDTH, HEIGHT);
        let chamber2 = ChamberTrait::new(1, SEED_1, WIDTH, HEIGHT);
        let chamber3 = ChamberTrait::new(1, SEED_2, WIDTH, HEIGHT);

        // Test that the same seed produces the same map
        assert(chamber1.map.len() == chamber2.map.len(), 'Same seed, len mismatch');
        let mut i = 0;
        loop {
            if i >= chamber1.map.len() { break; }
            assert(*chamber1.map.at(i) == *chamber2.map.at(i), 'Same seed, map mismatch');
            i += 1;
        };
        assert(chamber1.start_x == chamber2.start_x, 'Same seed, start_x mismatch');
        assert(chamber1.start_y == chamber2.start_y, 'Same seed, start_y mismatch');
        assert(chamber1.exit_x == chamber2.exit_x, 'Same seed, exit_x mismatch');
        assert(chamber1.exit_y == chamber2.exit_y, 'Same seed, exit_y mismatch');

        // Test that a different seed produces a different map
        // Note: this could theoretically fail if the different seeds produce the same map by chance
        let mut maps_are_different = false;
        if chamber1.map.len() != chamber3.map.len() {
             maps_are_different = true;
        } else {
            let mut i = 0;
            loop {
                if i >= chamber1.map.len() { break; }
                if *chamber1.map.at(i) != *chamber3.map.at(i) {
                    maps_are_different = true;
                    break;
                }
                i += 1;
            };
        }
        
        if !maps_are_different {
             maps_are_different = chamber1.start_x != chamber3.start_x ||
                                  chamber1.start_y != chamber3.start_y ||
                                  chamber1.exit_x != chamber3.exit_x ||
                                  chamber1.exit_y != chamber3.exit_y;
        }

        assert(maps_are_different, 'Different seed, same map');
    }
} 