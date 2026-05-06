package com.algovisualizer.infrastructure.websocket;

public record NextBatchRequest(String sessionId, int batchSize) {}