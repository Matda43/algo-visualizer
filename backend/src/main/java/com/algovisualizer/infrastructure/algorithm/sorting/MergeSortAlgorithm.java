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
            int mid = (left + right) / 2;
            mergeSort(arr, left, mid, steps);
            mergeSort(arr, mid + 1, right, steps);
            merge(arr, left, mid, right, steps);
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
    }

    @Override public String getName() { return "Merge Sort"; }
    @Override public String getComplexity() { return "O(n log n)"; }
    @Override public String getWorstCase() { return "O(n log n)"; }
}