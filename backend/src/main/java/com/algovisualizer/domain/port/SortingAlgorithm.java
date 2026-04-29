package com.algovisualizer.domain.port;

import com.algovisualizer.domain.model.SortStep;
import java.util.List;

public interface SortingAlgorithm {
    List<SortStep> generateSteps(int[] array);
    String getName();
    String getComplexity();
    String getWorstCase();
}
