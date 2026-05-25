package com.algovisualizer.domain.model;

/**
 * Élément posable sur la grille (ex : Mur, Eau, Forêt…).
 * Chaque cellule de la grille référence le nom de son élément.
 */
public record GridElement(
        String name,
        String hexColor,
        double cardinalWeight,
        boolean deletable
) {
    /** Élément "Mur" par défaut — non supprimable, poids infini (bloquant). */
    public static GridElement wall() {
        return new GridElement("Mur", "#1c1c1c", Double.MAX_VALUE, false);
    }
}