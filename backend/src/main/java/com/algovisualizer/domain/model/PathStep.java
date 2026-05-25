package com.algovisualizer.domain.model;

public record PathStep(
        PathStepType type,
        int          row,
        int          col,
        boolean      pathFound,
        int          visitedCount,
        int          pathLength
) {}