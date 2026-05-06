package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class IntroSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int maxDepth = 2 * (int) (Math.log(arr.length) / Math.log(2));
        introSort(arr, 0, arr.length - 1, maxDepth, emit);
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private void introSort(double[] arr, int low, int high, int depthLimit, Consumer<SortStep> emit) {
        int size = high - low + 1;
        if (size <= 1) {
            if (low >= 0 && low <= high)
                emit.accept(new SortStep(StepType.SORTED, low, low, arr.clone()));
            return;
        }
        if (size <= 16) {
            insertionSortRange(arr, low, high, emit);
            return;
        }
        if (depthLimit == 0) {
            heapSortRange(arr, low, high, emit);
            return;
        }
        int pivotIdx = medianOfThree(arr, low, low + size / 2, high, emit);
        swap(arr, pivotIdx, high);
        int partitionIdx = partition(arr, low, high, emit);
        emit.accept(new SortStep(StepType.SORTED, partitionIdx, partitionIdx, arr.clone()));
        introSort(arr, low, partitionIdx - 1, depthLimit - 1, emit);
        introSort(arr, partitionIdx + 1, high, depthLimit - 1, emit);
    }

    private int medianOfThree(double[] arr, int a, int b, int c, Consumer<SortStep> emit) {
        emit.accept(new SortStep(StepType.COMPARE, a, b, arr.clone()));
        emit.accept(new SortStep(StepType.COMPARE, b, c, arr.clone()));
        if (arr[a] < arr[b]) {
            if (arr[b] < arr[c]) return b;
            else if (arr[a] < arr[c]) return c;
            else return a;
        } else {
            if (arr[a] < arr[c]) return a;
            else if (arr[b] < arr[c]) return c;
            else return b;
        }
    }

    private int partition(double[] arr, int low, int high, Consumer<SortStep> emit) {
        double pivot = arr[high];
        emit.accept(new SortStep(StepType.PIVOT, high, high, arr.clone()));
        int i = low - 1;
        for (int j = low; j < high; j++) {
            emit.accept(new SortStep(StepType.COMPARE, j, high, arr.clone()));
            if (arr[j] <= pivot) {
                i++;
                swap(arr, i, j);
                if (i != j) emit.accept(new SortStep(StepType.SWAP, i, j, arr.clone()));
            }
        }
        swap(arr, i + 1, high);
        emit.accept(new SortStep(StepType.SWAP, i + 1, high, arr.clone()));
        return i + 1;
    }

    private void insertionSortRange(double[] arr, int low, int high, Consumer<SortStep> emit) {
        for (int i = low + 1; i <= high; i++) {
            double key = arr[i];
            int j = i - 1;
            emit.accept(new SortStep(StepType.PIVOT, i, i, arr.clone()));
            while (j >= low && arr[j] > key) {
                emit.accept(new SortStep(StepType.COMPARE, j, j + 1, arr.clone()));
                arr[j + 1] = arr[j];
                emit.accept(new SortStep(StepType.SWAP, j, j + 1, arr.clone()));
                j--;
            }
            arr[j + 1] = key;
            emit.accept(new SortStep(StepType.SORTED, j + 1, j + 1, arr.clone()));
        }
        emit.accept(new SortStep(StepType.SORTED, low, low, arr.clone()));
    }

    private void heapSortRange(double[] arr, int low, int high, Consumer<SortStep> emit) {
        int n = high - low + 1;
        for (int i = n / 2 - 1; i >= 0; i--)
            heapify(arr, n, i, low, emit);
        for (int i = n - 1; i > 0; i--) {
            swap(arr, low, low + i);
            emit.accept(new SortStep(StepType.SWAP, low, low + i, arr.clone()));
            emit.accept(new SortStep(StepType.SORTED, low + i, low + i, arr.clone()));
            heapify(arr, i, 0, low, emit);
        }
        emit.accept(new SortStep(StepType.SORTED, low, low, arr.clone()));
    }

    private void heapify(double[] arr, int n, int i, int offset, Consumer<SortStep> emit) {
        int largest = i, left = 2 * i + 1, right = 2 * i + 2;
        if (left < n) {
            emit.accept(new SortStep(StepType.COMPARE, offset + largest, offset + left, arr.clone()));
            if (arr[offset + left] > arr[offset + largest]) largest = left;
        }
        if (right < n) {
            emit.accept(new SortStep(StepType.COMPARE, offset + largest, offset + right, arr.clone()));
            if (arr[offset + right] > arr[offset + largest]) largest = right;
        }
        if (largest != i) {
            swap(arr, offset + i, offset + largest);
            emit.accept(new SortStep(StepType.SWAP, offset + i, offset + largest, arr.clone()));
            heapify(arr, n, largest, offset, emit);
        }
    }

    private void swap(double[] arr, int i, int j) {
        double tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    @Override
    public String getName() { return "Introsort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Introsort",
                "O(n log n)", "O(n log n)", "O(n log n)", "O(log n)",
                "Algorithme hybride utilisé par la STL C++ et .NET. Commence par un tri rapide, bascule vers le tri par tas si la profondeur de récursion dépasse 2·log(n), et utilise le tri par insertion pour les petits sous-tableaux (≤16 éléments). Combine les avantages des trois approches.",
                "https://fr.wikipedia.org/wiki/Introsort",
                false,
                Map.of(
                        "Java", """
                    void introSort(int[] arr, int low, int high, int depth) {
                      if (high - low < 16) { insertionSort(arr, low, high); return; }
                      if (depth == 0)      { heapSort(arr, low, high); return; }
                      int p = partition(arr, low, high);
                      introSort(arr, low, p - 1, depth - 1);
                      introSort(arr, p + 1, high, depth - 1);
                    }
                    void sort(int[] arr) {
                      int depth = 2 * (int)(Math.log(arr.length)/Math.log(2));
                      introSort(arr, 0, arr.length - 1, depth);
                    }""",
                        "Python", """
                      import math
                      def introsort(arr, low, high, depth):
                        if high - low < 16:
                          insertion_sort(arr, low, high)
                          return
                        if depth == 0:
                          heap_sort(arr, low, high)
                          return
                        p = partition(arr, low, high)
                        introsort(arr, low, p-1, depth-1)
                        introsort(arr, p+1, high, depth-1)
                      def sort(arr):
                        depth = 2 * int(math.log2(len(arr)))
                        introsort(arr, 0, len(arr)-1, depth)""",
                        "C++", """
                   void introSort(int* arr, int low, int high, int depth) {
                     if (high-low<16) { insertionSort(arr,low,high); return; }
                     if (depth==0)    { heapSort(arr,low,high); return; }
                     int p=partition(arr,low,high);
                     introSort(arr,low,p-1,depth-1);
                     introSort(arr,p+1,high,depth-1);
                   }
                   void sort(int* arr, int n) {
                     introSort(arr,0,n-1,2*(int)log2(n));
                   }""",
                        "C", """
                 void introSort(int* arr, int low, int high, int depth) {
                   if (high-low<16) { insertionSort(arr,low,high); return; }
                   if (depth==0)    { heapSort(arr,low,high); return; }
                   int p=partition(arr,low,high);
                   introSort(arr,low,p-1,depth-1);
                   introSort(arr,p+1,high,depth-1);
                 }""",
                        "C#", """
                  void IntroSort(int[] arr, int low, int high, int depth) {
                    if (high-low<16) { InsertionSort(arr,low,high); return; }
                    if (depth==0)    { HeapSort(arr,low,high); return; }
                    int p=Partition(arr,low,high);
                    IntroSort(arr,low,p-1,depth-1);
                    IntroSort(arr,p+1,high,depth-1);
                  }""",
                        "JavaScript", """
                          function introSort(arr, low, high, depth) {
                            if (high-low<16) { insertionSort(arr,low,high); return; }
                            if (depth===0)   { heapSort(arr,low,high); return; }
                            const p=partition(arr,low,high);
                            introSort(arr,low,p-1,depth-1);
                            introSort(arr,p+1,high,depth-1);
                          }
                          function sort(arr) {
                            introSort(arr,0,arr.length-1,2*Math.floor(Math.log2(arr.length)));
                          }""",
                        "PHP", """
                   function introSort(array &$arr, int $low, int $high, int $depth): void {
                     if ($high-$low<16) { insertionSort($arr,$low,$high); return; }
                     if ($depth===0)    { heapSort($arr,$low,$high); return; }
                     $p=partition($arr,$low,$high);
                     introSort($arr,$low,$p-1,$depth-1);
                     introSort($arr,$p+1,$high,$depth-1);
                   }"""
                )
        );
    }
}