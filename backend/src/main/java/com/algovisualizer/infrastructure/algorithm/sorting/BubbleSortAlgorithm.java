package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class BubbleSortAlgorithm implements SortingAlgorithm {

    @Override
    public List<SortStep> generateSteps(int[] array) {
        List<SortStep> steps = new ArrayList<>();
        int[] arr = array.clone();
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;

            for (int j = 0; j < n - i - 1; j++) {
                steps.add(new SortStep(StepType.COMPARE, j, j + 1, arr.clone()));
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                    swapped = true;
                    steps.add(new SortStep(StepType.SWAP, j, j + 1, arr.clone()));
                }
            }

            steps.add(new SortStep(StepType.SORTED, n - 1 - i, n - 1 - i, arr.clone()));

            // Tableau déjà trié : aucun échange détecté, on arrête
            if (!swapped) {
                for (int k = 0; k < n - 1 - i; k++) {
                    steps.add(new SortStep(StepType.SORTED, k, k, arr.clone()));
                }
                break;
            }
        }

        steps.add(new SortStep(StepType.DONE, -1, -1, arr));
        return steps;
    }

    @Override public String getName() { return "Bubble Sort"; }
    @Override public String getComplexity() { return "O(n²)"; }
    @Override public String getWorstCase() { return "O(n²)"; }
}