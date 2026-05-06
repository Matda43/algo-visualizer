package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class InsertionSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        emit.accept(new SortStep(StepType.SORTED, 0, 0, arr.clone()));

        for (int i = 1; i < n; i++) {
            double key = arr[i];
            int j = i - 1;
            emit.accept(new SortStep(StepType.PIVOT, i, i, arr.clone()));
            while (j >= 0 && arr[j] > key) {
                emit.accept(new SortStep(StepType.COMPARE, j, j + 1, arr.clone()));
                arr[j + 1] = arr[j];
                emit.accept(new SortStep(StepType.SWAP, j, j + 1, arr.clone()));
                j--;
            }
            arr[j + 1] = key;
            emit.accept(new SortStep(StepType.SORTED, j + 1, j + 1, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Insertion Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Insertion Sort",
                "O(n²)", "O(n²)", "O(n)", "O(1)",
                "Algorithme de tri par insertion qui construit le tableau trié un élément à la fois. Chaque nouvel élément est inséré à la bonne position dans la partie déjà triée. Très efficace sur les petits tableaux ou les tableaux presque triés.",
                "https://fr.wikipedia.org/wiki/Tri_par_insertion",
                true,
                Map.of(
                        "Java", """
                    void insertionSort(int[] arr) {
                      int n = arr.length;
                      for (int i = 1; i < n; i++) {
                        int key = arr[i], j = i - 1;
                        while (j >= 0 && arr[j] > key) {
                          arr[j + 1] = arr[j];
                          j--;
                        }
                        arr[j + 1] = key;
                      }
                    }""",
                        "Python", """
                      def insertion_sort(arr):
                        for i in range(1, len(arr)):
                          key = arr[i]
                          j = i - 1
                          while j >= 0 and arr[j] > key:
                            arr[j + 1] = arr[j]
                            j -= 1
                          arr[j + 1] = key""",
                        "C++", """
                   void insertionSort(int arr[], int n) {
                     for (int i = 1; i < n; i++) {
                       int key = arr[i], j = i - 1;
                       while (j >= 0 && arr[j] > key) {
                         arr[j + 1] = arr[j];
                         j--;
                       }
                       arr[j + 1] = key;
                     }
                   }""",
                        "C", """
                 void insertionSort(int arr[], int n) {
                   for (int i = 1; i < n; i++) {
                     int key = arr[i], j = i - 1;
                     while (j >= 0 && arr[j] > key) {
                       arr[j + 1] = arr[j];
                       j--;
                     }
                     arr[j + 1] = key;
                   }
                 }""",
                        "C#", """
                  void InsertionSort(int[] arr) {
                    int n = arr.Length;
                    for (int i = 1; i < n; i++) {
                      int key = arr[i], j = i - 1;
                      while (j >= 0 && arr[j] > key) {
                        arr[j + 1] = arr[j];
                        j--;
                      }
                      arr[j + 1] = key;
                    }
                  }""",
                        "JavaScript", """
                          function insertionSort(arr) {
                            const n = arr.length;
                            for (let i = 1; i < n; i++) {
                              const key = arr[i];
                              let j = i - 1;
                              while (j >= 0 && arr[j] > key) {
                                arr[j + 1] = arr[j];
                                j--;
                              }
                              arr[j + 1] = key;
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function insertionSort(array &$arr): void {
                     $n = count($arr);
                     for ($i = 1; $i < $n; $i++) {
                       $key = $arr[$i];
                       $j = $i - 1;
                       while ($j >= 0 && $arr[$j] > $key) {
                         $arr[$j + 1] = $arr[$j];
                         $j--;
                       }
                       $arr[$j + 1] = $key;
                     }
                   }"""
                )
        );
    }
}