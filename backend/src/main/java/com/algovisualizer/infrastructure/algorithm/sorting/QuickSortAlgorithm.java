package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class QuickSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        quickSort(arr, 0, arr.length - 1, emit);
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private void quickSort(double[] arr, int low, int high, Consumer<SortStep> emit) {
        if (low < high) {
            int pivotIdx = partition(arr, low, high, emit);
            quickSort(arr, low, pivotIdx - 1, emit);
            quickSort(arr, pivotIdx + 1, high, emit);
        } else if (low == high) {
            emit.accept(new SortStep(StepType.SORTED, low, low, arr.clone()));
        }
    }

    private int medianOfThree(double[] arr, int low, int high) {
        int mid = low + (high - low) / 2;
        if (arr[low] > arr[mid])  swap(arr, low, mid);
        if (arr[low] > arr[high]) swap(arr, low, high);
        if (arr[mid] > arr[high]) swap(arr, mid, high);
        swap(arr, mid, high - 1);
        return high - 1;
    }

    private void swap(double[] arr, int i, int j) {
        double tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    private int partition(double[] arr, int low, int high, Consumer<SortStep> emit) {
        if (high - low < 2) {
            emit.accept(new SortStep(StepType.COMPARE, low, high, arr.clone()));
            if (arr[low] > arr[high]) {
                swap(arr, low, high);
                emit.accept(new SortStep(StepType.SWAP, low, high, arr.clone()));
            }
            emit.accept(new SortStep(StepType.SORTED, low, low, arr.clone()));
            return high;
        }
        int pivotIdx = medianOfThree(arr, low, high);
        double pivot = arr[pivotIdx];
        emit.accept(new SortStep(StepType.PIVOT, pivotIdx, pivotIdx, arr.clone()));
        int i = low, j = high - 1;
        while (true) {
            emit.accept(new SortStep(StepType.COMPARE, i, pivotIdx, arr.clone()));
            while (arr[++i] < pivot);
            emit.accept(new SortStep(StepType.COMPARE, j, pivotIdx, arr.clone()));
            while (arr[--j] > pivot);
            if (i >= j) break;
            emit.accept(new SortStep(StepType.SWAP, i, j, arr.clone()));
            swap(arr, i, j);
        }
        swap(arr, i, high - 1);
        emit.accept(new SortStep(StepType.SWAP, i, high - 1, arr.clone()));
        emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        return i;
    }

    @Override public String getName()       { return "Quick Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Quick Sort",
                "O(n log n)", "O(n²)", "O(n log n)", "O(log n)",
                "Algorithme de tri par division : choisit un pivot (médiane de trois), partitionne le tableau en deux sous-tableaux puis trie récursivement chaque partie. Très efficace en pratique grâce à la sélection du pivot par médiane de trois.",
                "https://fr.wikipedia.org/wiki/Tri_rapide",
                false,
                Map.of(
                        "Java", """
                    int partition(int[] arr, int low, int high) {
                      int pivot = arr[high], i = low - 1;
                      for (int j = low; j < high; j++) {
                        if (arr[j] <= pivot) {
                          int tmp = arr[++i]; arr[i] = arr[j]; arr[j] = tmp;
                        }
                      }
                      int tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
                      return i + 1;
                    }
                    void quickSort(int[] arr, int low, int high) {
                      if (low < high) {
                        int pi = partition(arr, low, high);
                        quickSort(arr, low, pi - 1);
                        quickSort(arr, pi + 1, high);
                      }
                    }""",
                        "Python", """
                      def quick_sort(arr, low, high):
                        if low < high:
                          pi = partition(arr, low, high)
                          quick_sort(arr, low, pi - 1)
                          quick_sort(arr, pi + 1, high)

                      def partition(arr, low, high):
                        pivot = arr[high]
                        i = low - 1
                        for j in range(low, high):
                          if arr[j] <= pivot:
                            i += 1
                            arr[i], arr[j] = arr[j], arr[i]
                        arr[i+1], arr[high] = arr[high], arr[i+1]
                        return i + 1""",
                        "C++", """
                   int partition(int arr[], int low, int high) {
                     int pivot = arr[high], i = low - 1;
                     for (int j = low; j < high; j++)
                       if (arr[j] <= pivot) swap(arr[++i], arr[j]);
                     swap(arr[i + 1], arr[high]);
                     return i + 1;
                   }
                   void quickSort(int arr[], int low, int high) {
                     if (low < high) {
                       int pi = partition(arr, low, high);
                       quickSort(arr, low, pi - 1);
                       quickSort(arr, pi + 1, high);
                     }
                   }""",
                        "C", """
                 int partition(int arr[], int low, int high) {
                   int pivot = arr[high], i = low - 1, tmp;
                   for (int j = low; j < high; j++) {
                     if (arr[j] <= pivot) {
                       tmp = arr[++i]; arr[i] = arr[j]; arr[j] = tmp;
                     }
                   }
                   tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
                   return i + 1;
                 }
                 void quickSort(int arr[], int low, int high) {
                   if (low < high) {
                     int pi = partition(arr, low, high);
                     quickSort(arr, low, pi - 1);
                     quickSort(arr, pi + 1, high);
                   }
                 }""",
                        "C#", """
                  int Partition(int[] arr, int low, int high) {
                    int pivot = arr[high], i = low - 1;
                    for (int j = low; j < high; j++) {
                      if (arr[j] <= pivot)
                        (arr[++i], arr[j]) = (arr[j], arr[i]);
                    }
                    (arr[i+1], arr[high]) = (arr[high], arr[i+1]);
                    return i + 1;
                  }
                  void QuickSort(int[] arr, int low, int high) {
                    if (low < high) {
                      int pi = Partition(arr, low, high);
                      QuickSort(arr, low, pi - 1);
                      QuickSort(arr, pi + 1, high);
                    }
                  }""",
                        "JavaScript", """
                          function quickSort(arr, low = 0, high = arr.length - 1) {
                            if (low < high) {
                              const pi = partition(arr, low, high);
                              quickSort(arr, low, pi - 1);
                              quickSort(arr, pi + 1, high);
                            }
                            return arr;
                          }
                          function partition(arr, low, high) {
                            const pivot = arr[high]; let i = low - 1;
                            for (let j = low; j < high; j++)
                              if (arr[j] <= pivot) [arr[++i], arr[j]] = [arr[j], arr[i]];
                            [arr[i+1], arr[high]] = [arr[high], arr[i+1]];
                            return i + 1;
                          }""",
                        "PHP", """
                   function quickSort(array &$arr, int $low, int $high): void {
                     if ($low < $high) {
                       $pi = partition($arr, $low, $high);
                       quickSort($arr, $low, $pi - 1);
                       quickSort($arr, $pi + 1, $high);
                     }
                   }
                   function partition(array &$arr, int $low, int $high): int {
                     $pivot = $arr[$high]; $i = $low - 1;
                     for ($j = $low; $j < $high; $j++)
                       if ($arr[$j] <= $pivot) [$arr[++$i], $arr[$j]] = [$arr[$j], $arr[$i]];
                     [$arr[$i+1], $arr[$high]] = [$arr[$high], $arr[$i+1]];
                     return $i + 1;
                   }"""
                )
        );
    }
}