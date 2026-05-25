package com.algovisualizer.infrastructure.algorithm.pathfinding;

import com.algovisualizer.domain.model.PathStep;
import com.algovisualizer.domain.model.PathStepType;
import com.algovisualizer.domain.model.PathfindingMetadata;
import com.algovisualizer.domain.port.PathfindingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.function.Consumer;

@Component
public class DfsAlgorithm implements PathfindingAlgorithm {

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
        int[] visitedCount = {0};

        boolean pathFound = dfs(walls, rows, cols, startRow, startCol, endRow, endCol,
                allowDiagonal, visited, parentRow, parentCol, visitedCount, emit);

        int pathLength = 0;
        if (pathFound) {
            pathLength = tracePath(parentRow, parentCol, cols, endRow, endCol, emit);
        }
        emit.accept(new PathStep(PathStepType.DONE, -1, -1, pathFound, visitedCount[0], pathLength));
    }

    private boolean dfs(
            boolean[] walls, int rows, int cols,
            int row, int col, int endRow, int endCol,
            boolean allowDiagonal, boolean[] visited,
            int[] parentRow, int[] parentCol, int[] visitedCount,
            Consumer<PathStep> emit
    ) {
        int idx = row * cols + col;
        if (visited[idx]) return false;
        visited[idx] = true;
        visitedCount[0]++;
        emit.accept(new PathStep(PathStepType.VISITED, row, col, false, visitedCount[0], 0));

        if (row == endRow && col == endCol) return true;

        int[][] dirs = allowDiagonal
                ? new int[][]{{-1,0},{1,0},{0,-1},{0,1},{-1,-1},{-1,1},{1,-1},{1,1}}
                : new int[][]{{-1,0},{1,0},{0,-1},{0,1}};

        for (int[] d : dirs) {
            int nr = row + d[0], nc = col + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int nIdx = nr * cols + nc;
            if (!visited[nIdx] && !walls[nIdx]) {
                parentRow[nIdx] = row;
                parentCol[nIdx] = col;
                emit.accept(new PathStep(PathStepType.FRONTIER, nr, nc, false, visitedCount[0], 0));
                if (dfs(walls, rows, cols, nr, nc, endRow, endCol, allowDiagonal,
                        visited, parentRow, parentCol, visitedCount, emit)) {
                    return true;
                }
            }
        }
        return false;
    }

    private int tracePath(int[] parentRow, int[] parentCol, int cols, int endRow, int endCol, Consumer<PathStep> emit) {
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
    public String getName() { return "DFS"; }

    @Override
    public PathfindingMetadata getMetadata() {
        return new PathfindingMetadata(
                "DFS",
                "O(V + E)", "O(V)",
                "Non", "Oui (graphe fini)",
                "Parcours en profondeur (Depth-First Search). Explore aussi loin que possible avant de revenir en arrière. Ne garantit pas le chemin le plus court. Utilise une pile (récursion). Utile pour détecter si un chemin existe.",
                "https://fr.wikipedia.org/wiki/Algorithme_de_parcours_en_profondeur"
        );
    }
}