package com.algovisualizer.domain.port;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;

import java.util.function.Consumer;

public interface SortingAlgorithm {

    void generateSteps(double[] array, Consumer<SortStep> emitter);
    String getName();
    AlgoMetadata getMetadata();
}