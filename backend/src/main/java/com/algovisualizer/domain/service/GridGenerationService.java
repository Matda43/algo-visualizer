package com.algovisualizer.domain.service;

import com.algovisualizer.domain.model.GeneratedGrid;
import com.algovisualizer.domain.model.GridCellData;
import com.algovisualizer.infrastructure.rest.GridGenerationRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GridGenerationService {

    /**
     * Génère une grille en combinant terrain de base + couche de murs.
     * Les deux passes sont indépendantes et superposées : les cellules "mur"
     * issues du terrain ne sont pas écrasées par la passe murs, et inversement.
     */
    public GeneratedGrid generate(GridGenerationRequest req) {
        int    rows    = req.rows();
        int    cols    = req.cols();
        double density = (req.density() <= 0.0 || req.density() > 1.0) ? 0.30 : req.density();

        boolean[][] walls = new boolean[rows][cols];

        // Passe 1 : terrain de base
        applyTerrain(walls, rows, cols, req.terrainType());

        // Passe 2 : couche de murs superposée
        applyWalls(walls, rows, cols, req.wallType(), density);

        List<GridCellData> cells = wallsToCell(walls, rows, cols);
        return buildGrid(cells, rows, cols);
    }

    // ── Terrain ───────────────────────────────────────────────────────────────

    private void applyTerrain(boolean[][] walls, int rows, int cols, String type) {
        switch (type == null ? "none" : type) {
            case "terrain-islands"  -> fillIslands(walls, rows, cols);
            case "terrain-dungeon"  -> fillDungeon(walls, rows, cols);
            // "none" → rien
        }
    }

    private void fillIslands(boolean[][] walls, int rows, int cols) {
        // Tout mur
        for (boolean[] row : walls) Arrays.fill(row, true);
        Random rng         = new Random();
        int    islandCount = Math.max(3, (rows * cols) / 40);
        for (int island = 0; island < islandCount; island++) {
            int centerRow = 1 + rng.nextInt(rows - 2);
            int centerCol = 1 + rng.nextInt(cols - 2);
            int radius    = 2 + rng.nextInt(4);
            for (int r = Math.max(0, centerRow - radius); r <= Math.min(rows - 1, centerRow + radius); r++) {
                for (int c = Math.max(0, centerCol - radius); c <= Math.min(cols - 1, centerCol + radius); c++) {
                    if (Math.pow(r - centerRow, 2) + Math.pow(c - centerCol, 2) <= Math.pow(radius, 2)) {
                        walls[r][c] = false;
                    }
                }
            }
        }
    }

    private void fillDungeon(boolean[][] walls, int rows, int cols) {
        for (boolean[] row : walls) Arrays.fill(row, true);
        Random rng = new Random();

        record Room(int r1, int r2, int c1, int c2) {}
        List<Room> rooms     = new ArrayList<>();
        int        roomCount = Math.max(3, (rows * cols) / 80);

        for (int attempt = 0; attempt < roomCount * 6; attempt++) {
            int rh = 3 + rng.nextInt(5);
            int rw = 3 + rng.nextInt(7);
            int r1 = 1 + rng.nextInt(Math.max(1, rows - rh - 2));
            int c1 = 1 + rng.nextInt(Math.max(1, cols - rw - 2));
            int r2 = r1 + rh;
            int c2 = c1 + rw;
            if (r2 >= rows - 1 || c2 >= cols - 1) continue;

            Room newRoom = new Room(r1, r2, c1, c2);
            boolean overlaps = rooms.stream().anyMatch(room ->
                    r1 <= room.r2() + 1 && r2 >= room.r1() - 1 &&
                            c1 <= room.c2() + 1 && c2 >= room.c1() - 1
            );

            if (!overlaps && rooms.size() < roomCount) {
                rooms.add(newRoom);
                for (int r = r1; r <= r2; r++)
                    for (int c = c1; c <= c2; c++)
                        walls[r][c] = false;
            }
        }

        // Couloirs reliant les salles
        for (int i = 1; i < rooms.size(); i++) {
            Room prev = rooms.get(i - 1);
            Room curr = rooms.get(i);
            int  pr   = (prev.r1() + prev.r2()) / 2;
            int  pc   = (prev.c1() + prev.c2()) / 2;
            int  cr   = (curr.r1() + curr.r2()) / 2;
            int  cc   = (curr.c1() + curr.c2()) / 2;
            int  col  = pc;
            while (col != cc) { walls[pr][col] = false; col += (col < cc) ? 1 : -1; }
            int  row  = pr;
            while (row != cr) { walls[row][cc] = false; row += (row < cr) ? 1 : -1; }
        }
    }

    // ── Murs ──────────────────────────────────────────────────────────────────

    private void applyWalls(boolean[][] walls, int rows, int cols, String type, double density) {
        switch (type == null ? "none" : type) {
            case "maze-recursive" -> overlayMaze(walls, rows, cols);
            case "random"         -> overlayRandom(walls, rows, cols, density);
            case "borders"        -> overlayBorders(walls, rows, cols);
            case "dense"          -> overlayRandom(walls, rows, cols, 0.55);
            // "none" → rien
        }
    }

    private void overlayMaze(boolean[][] walls, int rows, int cols) {
        // Ajouter des bordures puis labyrinthe récursif dans l'espace libre
        boolean[][] mazeWalls = new boolean[rows][cols];
        for (int r = 0; r < rows; r++) {
            mazeWalls[r][0] = true;
            mazeWalls[r][cols - 1] = true;
        }
        for (int c = 0; c < cols; c++) {
            mazeWalls[0][c] = true;
            mazeWalls[rows - 1][c] = true;
        }
        recursiveDivision(mazeWalls, 1, rows - 2, 1, cols - 2, new Random());
        // Superposer : une cellule est un mur si l'un OU l'autre la marque
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (mazeWalls[r][c]) walls[r][c] = true;
    }

    private void overlayRandom(boolean[][] walls, int rows, int cols, double density) {
        Random rng = new Random();
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (!walls[r][c] && rng.nextDouble() < density) walls[r][c] = true;
    }

    private void overlayBorders(boolean[][] walls, int rows, int cols) {
        for (int r = 0; r < rows; r++) {
            walls[r][0]       = true;
            walls[r][cols - 1] = true;
        }
        for (int c = 0; c < cols; c++) {
            walls[0][c]       = true;
            walls[rows - 1][c] = true;
        }
    }

    private void recursiveDivision(boolean[][] walls, int rStart, int rEnd,
                                   int cStart, int cEnd, Random rng) {
        if (rEnd - rStart < 2 || cEnd - cStart < 2) return;
        boolean horizontal = (rEnd - rStart) > (cEnd - cStart);
        if (horizontal) {
            int wallRow = rStart + 1 + 2 * rng.nextInt(Math.max(1, (rEnd - rStart - 1) / 2));
            wallRow = Math.min(wallRow, rEnd);
            int passage = cStart + rng.nextInt(cEnd - cStart + 1);
            for (int c = cStart; c <= cEnd; c++)
                if (c != passage) walls[wallRow][c] = true;
            recursiveDivision(walls, rStart, wallRow - 1, cStart, cEnd, rng);
            recursiveDivision(walls, wallRow + 1, rEnd,   cStart, cEnd, rng);
        } else {
            int wallCol = cStart + 1 + 2 * rng.nextInt(Math.max(1, (cEnd - cStart - 1) / 2));
            wallCol = Math.min(wallCol, cEnd);
            int passage = rStart + rng.nextInt(rEnd - rStart + 1);
            for (int r = rStart; r <= rEnd; r++)
                if (r != passage) walls[r][wallCol] = true;
            recursiveDivision(walls, rStart, rEnd, cStart, wallCol - 1, rng);
            recursiveDivision(walls, rStart, rEnd, wallCol + 1, cEnd,   rng);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<GridCellData> wallsToCell(boolean[][] walls, int rows, int cols) {
        List<GridCellData> cells = new ArrayList<>();
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (walls[r][c]) cells.add(new GridCellData(c, r, "Mur"));
        return cells;
    }

    private GeneratedGrid buildGrid(List<GridCellData> cells, int rows, int cols) {
        int startX = Math.min(3, cols - 1);
        int startY = Math.min(3, rows - 1);
        int endX   = Math.max(0, cols - 4);
        int endY   = Math.max(0, rows - 4);
        return new GeneratedGrid(rows, cols, cells, startX, startY, endX, endY);
    }
}