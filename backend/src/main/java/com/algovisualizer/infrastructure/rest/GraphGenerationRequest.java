package com.algovisualizer.infrastructure.rest;

/**
 * Requête de génération de graphe ou d'arbre.
 *
 * @param vertexCount  nombre de sommets
 * @param directed     true = graphe orienté
 * @param tree         true = générer un arbre (graphe connexe acyclique)
 * @param minWeight    poids minimum des arêtes
 * @param maxWeight    poids maximum des arêtes
 */
public record GraphGenerationRequest(
        int     vertexCount,
        boolean directed,
        boolean tree,
        double  minWeight,
        double  maxWeight
) {}