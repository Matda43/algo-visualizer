package com.algovisualizer.domain.model;

public enum PathStepType {
    VISITED,   // Cellule explorée
    FRONTIER,  // Cellule en file d'attente / frontière
    PATH,      // Cellule appartenant au chemin final
    DONE       // Algorithme terminé
}