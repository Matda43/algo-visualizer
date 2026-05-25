package com.algovisualizer.domain.model;

/**
 * Données d'une cellule de la grille.
 *
 * @param x             colonne (0-based)
 * @param y             ligne (0-based)
 * @param elementName   nom de l'élément (null = cellule vide / sol)
 */
public record GridCellData(int x, int y, String elementName) {}