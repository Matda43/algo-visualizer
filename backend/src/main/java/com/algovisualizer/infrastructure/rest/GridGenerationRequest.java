package com.algovisualizer.infrastructure.rest;

/**
 * Requête de génération de grille combinée terrain + murs.
 *
 * @param terrainType  "none" | "terrain-islands" | "terrain-dungeon"
 * @param wallType     "none" | "maze-recursive" | "random" | "borders" | "dense"
 * @param rows         nombre de lignes
 * @param cols         nombre de colonnes
 * @param density      densité de murs pour "random" (0.0–1.0, défaut 0.30)
 */
public record GridGenerationRequest(
        String terrainType,
        String wallType,
        int    rows,
        int    cols,
        double density
) {}