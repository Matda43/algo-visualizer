package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class MergeSortAlgorithm implements SortingAlgorithm {

    @Override
    public List<SortStep> generateSteps(int[] array) {
        List<SortStep> steps = new ArrayList<>();
        int[] arr = array.clone();
        mergeSort(arr, 0, arr.length - 1, steps);
        steps.add(new SortStep(StepType.DONE, -1, -1, arr));
        return steps;
    }

    private void mergeSort(int[] arr, int left, int right, List<SortStep> steps) {
        if (left < right) {
            int mid = left + (right - left) / 2;
            mergeSort(arr, left, mid, steps);
            mergeSort(arr, mid + 1, right, steps);

            // Optimisation : déjà trié, pas besoin de merger
            steps.add(new SortStep(StepType.COMPARE, mid, mid + 1, arr.clone()));
            if (arr[mid] <= arr[mid + 1]) {
                // Les deux moitiés sont déjà dans l'ordre
                for (int k = left; k <= right; k++) {
                    steps.add(new SortStep(StepType.SORTED, k, k, arr.clone()));
                }
                return;
            }

            merge(arr, left, mid, right, steps);
        } else if (left == right) {
            steps.add(new SortStep(StepType.SORTED, left, left, arr.clone()));
        }
    }

    private void merge(int[] arr, int left, int mid, int right, List<SortStep> steps) {
        int[] tmp = arr.clone();
        int i = left, j = mid + 1, k = left;

        while (i <= mid && j <= right) {
            steps.add(new SortStep(StepType.COMPARE, i, j, arr.clone()));
            if (tmp[i] <= tmp[j]) {
                arr[k++] = tmp[i++];
            } else {
                arr[k++] = tmp[j++];
            }
            steps.add(new SortStep(StepType.SWAP, k - 1, k - 1, arr.clone()));
        }
        while (i <= mid) arr[k++] = tmp[i++];
        while (j <= right) arr[k++] = tmp[j++];

        // Marquer la zone mergée comme triée uniquement si c'est le merge final
        if (left == 0 && right == arr.length - 1) {
            for (int idx = 0; idx < arr.length; idx++) {
                steps.add(new SortStep(StepType.SORTED, idx, idx, arr.clone()));
            }
        }
    }

    @Override public String getName() { return "Merge Sort"; }
    @Override public String getComplexity() { return "O(n log n)"; }
    @Override public String getWorstCase() { return "O(n log n)"; }
}