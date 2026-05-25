package com.algovisualizer.domain.model;

import java.util.List;

/**
 * Réponse des endpoints de génération de grille.
 */
public record GeneratedGrid(
        int                  rows,
        int                  cols,
        List<GridCellData>   cells,
        int                  startX,
        int                  startY,
        int                  endX,
        int                  endY
) {}