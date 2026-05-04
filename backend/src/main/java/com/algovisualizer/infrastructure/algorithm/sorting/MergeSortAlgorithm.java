/*package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;


@Component
public class MergeSortAlgorithm implements SortingAlgorithm {

    @Override
    public List<SortStep> generateSteps(int[] array) {
        List<SortStep> steps = new ArrayList<>();
        int[] arr = array.clone();
        mergeSort(arr, 0, arr.length - 1, steps);
        steps.add(new SortStep(StepType.DONE, -1, -1, arr));
        return steps;
    }

    private void mergeSort(int[] arr, int left, int right, List<SortStep> steps) {
        if (left < right) {
            int mid = (left + right) / 2;
            mergeSort(arr, left, mid, steps);
            mergeSort(arr, mid + 1, right, steps);
            merge(arr, left, mid, right, steps);
        }
    }

    private void merge(int[] arr, int left, int mid, int right, List<SortStep> steps) {
        int[] tmp = arr.clone();
        int i = left, j = mid + 1, k = left;

        while (i <= mid && j <= right) {
            steps.add(new SortStep(StepType.COMPARE, i, j, arr.clone()));
            if (tmp[i] <= tmp[j]) {
                arr[k++] = tmp[i++];
            } else {
                arr[k++] = tmp[j++];
            }
            steps.add(new SortStep(StepType.SWAP, k - 1, k - 1, arr.clone()));
        }
        while (i <= mid) arr[k++] = tmp[i++];
        while (j <= right) arr[k++] = tmp[j++];

        if (left == 0 && right == arr.length - 1) {
            for (int idx = 0; idx < arr.length; idx++) {
                steps.add(new SortStep(StepType.SORTED, idx, idx, arr.clone()));
            }
        }
    }

    @Override public String getName() { return "Merge Sort"; }
    @Override public String getComplexity() { return "O(n log n)"; }
    @Override public String getWorstCase() { return "O(n log n)"; }
}*/

