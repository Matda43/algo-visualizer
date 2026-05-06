package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class SelectionSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            int minIndex = i;
            emit.accept(new SortStep(StepType.PIVOT, i, i, arr.clone()));
            for (int j = i + 1; j < n; j++) {
                emit.accept(new SortStep(StepType.COMPARE, minIndex, j, arr.clone()));
                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }
            }
            if (minIndex != i) {
                double tmp = arr[minIndex];
                arr[minIndex] = arr[i];
                arr[i] = tmp;
                emit.accept(new SortStep(StepType.SWAP, i, minIndex, arr.clone()));
            }
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.SORTED, n - 1, n - 1, arr.clone()));
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Selection Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Selection Sort",
                "O(n²)", "O(n²)", "O(n²)", "O(1)",
                "Algorithme de tri par sélection qui divise la liste en deux parties : triée et non triée. À chaque itération, il sélectionne le minimum de la partie non triée et le place à la fin de la partie triée. Simple mais peu efficace sur de grands tableaux.",
                "https://fr.wikipedia.org/wiki/Tri_par_s%C3%A9lection",
                false,
                Map.of(
                        "Java", """
                    void selectionSort(int[] arr) {
                      int n = arr.length;
                      for (int i = 0; i < n - 1; i++) {
                        int min = i;
                        for (int j = i + 1; j < n; j++)
                          if (arr[j] < arr[min]) min = j;
                        int tmp = arr[min]; arr[min] = arr[i]; arr[i] = tmp;
                      }
                    }""",
                        "Python", """
                      def selection_sort(arr):
                        n = len(arr)
                        for i in range(n - 1):
                          min_idx = i
                          for j in range(i + 1, n):
                            if arr[j] < arr[min_idx]:
                              min_idx = j
                          arr[i], arr[min_idx] = arr[min_idx], arr[i]""",
                        "C++", """
                   void selectionSort(int arr[], int n) {
                     for (int i = 0; i < n - 1; i++) {
                       int min = i;
                       for (int j = i + 1; j < n; j++)
                         if (arr[j] < arr[min]) min = j;
                       swap(arr[i], arr[min]);
                     }
                   }""",
                        "C", """
                 void selectionSort(int arr[], int n) {
                   for (int i = 0; i < n - 1; i++) {
                     int min = i, tmp;
                     for (int j = i + 1; j < n; j++)
                       if (arr[j] < arr[min]) min = j;
                     tmp = arr[min]; arr[min] = arr[i]; arr[i] = tmp;
                   }
                 }""",
                        "C#", """
                  void SelectionSort(int[] arr) {
                    int n = arr.Length;
                    for (int i = 0; i < n - 1; i++) {
                      int min = i;
                      for (int j = i + 1; j < n; j++)
                        if (arr[j] < arr[min]) min = j;
                      (arr[i], arr[min]) = (arr[min], arr[i]);
                    }
                  }""",
                        "JavaScript", """
                          function selectionSort(arr) {
                            const n = arr.length;
                            for (let i = 0; i < n - 1; i++) {
                              let min = i;
                              for (let j = i + 1; j < n; j++)
                                if (arr[j] < arr[min]) min = j;
                              [arr[i], arr[min]] = [arr[min], arr[i]];
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function selectionSort(array &$arr): void {
                     $n = count($arr);
                     for ($i = 0; $i < $n - 1; $i++) {
                       $min = $i;
                       for ($j = $i + 1; $j < $n; $j++)
                         if ($arr[$j] < $arr[$min]) $min = $j;
                       [$arr[$i], $arr[$min]] = [$arr[$min], $arr[$i]];
                     }
                   }"""
                )
        );
    }
}