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
        } else if (low == high) {
            // Élément seul = trié
            steps.add(new SortStep(StepType.SORTED, low, low, arr.clone()));
        }
    }

    private int medianOfThree(int[] arr, int low, int high) {
        int mid = low + (high - low) / 2;
        // Trier low, mid, high entre eux pour trouver la médiane
        if (arr[low] > arr[mid]) swap(arr, low, mid);
        if (arr[low] > arr[high]) swap(arr, low, high);
        if (arr[mid] > arr[high]) swap(arr, mid, high);
        // arr[mid] est la médiane, on la place en high-1
        swap(arr, mid, high - 1);
        return high - 1;
    }

    private void swap(int[] arr, int i, int j) {
        int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    private int partition(int[] arr, int low, int high, List<SortStep> steps) {
        // Cas de base : 2 éléments ou moins
        if (high - low < 2) {
            steps.add(new SortStep(StepType.COMPARE, low, high, arr.clone()));
            if (arr[low] > arr[high]) {
                swap(arr, low, high);
                steps.add(new SortStep(StepType.SWAP, low, high, arr.clone()));
            }
            steps.add(new SortStep(StepType.SORTED, low, low, arr.clone()));
            return high;
        }

        int pivotIdx = medianOfThree(arr, low, high);
        int pivot = arr[pivotIdx];

        steps.add(new SortStep(StepType.PIVOT, pivotIdx, pivotIdx, arr.clone()));

        // Placer le pivot en high-1 (déjà fait par medianOfThree)
        int i = low;
        int j = high - 1 - 1; // on exclut low, high-1 (pivot), high

        // Schéma de partition de Hoare amélioré
        i = low;
        j = high - 1; // pivot est en high-1, high est >= pivot

        while (true) {
            steps.add(new SortStep(StepType.COMPARE, i, pivotIdx, arr.clone()));
            while (arr[++i] < pivot);

            steps.add(new SortStep(StepType.COMPARE, j, pivotIdx, arr.clone()));
            while (arr[--j] > pivot);

            if (i >= j) break;

            steps.add(new SortStep(StepType.SWAP, i, j, arr.clone()));
            swap(arr, i, j);
        }

        // Replacer le pivot à sa position finale
        swap(arr, i, high - 1);
        steps.add(new SortStep(StepType.SWAP, i, high - 1, arr.clone()));
        steps.add(new SortStep(StepType.SORTED, i, i, arr.clone()));

        return i;
    }

    @Override public String getName() { return "Quick Sort"; }
    @Override public String getComplexity() { return "O(n log n)"; }
    @Override public String getWorstCase() { return "O(n²)"; }
}