package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class CocktailSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;
        int left = 0;
        int right = n - 1;

        while (left < right) {
            boolean swapped = false;

            // Passe gauche → droite
            for (int i = left; i < right; i++) {
                emit.accept(new SortStep(StepType.COMPARE, i, i + 1, arr.clone()));
                if (arr[i] > arr[i + 1]) {
                    double tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp;
                    emit.accept(new SortStep(StepType.SWAP, i, i + 1, arr.clone()));
                    swapped = true;
                }
            }
            emit.accept(new SortStep(StepType.SORTED, right, right, arr.clone()));
            right--;

            if (!swapped) break;
            swapped = false;

            // Passe droite → gauche
            for (int i = right; i > left; i--) {
                emit.accept(new SortStep(StepType.COMPARE, i - 1, i, arr.clone()));
                if (arr[i] < arr[i - 1]) {
                    double tmp = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = tmp;
                    emit.accept(new SortStep(StepType.SWAP, i - 1, i, arr.clone()));
                    swapped = true;
                }
            }
            emit.accept(new SortStep(StepType.SORTED, left, left, arr.clone()));
            left++;

            if (!swapped) break;
        }

        // Marquer les éléments restants comme triés
        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Cocktail Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Cocktail Sort",
                "O(n²)", "O(n²)", "O(n)", "O(1)",
                "Variante bidirectionnelle du tri à bulles, aussi appelé tri cocktail ou tri shaker. Parcourt le tableau dans les deux sens alternativement, ce qui permet de déplacer les petits éléments plus rapidement vers le début. Légèrement plus efficace que le bubble sort.",
                "https://fr.wikipedia.org/wiki/Tri_cocktail",
                true,
                Map.of(
                        "Java", """
                    void cocktailSort(int[] arr) {
                      int n = arr.length, l = 0, r = n - 1;
                      while (l < r) {
                        boolean swapped = false;
                        for (int i = l; i < r; i++) {
                          if (arr[i] > arr[i+1]) {
                            int tmp=arr[i]; arr[i]=arr[i+1]; arr[i+1]=tmp;
                            swapped = true;
                          }
                        }
                        r--;
                        if (!swapped) break;
                        swapped = false;
                        for (int i = r; i > l; i--) {
                          if (arr[i] < arr[i-1]) {
                            int tmp=arr[i]; arr[i]=arr[i-1]; arr[i-1]=tmp;
                            swapped = true;
                          }
                        }
                        l++;
                        if (!swapped) break;
                      }
                    }""",
                        "Python", """
                      def cocktail_sort(arr):
                        n = len(arr)
                        l, r = 0, n - 1
                        while l < r:
                          swapped = False
                          for i in range(l, r):
                            if arr[i] > arr[i+1]:
                              arr[i], arr[i+1] = arr[i+1], arr[i]
                              swapped = True
                          r -= 1
                          if not swapped: break
                          swapped = False
                          for i in range(r, l, -1):
                            if arr[i] < arr[i-1]:
                              arr[i], arr[i-1] = arr[i-1], arr[i]
                              swapped = True
                          l += 1
                          if not swapped: break""",
                        "C++", """
                   void cocktailSort(int arr[], int n) {
                     int l=0, r=n-1;
                     while (l < r) {
                       bool swapped=false;
                       for (int i=l;i<r;i++)
                         if (arr[i]>arr[i+1]) { swap(arr[i],arr[i+1]); swapped=true; }
                       r--;
                       if (!swapped) break; swapped=false;
                       for (int i=r;i>l;i--)
                         if (arr[i]<arr[i-1]) { swap(arr[i],arr[i-1]); swapped=true; }
                       l++;
                       if (!swapped) break;
                     }
                   }""",
                        "C", """
                 void cocktailSort(int arr[], int n) {
                   int l=0, r=n-1, swapped, tmp;
                   while (l < r) {
                     swapped=0;
                     for (int i=l;i<r;i++)
                       if (arr[i]>arr[i+1]) { tmp=arr[i]; arr[i]=arr[i+1]; arr[i+1]=tmp; swapped=1; }
                     r--;
                     if (!swapped) break; swapped=0;
                     for (int i=r;i>l;i--)
                       if (arr[i]<arr[i-1]) { tmp=arr[i]; arr[i]=arr[i-1]; arr[i-1]=tmp; swapped=1; }
                     l++;
                     if (!swapped) break;
                   }
                 }""",
                        "C#", """
                  void CocktailSort(int[] arr) {
                    int l=0, r=arr.Length-1;
                    while (l < r) {
                      bool swapped=false;
                      for (int i=l;i<r;i++)
                        if (arr[i]>arr[i+1]) { (arr[i],arr[i+1])=(arr[i+1],arr[i]); swapped=true; }
                      r--;
                      if (!swapped) break; swapped=false;
                      for (int i=r;i>l;i--)
                        if (arr[i]<arr[i-1]) { (arr[i],arr[i-1])=(arr[i-1],arr[i]); swapped=true; }
                      l++;
                      if (!swapped) break;
                    }
                  }""",
                        "JavaScript", """
                          function cocktailSort(arr) {
                            let l=0, r=arr.length-1;
                            while (l < r) {
                              let swapped=false;
                              for (let i=l;i<r;i++)
                                if (arr[i]>arr[i+1]) { [arr[i],arr[i+1]]=[arr[i+1],arr[i]]; swapped=true; }
                              r--;
                              if (!swapped) break; swapped=false;
                              for (let i=r;i>l;i--)
                                if (arr[i]<arr[i-1]) { [arr[i],arr[i-1]]=[arr[i-1],arr[i]]; swapped=true; }
                              l++;
                              if (!swapped) break;
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function cocktailSort(array &$arr): void {
                     $l=0; $r=count($arr)-1;
                     while ($l < $r) {
                       $swapped=false;
                       for ($i=$l;$i<$r;$i++)
                         if ($arr[$i]>$arr[$i+1]) { [$arr[$i],$arr[$i+1]]=[$arr[$i+1],$arr[$i]]; $swapped=true; }
                       $r--;
                       if (!$swapped) break; $swapped=false;
                       for ($i=$r;$i>$l;$i--)
                         if ($arr[$i]<$arr[$i-1]) { [$arr[$i],$arr[$i-1]]=[$arr[$i-1],$arr[$i]]; $swapped=true; }
                       $l++;
                       if (!$swapped) break;
                     }
                   }"""
                )
        );
    }
}