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
public class AStarAlgorithm implements PathfindingAlgorithm {

    @Override
    public void findPath(
            boolean[] walls, int rows, int cols,
            int startRow, int startCol, int endRow, int endCol,
            boolean allowDiagonal, Consumer<PathStep> emit
    ) {
        int n = rows * cols;
        double[]  gScore    = new double[n];
        int[]     parentRow = new int[n];
        int[]     parentCol = new int[n];
        boolean[] closed    = new boolean[n];
        Arrays.fill(gScore,    Double.MAX_VALUE);
        Arrays.fill(parentRow, -1);
        Arrays.fill(parentCol, -1);

        int startIdx = startRow * cols + startCol;
        gScore[startIdx] = 0;

        // [fScore, row, col]
        PriorityQueue<double[]> openSet = new PriorityQueue<>((a, b) -> Double.compare(a[0], b[0]));
        openSet.add(new double[]{heuristic(startRow, startCol, endRow, endCol, allowDiagonal), startRow, startCol});

        int visitedCount = 0;
        boolean pathFound = false;

        while (!openSet.isEmpty()) {
            double[] curr   = openSet.poll();
            int curRow      = (int) curr[1];
            int curCol      = (int) curr[2];
            int curIdx      = curRow * cols + curCol;

            if (closed[curIdx]) continue;
            closed[curIdx] = true;

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
                if (closed[nIdx] || walls[nIdx]) continue;
                double edgeWeight  = (d[0] != 0 && d[1] != 0) ? Math.sqrt(2) : 1.0;
                double tentativeG  = gScore[curIdx] + edgeWeight;
                if (tentativeG < gScore[nIdx]) {
                    gScore[nIdx]    = tentativeG;
                    parentRow[nIdx] = curRow;
                    parentCol[nIdx] = curCol;
                    double fScore   = tentativeG + heuristic(nr, nc, endRow, endCol, allowDiagonal);
                    openSet.add(new double[]{fScore, nr, nc});
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

    /**
     * Heuristique : distance de Chebyshev si diagonales autorisées, Manhattan sinon.
     * Toutes deux sont admissibles pour leurs contextes respectifs.
     */
    private double heuristic(int row, int col, int endRow, int endCol, boolean diagonal) {
        int dr = Math.abs(row - endRow);
        int dc = Math.abs(col - endCol);
        if (diagonal) return Math.max(dr, dc); // Chebyshev
        return dr + dc;                         // Manhattan
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
    public String getName() { return "A*"; }

    @Override
    public PathfindingMetadata getMetadata() {
        return new PathfindingMetadata(
                "A*",
                "O(E)", "O(V)",
                "Oui (heuristique admissible)", "Oui",
                "Algorithme de recherche heuristique qui combine le coût réel g(n) et une estimation h(n) vers la cible. Utilise la distance de Manhattan (sans diagonales) ou Chebyshev (avec). Plus efficace que Dijkstra car guidé vers la destination. Optimal si l'heuristique est admissible.",
                "https://fr.wikipedia.org/wiki/Algorithme_A*"
        );
    }
}