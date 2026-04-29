package com.algovisualizer.infrastructure.websocket;

public record StartSessionRequest(
        String algo,
        int[] array,
        String sessionId
) {}
