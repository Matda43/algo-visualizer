package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class ShellSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        // Séquence de Ciura : gaps optimaux empiriquement
        int[] gaps = {701, 301, 132, 57, 23, 10, 4, 1};

        for (int gap : gaps) {
            if (gap >= n) continue;
            for (int i = gap; i < n; i++) {
                double key = arr[i];
                int j = i;
                emit.accept(new SortStep(StepType.PIVOT, i, i, arr.clone()));
                while (j >= gap) {
                    emit.accept(new SortStep(StepType.COMPARE, j - gap, j, arr.clone()));
                    if (arr[j - gap] <= key) break;
                    arr[j] = arr[j - gap];
                    emit.accept(new SortStep(StepType.SWAP, j - gap, j, arr.clone()));
                    j -= gap;
                }
                arr[j] = key;
            }
        }

        // Marquer tout comme trié une fois terminé
        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Shell Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Shell Sort",
                "O(n log² n)", "O(n²)", "O(n log n)", "O(1)",
                "Généralisation du tri par insertion qui permet l'échange d'éléments distants. Utilise une séquence de gaps décroissants (séquence de Ciura) pour trier d'abord des éléments éloignés puis progressivement adjacents. Bien plus efficace que l'insertion sort.",
                "https://fr.wikipedia.org/wiki/Tri_de_Shell",
                false,
                Map.of(
                        "Java", """
                    void shellSort(int[] arr) {
                      int n = arr.length;
                      int[] gaps = {701, 301, 132, 57, 23, 10, 4, 1};
                      for (int gap : gaps) {
                        for (int i = gap; i < n; i++) {
                          int key = arr[i], j = i;
                          while (j >= gap && arr[j - gap] > key) {
                            arr[j] = arr[j - gap];
                            j -= gap;
                          }
                          arr[j] = key;
                        }
                      }
                    }""",
                        "Python", """
                      def shell_sort(arr):
                        n = len(arr)
                        gaps = [701, 301, 132, 57, 23, 10, 4, 1]
                        for gap in gaps:
                          for i in range(gap, n):
                            key = arr[i]
                            j = i
                            while j >= gap and arr[j - gap] > key:
                              arr[j] = arr[j - gap]
                              j -= gap
                            arr[j] = key""",
                        "C++", """
                   void shellSort(int arr[], int n) {
                     int gaps[] = {701,301,132,57,23,10,4,1};
                     for (int gap : gaps) {
                       for (int i = gap; i < n; i++) {
                         int key = arr[i], j = i;
                         while (j >= gap && arr[j-gap] > key) {
                           arr[j] = arr[j-gap]; j -= gap;
                         }
                         arr[j] = key;
                       }
                     }
                   }""",
                        "C", """
                 void shellSort(int arr[], int n) {
                   int gaps[] = {701,301,132,57,23,10,4,1};
                   for (int g=0;g<8;g++) {
                     int gap=gaps[g];
                     for (int i=gap;i<n;i++) {
                       int key=arr[i], j=i;
                       while (j>=gap && arr[j-gap]>key) {
                         arr[j]=arr[j-gap]; j-=gap;
                       }
                       arr[j]=key;
                     }
                   }
                 }""",
                        "C#", """
                  void ShellSort(int[] arr) {
                    int n = arr.Length;
                    int[] gaps = {701,301,132,57,23,10,4,1};
                    foreach (int gap in gaps) {
                      for (int i = gap; i < n; i++) {
                        int key = arr[i], j = i;
                        while (j >= gap && arr[j-gap] > key) {
                          arr[j] = arr[j-gap]; j -= gap;
                        }
                        arr[j] = key;
                      }
                    }
                  }""",
                        "JavaScript", """
                          function shellSort(arr) {
                            const n = arr.length;
                            const gaps = [701,301,132,57,23,10,4,1];
                            for (const gap of gaps) {
                              for (let i = gap; i < n; i++) {
                                const key = arr[i]; let j = i;
                                while (j >= gap && arr[j-gap] > key) {
                                  arr[j] = arr[j-gap]; j -= gap;
                                }
                                arr[j] = key;
                              }
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function shellSort(array &$arr): void {
                     $n = count($arr);
                     $gaps = [701,301,132,57,23,10,4,1];
                     foreach ($gaps as $gap) {
                       for ($i = $gap; $i < $n; $i++) {
                         $key = $arr[$i]; $j = $i;
                         while ($j >= $gap && $arr[$j-$gap] > $key) {
                           $arr[$j] = $arr[$j-$gap]; $j -= $gap;
                         }
                         $arr[$j] = $key;
                       }
                     }
                   }"""
                )
        );
    }
}