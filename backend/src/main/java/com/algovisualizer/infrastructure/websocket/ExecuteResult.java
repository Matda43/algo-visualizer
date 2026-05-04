package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.DataType;

public record ExecuteResult(
        double[] sortedArray,
        int comparisons,
        int swaps,
        int pivots,
        String sessionId,
        DataType dataType
) {}