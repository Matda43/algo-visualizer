package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class HeapSortAlgorithm implements SortingAlgorithm {

    @Override
    public List<SortStep> generateSteps(int[] array) {
        List<SortStep> steps = new ArrayList<>();
        int[] arr = array.clone();
        int n = arr.length;

        for (int i = n / 2 - 1; i >= 0; i--)
            heapify(arr, n, i, steps);

        for (int i = n - 1; i > 0; i--) {
            steps.add(new SortStep(StepType.SWAP, 0, i, arr.clone()));
            int tmp = arr[0]; arr[0] = arr[i]; arr[i] = tmp;
            steps.add(new SortStep(StepType.SORTED, i, i, arr.clone()));
            heapify(arr, i, 0, steps);
        }
        steps.add(new SortStep(StepType.DONE, -1, -1, arr));
        return steps;
    }

    private void heapify(int[] arr, int n, int i, List<SortStep> steps) {
        int largest = i, left = 2 * i + 1, right = 2 * i + 2;

        if (left < n) {
            steps.add(new SortStep(StepType.COMPARE, largest, left, arr.clone()));
            if (arr[left] > arr[largest]) largest = left;
        }
        if (right < n) {
            steps.add(new SortStep(StepType.COMPARE, largest, right, arr.clone()));
            if (arr[right] > arr[largest]) largest = right;
        }
        if (largest != i) {
            int tmp = arr[i]; arr[i] = arr[largest]; arr[largest] = tmp;
            steps.add(new SortStep(StepType.SWAP, i, largest, arr.clone()));
            heapify(arr, n, largest, steps);
        }
    }

    @Override public String getName() { return "Heap Sort"; }
    @Override public String getComplexity() { return "O(n log n)"; }
    @Override public String getWorstCase() { return "O(n log n)"; }
}