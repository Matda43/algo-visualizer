package com.algovisualizer.infrastructure.algorithm.pathfinding;

import com.algovisualizer.domain.model.PathStep;
import com.algovisualizer.domain.model.PathStepType;
import com.algovisualizer.domain.model.PathfindingMetadata;
import com.algovisualizer.domain.port.PathfindingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.PriorityQueue;
import java.util.function.Consumer;

@Component
public class GreedyBfsAlgorithm implements PathfindingAlgorithm {

    @Override
    public void findPath(
            boolean[] walls, int rows, int cols,
            int startRow, int startCol, int endRow, int endCol,
            boolean allowDiagonal, Consumer<PathStep> emit
    ) {
        int n = rows * cols;
        int[]     parentRow = new int[n];
        int[]     parentCol = new int[n];
        boolean[] visited   = new boolean[n];
        Arrays.fill(parentRow, -1);
        Arrays.fill(parentCol, -1);

        // [heuristic, row, col]
        PriorityQueue<double[]> pq = new PriorityQueue<>((a, b) -> Double.compare(a[0], b[0]));
        int startIdx = startRow * cols + startCol;
        visited[startIdx] = true;
        pq.add(new double[]{heuristic(startRow, startCol, endRow, endCol, allowDiagonal), startRow, startCol});

        int visitedCount = 0;
        boolean pathFound = false;

        while (!pq.isEmpty()) {
            double[] curr = pq.poll();
            int curRow    = (int) curr[1];
            int curCol    = (int) curr[2];
            int curIdx    = curRow * cols + curCol;

            if (curRow == endRow && curCol == endCol) {
                pathFound = true;
                break;
            }

            emit.accept(new PathStep(PathStepType.VISITED, curRow, curCol, false, ++visitedCount, 0));

            int[][] dirs = allowDiagonal
                    ? new int[][]{{-1,0},{1,0},{0,-1},{0,1},{-1,-1},{-1,1},{1,-1},{1,1}}
                    : new int[][]{{-1,0},{1,0},{0,-1},{0,1}};

            for (int[] d : dirs) {
                int nr = curRow + d[0], nc = curCol + d[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int nIdx = nr * cols + nc;
                if (visited[nIdx] || walls[nIdx]) continue;
                visited[nIdx]   = true;
                parentRow[nIdx] = curRow;
                parentCol[nIdx] = curCol;
                pq.add(new double[]{heuristic(nr, nc, endRow, endCol, allowDiagonal), nr, nc});
                emit.accept(new PathStep(PathStepType.FRONTIER, nr, nc, false, visitedCount, 0));
            }
        }

        int pathLength = 0;
        if (pathFound) {
            pathLength = tracePath(parentRow, parentCol, cols, endRow, endCol, emit);
        }
        emit.accept(new PathStep(PathStepType.DONE, -1, -1, pathFound, visitedCount, pathLength));
    }

    private double heuristic(int row, int col, int endRow, int endCol, boolean diagonal) {
        int dr = Math.abs(row - endRow);
        int dc = Math.abs(col - endCol);
        return diagonal ? Math.max(dr, dc) : dr + dc;
    }

    private int tracePath(int[] parentRow, int[] parentCol, int cols, int endRow, int endCol, Consumer<PathStep> emit) {
        java.util.List<int[]> path = new java.util.ArrayList<>();
        int r = endRow, c = endCol;
        while (parentRow[r * cols + c] != -1) {
            path.add(0, new int[]{r, c});
            int pr = parentRow[r * cols + c]; int pc = parentCol[r * cols + c];
            r = pr; c = pc;
        }
        path.add(0, new int[]{r, c});
        for (int[] cell : path) {
            emit.accept(new PathStep(PathStepType.PATH, cell[0], cell[1], true, 0, path.size()));
        }
        return path.size();
    }

    @Override
    public String getName() { return "Greedy BFS"; }

    @Override
    public PathfindingMetadata getMetadata() {
        return new PathfindingMetadata(
                "Greedy BFS",
                "O(E)", "O(V)",
                "Non", "Oui",
                "Recherche gloutonne par meilleur d'abord. Se guide uniquement par l'heuristique h(n) vers la cible, sans tenir compte du coût réel parcouru. Plus rapide qu'A* en pratique mais non optimal : peut trouver un chemin plus long ou contourner des obstacles inutilement.",
                "https://fr.wikipedia.org/wiki/Algorithme_de_recherche_Best-first"
        );
    }
}