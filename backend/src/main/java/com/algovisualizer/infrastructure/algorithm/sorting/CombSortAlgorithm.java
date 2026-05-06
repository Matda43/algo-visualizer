package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class CombSortAlgorithm implements SortingAlgorithm {

    private static final double SHRINK_FACTOR = 1.3;

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;
        int gap = n;
        boolean sorted = false;

        while (!sorted) {
            gap = (int) (gap / SHRINK_FACTOR);
            if (gap <= 1) {
                gap = 1;
                sorted = true;
            }
            for (int i = 0; i + gap < n; i++) {
                emit.accept(new SortStep(StepType.COMPARE, i, i + gap, arr.clone()));
                if (arr[i] > arr[i + gap]) {
                    double tmp = arr[i]; arr[i] = arr[i + gap]; arr[i + gap] = tmp;
                    emit.accept(new SortStep(StepType.SWAP, i, i + gap, arr.clone()));
                    sorted = false;
                }
            }
        }

        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Comb Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Comb Sort",
                "O(n log n)", "O(n²)", "O(n)", "O(1)",
                "Amélioration du tri à bulles utilisant un facteur de réduction (shrink factor ≈ 1.3) pour comparer des éléments distants avant de réduire progressivement le gap jusqu'à 1. Élimine efficacement les petites valeurs situées en fin de tableau (tortues).",
                "https://fr.wikipedia.org/wiki/Tri_%C3%A0_peigne",
                false,
                Map.of(
                        "Java", """
                    void combSort(int[] arr) {
                      int n = arr.length, gap = n;
                      boolean sorted = false;
                      while (!sorted) {
                        gap = (int)(gap / 1.3);
                        if (gap <= 1) { gap = 1; sorted = true; }
                        for (int i = 0; i + gap < n; i++) {
                          if (arr[i] > arr[i + gap]) {
                            int tmp = arr[i]; arr[i]=arr[i+gap]; arr[i+gap]=tmp;
                            sorted = false;
                          }
                        }
                      }
                    }""",
                        "Python", """
                      def comb_sort(arr):
                        n = len(arr)
                        gap = n
                        sorted_ = False
                        while not sorted_:
                          gap = int(gap / 1.3)
                          if gap <= 1: gap = 1; sorted_ = True
                          for i in range(n - gap):
                            if arr[i] > arr[i + gap]:
                              arr[i], arr[i+gap] = arr[i+gap], arr[i]
                              sorted_ = False""",
                        "C++", """
                   void combSort(int arr[], int n) {
                     int gap = n; bool sorted = false;
                     while (!sorted) {
                       gap = (int)(gap / 1.3);
                       if (gap <= 1) { gap = 1; sorted = true; }
                       for (int i = 0; i + gap < n; i++) {
                         if (arr[i] > arr[i+gap]) {
                           swap(arr[i], arr[i+gap]); sorted = false;
                         }
                       }
                     }
                   }""",
                        "C", """
                 void combSort(int arr[], int n) {
                   int gap=n, sorted=0, tmp;
                   while (!sorted) {
                     gap=(int)(gap/1.3);
                     if (gap<=1) { gap=1; sorted=1; }
                     for (int i=0;i+gap<n;i++) {
                       if (arr[i]>arr[i+gap]) {
                         tmp=arr[i]; arr[i]=arr[i+gap]; arr[i+gap]=tmp; sorted=0;
                       }
                     }
                   }
                 }""",
                        "C#", """
                  void CombSort(int[] arr) {
                    int n=arr.Length, gap=n; bool sorted=false;
                    while (!sorted) {
                      gap=(int)(gap/1.3);
                      if (gap<=1) { gap=1; sorted=true; }
                      for (int i=0;i+gap<n;i++) {
                        if (arr[i]>arr[i+gap]) {
                          (arr[i],arr[i+gap])=(arr[i+gap],arr[i]); sorted=false;
                        }
                      }
                    }
                  }""",
                        "JavaScript", """
                          function combSort(arr) {
                            const n = arr.length;
                            let gap = n, sorted = false;
                            while (!sorted) {
                              gap = Math.floor(gap / 1.3);
                              if (gap <= 1) { gap = 1; sorted = true; }
                              for (let i = 0; i + gap < n; i++) {
                                if (arr[i] > arr[i+gap]) {
                                  [arr[i],arr[i+gap]]=[arr[i+gap],arr[i]]; sorted=false;
                                }
                              }
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function combSort(array &$arr): void {
                     $n=count($arr); $gap=$n; $sorted=false;
                     while (!$sorted) {
                       $gap=(int)($gap/1.3);
                       if ($gap<=1) { $gap=1; $sorted=true; }
                       for ($i=0;$i+$gap<$n;$i++) {
                         if ($arr[$i]>$arr[$i+$gap]) {
                           [$arr[$i],$arr[$i+$gap]]=[$arr[$i+$gap],$arr[$i]]; $sorted=false;
                         }
                       }
                     }
                   }"""
                )
        );
    }
}