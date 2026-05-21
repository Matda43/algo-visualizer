package com.algovisualizer.infrastructure.websocket;

public record PathfindingRequest(
        String    algo,
        boolean[] walls,      // grille aplatie [row * cols + col]
        int       rows,
        int       cols,
        int       startRow,
        int       startCol,
        int       endRow,
        int       endCol,
        String    sessionId,
        int       speedMs,
        boolean   allowDiagonal
) {}