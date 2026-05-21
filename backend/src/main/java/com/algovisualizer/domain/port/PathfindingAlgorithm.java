package com.algovisualizer.domain.port;

import com.algovisualizer.domain.model.PathStep;
import com.algovisualizer.domain.model.PathfindingMetadata;

import java.util.function.Consumer;

public interface PathfindingAlgorithm {

    void findPath(
            boolean[] walls,
            int       rows,
            int       cols,
            int       startRow,
            int       startCol,
            int       endRow,
            int       endCol,
            boolean   allowDiagonal,
            Consumer<PathStep> emit
    );

    String getName();

    PathfindingMetadata getMetadata();
}