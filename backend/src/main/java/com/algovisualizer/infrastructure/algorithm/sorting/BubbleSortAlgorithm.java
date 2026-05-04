package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class BubbleSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                emit.accept(new SortStep(StepType.COMPARE, j, j + 1, arr.clone()));
                if (arr[j] > arr[j + 1]) {
                    double tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
                    swapped = true;
                    emit.accept(new SortStep(StepType.SWAP, j, j + 1, arr.clone()));
                }
            }
            emit.accept(new SortStep(StepType.SORTED, n - 1 - i, n - 1 - i, arr.clone()));
            if (!swapped) {
                for (int k = 0; k < n - 1 - i; k++)
                    emit.accept(new SortStep(StepType.SORTED, k, k, arr.clone()));
                break;
            }
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Bubble Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Bubble Sort",
                "O(n²)", "O(n²)", "O(n)", "O(1)",
                "Algorithme de tri simple qui parcourt répétitivement la liste, compare les éléments adjacents et les échange s'ils sont dans le mauvais ordre. Très inefficace sur de grandes listes mais simple à comprendre et implémenter.",
                "https://fr.wikipedia.org/wiki/Tri_%C3%A0_bulles",
                Map.of(
                        "Java",       """
                          void bubbleSort(int[] arr) {
                            int n = arr.length;
                            for (int i = 0; i < n - 1; i++) {
                              boolean swapped = false;
                              for (int j = 0; j < n - i - 1; j++) {
                                if (arr[j] > arr[j + 1]) {
                                  int tmp = arr[j];
                                  arr[j] = arr[j + 1];
                                  arr[j + 1] = tmp;
                                  swapped = true;
                                }
                              }
                              if (!swapped) break;
                            }
                          }""",
                        "Python",     """
                          def bubble_sort(arr):
                            n = len(arr)
                            for i in range(n - 1):
                              swapped = False
                              for j in range(n - i - 1):
                                if arr[j] > arr[j + 1]:
                                  arr[j], arr[j + 1] = arr[j + 1], arr[j]
                                  swapped = True
                              if not swapped:
                                break""",
                        "C++",        """
                          void bubbleSort(int arr[], int n) {
                            for (int i = 0; i < n - 1; i++) {
                              bool swapped = false;
                              for (int j = 0; j < n - i - 1; j++) {
                                if (arr[j] > arr[j + 1]) {
                                  swap(arr[j], arr[j + 1]);
                                  swapped = true;
                                }
                              }
                              if (!swapped) break;
                            }
                          }""",
                        "C",          """
                          void bubbleSort(int arr[], int n) {
                            for (int i = 0; i < n - 1; i++) {
                              int swapped = 0;
                              for (int j = 0; j < n - i - 1; j++) {
                                if (arr[j] > arr[j + 1]) {
                                  int tmp = arr[j];
                                  arr[j] = arr[j + 1];
                                  arr[j + 1] = tmp;
                                  swapped = 1;
                                }
                              }
                              if (!swapped) break;
                            }
                          }""",
                        "C#",         """
                          void BubbleSort(int[] arr) {
                            int n = arr.Length;
                            for (int i = 0; i < n - 1; i++) {
                              bool swapped = false;
                              for (int j = 0; j < n - i - 1; j++) {
                                if (arr[j] > arr[j + 1]) {
                                  (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);
                                  swapped = true;
                                }
                              }
                              if (!swapped) break;
                            }
                          }""",
                        "JavaScript", """
                          function bubbleSort(arr) {
                            const n = arr.length;
                            for (let i = 0; i < n - 1; i++) {
                              let swapped = false;
                              for (let j = 0; j < n - i - 1; j++) {
                                if (arr[j] > arr[j + 1]) {
                                  [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                                  swapped = true;
                                }
                              }
                              if (!swapped) break;
                            }
                            return arr;
                          }""",
                        "PHP",        """
                          function bubbleSort(array &$arr): void {
                            $n = count($arr);
                            for ($i = 0; $i < $n - 1; $i++) {
                              $swapped = false;
                              for ($j = 0; $j < $n - $i - 1; $j++) {
                                if ($arr[$j] > $arr[$j + 1]) {
                                  [$arr[$j], $arr[$j + 1]] = [$arr[$j + 1], $arr[$j]];
                                  $swapped = true;
                                }
                              }
                              if (!$swapped) break;
                            }
                          }"""
                )
        );
    }
}