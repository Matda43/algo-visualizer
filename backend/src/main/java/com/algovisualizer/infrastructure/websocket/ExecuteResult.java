package com.algovisualizer.infrastructure.websocket;

public record ExecuteResult(
        int[] sortedArray,
        int comparisons,
        int swaps,
        int pivots,
        String sessionId
) {}
