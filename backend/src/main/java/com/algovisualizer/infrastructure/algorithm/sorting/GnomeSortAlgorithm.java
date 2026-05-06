package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class GnomeSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;
        int index = 0;

        while (index < n) {
            if (index == 0) {
                index++;
            } else {
                emit.accept(new SortStep(StepType.COMPARE, index - 1, index, arr.clone()));
                if (arr[index] >= arr[index - 1]) {
                    index++;
                } else {
                    double tmp = arr[index]; arr[index] = arr[index - 1]; arr[index - 1] = tmp;
                    emit.accept(new SortStep(StepType.SWAP, index - 1, index, arr.clone()));
                    index--;
                }
            }
        }

        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Gnome Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Gnome Sort",
                "O(n²)", "O(n²)", "O(n)", "O(1)",
                "Algorithme de tri simple inspiré du comportement d'un gnome de jardin qui range des pots de fleurs. Compare deux éléments adjacents, les échange si nécessaire et recule, sinon avance. Similaire au tri par insertion mais sans boucle imbriquée explicite.",
                "https://fr.wikipedia.org/wiki/Tri_gnome",
                false,
                Map.of(
                        "Java", """
                    void gnomeSort(int[] arr) {
                      int n = arr.length, i = 0;
                      while (i < n) {
                        if (i == 0 || arr[i] >= arr[i-1]) i++;
                        else {
                          int tmp = arr[i]; arr[i] = arr[i-1]; arr[i-1] = tmp;
                          i--;
                        }
                      }
                    }""",
                        "Python", """
                      def gnome_sort(arr):
                        i = 0
                        while i < len(arr):
                          if i == 0 or arr[i] >= arr[i-1]:
                            i += 1
                          else:
                            arr[i], arr[i-1] = arr[i-1], arr[i]
                            i -= 1""",
                        "C++", """
                   void gnomeSort(int arr[], int n) {
                     int i = 0;
                     while (i < n) {
                       if (i == 0 || arr[i] >= arr[i-1]) i++;
                       else { swap(arr[i], arr[i-1]); i--; }
                     }
                   }""",
                        "C", """
                 void gnomeSort(int arr[], int n) {
                   int i=0, tmp;
                   while (i < n) {
                     if (i==0 || arr[i]>=arr[i-1]) i++;
                     else { tmp=arr[i]; arr[i]=arr[i-1]; arr[i-1]=tmp; i--; }
                   }
                 }""",
                        "C#", """
                  void GnomeSort(int[] arr) {
                    int i = 0;
                    while (i < arr.Length) {
                      if (i == 0 || arr[i] >= arr[i-1]) i++;
                      else { (arr[i], arr[i-1]) = (arr[i-1], arr[i]); i--; }
                    }
                  }""",
                        "JavaScript", """
                          function gnomeSort(arr) {
                            let i = 0;
                            while (i < arr.length) {
                              if (i === 0 || arr[i] >= arr[i-1]) i++;
                              else { [arr[i],arr[i-1]]=[arr[i-1],arr[i]]; i--; }
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function gnomeSort(array &$arr): void {
                     $i = 0; $n = count($arr);
                     while ($i < $n) {
                       if ($i === 0 || $arr[$i] >= $arr[$i-1]) $i++;
                       else { [$arr[$i],$arr[$i-1]]=[$arr[$i-1],$arr[$i]]; $i--; }
                     }
                   }"""
                )
        );
    }
}