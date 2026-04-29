package com.algovisualizer.domain.model;

public record SortStep(
        StepType type,
        int indexA,
        int indexB,
        int[] stateSnapshot
) {}
