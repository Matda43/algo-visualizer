package com.algovisualizer.infrastructure.websocket;

public record SpeedRequest(
        String sessionId,
        int speedMs
) {}