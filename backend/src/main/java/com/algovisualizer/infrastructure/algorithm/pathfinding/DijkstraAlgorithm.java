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
public class DijkstraAlgorithm implements PathfindingAlgorithm {

    @Override
    public void findPath(
            boolean[] walls, int rows, int cols,
            int startRow, int startCol, int endRow, int endCol,
            boolean allowDiagonal, Consumer<PathStep> emit
    ) {
        int n = rows * cols;
        double[]  dist      = new double[n];
        int[]     parentRow = new int[n];
        int[]     parentCol = new int[n];
        boolean[] visited   = new boolean[n];
        Arrays.fill(dist,      Double.MAX_VALUE);
        Arrays.fill(parentRow, -1);
        Arrays.fill(parentCol, -1);

        int startIdx = startRow * cols + startCol;
        dist[startIdx] = 0;

        // [dist, row, col]
        PriorityQueue<double[]> pq = new PriorityQueue<>((a, b) -> Double.compare(a[0], b[0]));
        pq.add(new double[]{0, startRow, startCol});

        int visitedCount = 0;
        boolean pathFound = false;

        while (!pq.isEmpty()) {
            double[] curr     = pq.poll();
            int      curRow   = (int) curr[1];
            int      curCol   = (int) curr[2];
            int      curIdx   = curRow * cols + curCol;

            if (visited[curIdx]) continue;
            visited[curIdx] = true;

            if (curRow == endRow && curCol == endCol) {
                pathFound = true;
                break;
            }

            emit.accept(new PathStep(PathStepType.VISITED, curRow, curCol, false, ++visitedCount, 0));

            int[][] dirs = allowDiagonal
                    ? new int[][]{{-1,0},{1,0},{0,-1},{0,1},{-1,-1},{-1,1},{1,-1},{1,1}}
                    : new int[][]{{-1,0},{1,0},{0,-1},{0,1}};

            for (int[] d : dirs) {
                int    nr       = curRow + d[0], nc = curCol + d[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int    nIdx     = nr * cols + nc;
                if (visited[nIdx] || walls[nIdx]) continue;
                double edgeWeight = (d[0] != 0 && d[1] != 0) ? Math.sqrt(2) : 1.0;
                double newDist    = dist[curIdx] + edgeWeight;
                if (newDist < dist[nIdx]) {
                    dist[nIdx]      = newDist;
                    parentRow[nIdx] = curRow;
                    parentCol[nIdx] = curCol;
                    pq.add(new double[]{newDist, nr, nc});
                    emit.accept(new PathStep(PathStepType.FRONTIER, nr, nc, false, visitedCount, 0));
                }
            }
        }

        int pathLength = 0;
        if (pathFound) {
            pathLength = tracePath(parentRow, parentCol, cols, endRow, endCol, emit);
        }
        emit.accept(new PathStep(PathStepType.DONE, -1, -1, pathFound, visitedCount, pathLength));
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
    public String getName() { return "Dijkstra"; }

    @Override
    public PathfindingMetadata getMetadata() {
        return new PathfindingMetadata(
                "Dijkstra",
                "O((V + E) log V)", "O(V)",
                "Oui (poids positifs)", "Oui",
                "Algorithme de plus court chemin à source unique de Edsger Dijkstra (1956). Explore les nœuds par ordre de distance croissante via une file de priorité. Garantit le chemin optimal sur des graphes à poids positifs. Les diagonales ont un poids √2.",
                "https://fr.wikipedia.org/wiki/Algorithme_de_Dijkstra"
        );
    }
}