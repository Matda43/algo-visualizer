package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class QuickSortAlgorithm implements SortingAlgorithm {

    @Override
    public List<SortStep> generateSteps(int[] array) {
        List<SortStep> steps = new ArrayList<>();
        int[] arr = array.clone();
        quickSort(arr, 0, arr.length - 1, steps);
        steps.add(new SortStep(StepType.DONE, -1, -1, arr));
        return steps;
    }

    private void quickSort(int[] arr, int low, int high, List<SortStep> steps) {
        if (low < high) {
            int pivotIdx = partition(arr, low, high, steps);
            quickSort(arr, low, pivotIdx - 1, steps);
            quickSort(arr, pivotIdx + 1, high, steps);
        }
    }

    private int partition(int[] arr, int low, int high, List<SortStep> steps) {
        int pivot = arr[high];
        steps.add(new SortStep(StepType.PIVOT, high, high, arr.clone()));
        int i = low - 1;

        for (int j = low; j < high; j++) {
            steps.add(new SortStep(StepType.COMPARE, j, high, arr.clone()));
            if (arr[j] <= pivot) {
                i++;
                int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
                steps.add(new SortStep(StepType.SWAP, i, j, arr.clone()));
            }
        }
        int tmp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = tmp;
        steps.add(new SortStep(StepType.SWAP, i + 1, high, arr.clone()));
        return i + 1;
    }

    @Override public String getName() { return "Quick Sort"; }
    @Override public String getComplexity() { return "O(n log n)"; }
    @Override public String getWorstCase() { return "O(n²)"; }
}