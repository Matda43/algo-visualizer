package com.algovisualizer.domain.model;

import java.util.List;

/**
 * Réponse des endpoints de génération de graphe ou d'arbre.
 */
public record GeneratedGraph(
        int              vertexCount,
        List<GraphEdge>  edges,
        boolean          directed,
        boolean          isTree,
        List<String>     validationErrors
) {}