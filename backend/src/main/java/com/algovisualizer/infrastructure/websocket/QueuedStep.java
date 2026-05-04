package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.StepType;

public record QueuedStep(
        StepType type,
        int      indexA,
        int      indexB,
        double[] stateSnapshot,
        boolean  isEnd
) {
    public static QueuedStep end() {
        return new QueuedStep(null, -1, -1, new double[0], true);
    }
}