package com.algovisualizer.infrastructure.algorithm.pathfinding;

import com.algovisualizer.domain.model.PathStep;
import com.algovisualizer.domain.model.PathStepType;
import com.algovisualizer.domain.model.PathfindingMetadata;
import com.algovisualizer.domain.port.PathfindingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;
import java.util.function.Consumer;

@Component
public class BfsAlgorithm implements PathfindingAlgorithm {

    @Override
    public void findPath(
            boolean[] walls, int rows, int cols,
            int startRow, int startCol, int endRow, int endCol,
            boolean allowDiagonal, Consumer<PathStep> emit
    ) {
        int[] parentRow = new int[rows * cols];
        int[] parentCol = new int[rows * cols];
        Arrays.fill(parentRow, -1);
        Arrays.fill(parentCol, -1);
        boolean[] visited = new boolean[rows * cols];

        Deque<int[]> queue = new ArrayDeque<>();
        int startIdx = startRow * cols + startCol;
        visited[startIdx] = true;
        queue.add(new int[]{startRow, startCol});

        int visitedCount = 0;
        boolean pathFound = false;

        outer:
        while (!queue.isEmpty()) {
            int[] current = queue.poll();
            int curRow = current[0], curCol = current[1];
            int curIdx = curRow * cols + curCol;

            if (curRow == endRow && curCol == endCol) {
                pathFound = true;
                break;
            }

            emit.accept(new PathStep(PathStepType.VISITED, curRow, curCol, false, ++visitedCount, 0));

            for (int[] neighbor : getNeighbors(curRow, curCol, rows, cols, allowDiagonal)) {
                int nRow = neighbor[0], nCol = neighbor[1];
                int nIdx = nRow * cols + nCol;
                if (!visited[nIdx] && !walls[nIdx]) {
                    visited[nIdx] = true;
                    parentRow[nIdx] = curRow;
                    parentCol[nIdx] = curCol;
                    queue.add(new int[]{nRow, nCol});
                    emit.accept(new PathStep(PathStepType.FRONTIER, nRow, nCol, false, visitedCount, 0));
                }
            }
        }

        int pathLength = 0;
        if (pathFound) {
            pathLength = tracePath(parentRow, parentCol, cols, endRow, endCol, emit);
        }
        emit.accept(new PathStep(PathStepType.DONE, -1, -1, pathFound, visitedCount, pathLength));
    }

    protected int[][] getNeighbors(int row, int col, int rows, int cols, boolean diagonal) {
        int[][] dirs = diagonal
                ? new int[][]{{-1,0},{1,0},{0,-1},{0,1},{-1,-1},{-1,1},{1,-1},{1,1}}
                : new int[][]{{-1,0},{1,0},{0,-1},{0,1}};
        java.util.List<int[]> result = new java.util.ArrayList<>();
        for (int[] d : dirs) {
            int r = row + d[0], c = col + d[1];
            if (r >= 0 && r < rows && c >= 0 && c < cols) result.add(new int[]{r, c});
        }
        return result.toArray(new int[0][]);
    }

    protected int tracePath(int[] parentRow, int[] parentCol, int cols, int endRow, int endCol, Consumer<PathStep> emit) {
        java.util.List<int[]> path = new java.util.ArrayList<>();
        int r = endRow, c = endCol;
        while (parentRow[r * cols + c] != -1) {
            path.add(0, new int[]{r, c});
            int pr = parentRow[r * cols + c];
            int pc = parentCol[r * cols + c];
            r = pr; c = pc;
        }
        path.add(0, new int[]{r, c});
        for (int[] cell : path) {
            emit.accept(new PathStep(PathStepType.PATH, cell[0], cell[1], true, 0, path.size()));
        }
        return path.size();
    }

    @Override
    public String getName() { return "BFS"; }

    @Override
    public PathfindingMetadata getMetadata() {
        return new PathfindingMetadata(
                "BFS",
                "O(V + E)", "O(V)",
                "Oui (graphe non pondéré)", "Oui",
                "Parcours en largeur (Breadth-First Search). Explore les cellules niveau par niveau en partant de la source. Garantit le chemin le plus court en nombre de cases sur un graphe non pondéré. Utilise une file FIFO.",
                "https://fr.wikipedia.org/wiki/Algorithme_de_parcours_en_largeur"
        );
    }
}