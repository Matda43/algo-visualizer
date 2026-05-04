package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.DataType;

public record StartSessionRequest(
        String   algo,
        double[] array,
        String   sessionId,
        DataType dataType,
        int      speedMs
) {}