package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class MergeSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        mergeSort(arr, 0, arr.length - 1, emit);
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private void mergeSort(double[] arr, int left, int right, Consumer<SortStep> emit) {
        if (left < right) {
            int mid = left + (right - left) / 2;
            mergeSort(arr, left, mid, emit);
            mergeSort(arr, mid + 1, right, emit);
            emit.accept(new SortStep(StepType.COMPARE, mid, mid + 1, arr.clone()));
            if (arr[mid] <= arr[mid + 1]) {
                for (int k = left; k <= right; k++)
                    emit.accept(new SortStep(StepType.SORTED, k, k, arr.clone()));
                return;
            }
            merge(arr, left, mid, right, emit);
        } else if (left == right) {
            emit.accept(new SortStep(StepType.SORTED, left, left, arr.clone()));
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
        for (int idx = left; idx <= right; idx++)
            emit.accept(new SortStep(StepType.SORTED, idx, idx, arr.clone()));
    }

    @Override public String getName()       { return "Merge Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Merge Sort",
                "O(n log n)", "O(n log n)", "O(n log n)", "O(n)",
                "Algorithme de tri par fusion basé sur le paradigme diviser pour régner. Divise le tableau en deux moitiés, les trie récursivement, puis les fusionne. Garantit O(n log n) dans tous les cas au prix d'une mémoire supplémentaire.",
                "https://fr.wikipedia.org/wiki/Tri_fusion",
                Map.of(
                        "Java", """
                    void mergeSort(int[] arr, int l, int r) {
                      if (l < r) {
                        int m = (l + r) / 2;
                        mergeSort(arr, l, m);
                        mergeSort(arr, m + 1, r);
                        merge(arr, l, m, r);
                      }
                    }
                    void merge(int[] arr, int l, int m, int r) {
                      int[] tmp = Arrays.copyOfRange(arr, l, r + 1);
                      int i = 0, j = m - l + 1, k = l;
                      while (i <= m - l && j < tmp.length)
                        arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
                      while (i <= m - l) arr[k++] = tmp[i++];
                    }""",
                        "Python", """
                      def merge_sort(arr):
                        if len(arr) > 1:
                          mid = len(arr) // 2
                          L, R = arr[:mid], arr[mid:]
                          merge_sort(L); merge_sort(R)
                          i = j = k = 0
                          while i < len(L) and j < len(R):
                            if L[i] <= R[j]: arr[k] = L[i]; i += 1
                            else:            arr[k] = R[j]; j += 1
                            k += 1
                          while i < len(L): arr[k] = L[i]; i += 1; k += 1
                          while j < len(R): arr[k] = R[j]; j += 1; k += 1""",
                        "C++", """
                   void merge(int arr[], int l, int m, int r) {
                     vector<int> L(arr+l, arr+m+1), R(arr+m+1, arr+r+1);
                     int i=0, j=0, k=l;
                     while (i<L.size() && j<R.size())
                       arr[k++] = (L[i]<=R[j]) ? L[i++] : R[j++];
                     while (i<L.size()) arr[k++]=L[i++];
                     while (j<R.size()) arr[k++]=R[j++];
                   }
                   void mergeSort(int arr[], int l, int r) {
                     if (l < r) {
                       int m = (l+r)/2;
                       mergeSort(arr, l, m);
                       mergeSort(arr, m+1, r);
                       merge(arr, l, m, r);
                     }
                   }""",
                        "C", """
                 void merge(int arr[], int l, int m, int r) {
                   int n1=m-l+1, n2=r-m, i, j, k;
                   int L[n1], R[n2];
                   for (i=0;i<n1;i++) L[i]=arr[l+i];
                   for (j=0;j<n2;j++) R[j]=arr[m+1+j];
                   i=j=0; k=l;
                   while (i<n1 && j<n2)
                     arr[k++] = L[i]<=R[j] ? L[i++] : R[j++];
                   while (i<n1) arr[k++]=L[i++];
                   while (j<n2) arr[k++]=R[j++];
                 }""",
                        "C#", """
                  void MergeSort(int[] arr, int l, int r) {
                    if (l < r) {
                      int m = (l + r) / 2;
                      MergeSort(arr, l, m);
                      MergeSort(arr, m + 1, r);
                      Merge(arr, l, m, r);
                    }
                  }
                  void Merge(int[] arr, int l, int m, int r) {
                    var tmp = arr[l..(r+1)];
                    int i=0, j=m-l+1, k=l;
                    while (i<=m-l && j<tmp.Length)
                      arr[k++] = tmp[i]<=tmp[j] ? tmp[i++] : tmp[j++];
                    while (i<=m-l) arr[k++]=tmp[i++];
                  }""",
                        "JavaScript", """
                          function mergeSort(arr) {
                            if (arr.length <= 1) return arr;
                            const mid = Math.floor(arr.length / 2);
                            const L = mergeSort(arr.slice(0, mid));
                            const R = mergeSort(arr.slice(mid));
                            let i = 0, j = 0, k = 0;
                            while (i < L.length && j < R.length)
                              arr[k++] = L[i] <= R[j] ? L[i++] : R[j++];
                            while (i < L.length) arr[k++] = L[i++];
                            while (j < R.length) arr[k++] = R[j++];
                            return arr;
                          }""",
                        "PHP", """
                   function mergeSort(array &$arr): void {
                     $n = count($arr);
                     if ($n <= 1) return;
                     $mid = intdiv($n, 2);
                     $L = array_slice($arr, 0, $mid);
                     $R = array_slice($arr, $mid);
                     mergeSort($L); mergeSort($R);
                     $i = $j = $k = 0;
                     while ($i < count($L) && $j < count($R))
                       $arr[$k++] = $L[$i] <= $R[$j] ? $L[$i++] : $R[$j++];
                     while ($i < count($L)) $arr[$k++] = $L[$i++];
                     while ($j < count($R)) $arr[$k++] = $R[$j++];
                   }"""
                )
        );
    }
}