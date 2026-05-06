package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class TimSortAlgorithm implements SortingAlgorithm {

    private static final int RUN_SIZE = 32;

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        // Phase 1 : trier chaque run par insertion sort
        for (int i = 0; i < n; i += RUN_SIZE) {
            int end = Math.min(i + RUN_SIZE - 1, n - 1);
            insertionSortRange(arr, i, end, emit);
        }

        // Phase 2 : fusionner les runs progressivement
        for (int size = RUN_SIZE; size < n; size *= 2) {
            for (int left = 0; left < n; left += 2 * size) {
                int mid   = Math.min(left + size - 1, n - 1);
                int right = Math.min(left + 2 * size - 1, n - 1);
                if (mid < right) {
                    merge(arr, left, mid, right, emit);
                }
            }
        }

        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private void insertionSortRange(double[] arr, int left, int right, Consumer<SortStep> emit) {
        for (int i = left + 1; i <= right; i++) {
            double key = arr[i];
            int j = i - 1;
            emit.accept(new SortStep(StepType.PIVOT, i, i, arr.clone()));
            while (j >= left && arr[j] > key) {
                emit.accept(new SortStep(StepType.COMPARE, j, j + 1, arr.clone()));
                arr[j + 1] = arr[j];
                emit.accept(new SortStep(StepType.SWAP, j, j + 1, arr.clone()));
                j--;
            }
            arr[j + 1] = key;
        }
    }

    private void merge(double[] arr, int left, int mid, int right, Consumer<SortStep> emit) {
        double[] tmp = arr.clone();
        int i = left, j = mid + 1, k = left;
        while (i <= mid && j <= right) {
            emit.accept(new SortStep(StepType.COMPARE, i, j, arr.clone()));
            if (tmp[i] <= tmp[j]) arr[k++] = tmp[i++];
            else                  arr[k++] = tmp[j++];
            emit.accept(new SortStep(StepType.SORTED, k - 1, k - 1, arr.clone()));
        }
        while (i <= mid) arr[k++] = tmp[i++];
        while (j <= right) arr[k++] = tmp[j++];
        for (int idx = left; idx <= right; idx++) {
            emit.accept(new SortStep(StepType.SORTED, idx, idx, arr.clone()));
        }
    }

    @Override
    public String getName() { return "Tim Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Tim Sort",
                "O(n log n)", "O(n log n)", "O(n)", "O(n)",
                "Algorithme hybride combinant le tri par insertion et le tri fusion, utilisé par Python et Java. Divise le tableau en petits blocs (runs) triés par insertion, puis les fusionne progressivement. Particulièrement efficace sur les données réelles partiellement ordonnées.",
                "https://fr.wikipedia.org/wiki/Timsort",
                true,
                Map.of(
                        "Java", """
                    static final int RUN = 32;
                    void timSort(int[] arr) {
                      int n = arr.length;
                      for (int i=0;i<n;i+=RUN)
                        insertionSort(arr, i, Math.min(i+RUN-1, n-1));
                      for (int size=RUN;size<n;size*=2) {
                        for (int l=0;l<n;l+=2*size) {
                          int m=Math.min(l+size-1,n-1);
                          int r=Math.min(l+2*size-1,n-1);
                          if (m<r) merge(arr,l,m,r);
                        }
                      }
                    }""",
                        "Python", """
                      RUN = 32
                      def tim_sort(arr):
                        n = len(arr)
                        for i in range(0, n, RUN):
                          insertion_sort(arr, i, min(i+RUN-1, n-1))
                        size = RUN
                        while size < n:
                          for l in range(0, n, 2*size):
                            m = min(l+size-1, n-1)
                            r = min(l+2*size-1, n-1)
                            if m < r: merge(arr, l, m, r)
                          size *= 2""",
                        "C++", """
                   const int RUN = 32;
                   void timSort(int arr[], int n) {
                     for (int i=0;i<n;i+=RUN)
                       insertionSort(arr, i, min(i+RUN-1, n-1));
                     for (int size=RUN;size<n;size*=2) {
                       for (int l=0;l<n;l+=2*size) {
                         int m=min(l+size-1,n-1);
                         int r=min(l+2*size-1,n-1);
                         if (m<r) merge(arr,l,m,r);
                       }
                     }
                   }""",
                        "C", """
                 #define RUN 32
                 void timSort(int arr[], int n) {
                   for (int i=0;i<n;i+=RUN)
                     insertionSortRange(arr,i,i+RUN-1<n-1?i+RUN-1:n-1);
                   for (int size=RUN;size<n;size*=2) {
                     for (int l=0;l<n;l+=2*size) {
                       int m=l+size-1<n-1?l+size-1:n-1;
                       int r=l+2*size-1<n-1?l+2*size-1:n-1;
                       if (m<r) merge(arr,l,m,r);
                     }
                   }
                 }""",
                        "C#", """
                  const int RUN = 32;
                  void TimSort(int[] arr) {
                    int n = arr.Length;
                    for (int i=0;i<n;i+=RUN)
                      InsertionSortRange(arr,i,Math.Min(i+RUN-1,n-1));
                    for (int size=RUN;size<n;size*=2) {
                      for (int l=0;l<n;l+=2*size) {
                        int m=Math.Min(l+size-1,n-1);
                        int r=Math.Min(l+2*size-1,n-1);
                        if (m<r) Merge(arr,l,m,r);
                      }
                    }
                  }""",
                        "JavaScript", """
                          const RUN = 32;
                          function timSort(arr) {
                            const n = arr.length;
                            for (let i=0;i<n;i+=RUN)
                              insertionSortRange(arr,i,Math.min(i+RUN-1,n-1));
                            for (let size=RUN;size<n;size*=2) {
                              for (let l=0;l<n;l+=2*size) {
                                const m=Math.min(l+size-1,n-1);
                                const r=Math.min(l+2*size-1,n-1);
                                if (m<r) merge(arr,l,m,r);
                              }
                            }
                            return arr;
                          }""",
                        "PHP", """
                   define('RUN', 32);
                   function timSort(array &$arr): void {
                     $n=count($arr);
                     for ($i=0;$i<$n;$i+=RUN)
                       insertionSortRange($arr,$i,min($i+RUN-1,$n-1));
                     for ($size=RUN;$size<$n;$size*=2) {
                       for ($l=0;$l<$n;$l+=2*$size) {
                         $m=min($l+$size-1,$n-1);
                         $r=min($l+2*$size-1,$n-1);
                         if ($m<$r) mergeParts($arr,$l,$m,$r);
                       }
                     }
                   }"""
                )
        );
    }
}