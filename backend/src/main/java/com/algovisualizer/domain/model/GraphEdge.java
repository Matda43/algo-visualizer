package com.algovisualizer.domain.model;

/**
 * Arête d'un graphe ou d'un arbre.
 *
 * @param from          indice du sommet source
 * @param to            indice du sommet destination
 * @param weight        poids de l'arête (1.0 par défaut pour les arbres)
 */
public record GraphEdge(int from, int to, double weight) {}