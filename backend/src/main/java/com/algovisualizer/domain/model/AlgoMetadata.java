package com.algovisualizer.domain.model;

public record AlgoMetadata(
        String name,
        String complexity,
        String worstCase,
        String bestCase,
        String spaceComplexity,
        String description,
        String wikipediaUrl,
        boolean stableSort,
        java.util.Map<String, String> codeByLanguage
) {}