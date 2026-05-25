package com.algovisualizer.domain.model;

public record PathfindingMetadata(
        String name,
        String timeComplexity,
        String spaceComplexity,
        String optimal,
        String complete,
        String description,
        String wikipediaUrl
) {}