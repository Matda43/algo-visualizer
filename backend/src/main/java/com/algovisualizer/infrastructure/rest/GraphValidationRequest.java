package com.algovisualizer.infrastructure.rest;

import com.algovisualizer.domain.model.GraphEdge;

import java.util.List;

/**
 * Requête de validation d'un graphe ou d'un arbre saisi manuellement.
 */
public record GraphValidationRequest(
        int              vertexCount,
        List<GraphEdge>  edges,
        boolean          directed,
        boolean          expectTree,
        String           algorithm    // nom de l'algo pour vérifier la compatibilité (ex: Dijkstra → pas de poids négatifs)
) {}