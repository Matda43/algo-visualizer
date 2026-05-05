package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class HeapSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--)
            heapify(arr, n, i, emit);
        for (int i = n - 1; i > 0; i--) {
            emit.accept(new SortStep(StepType.SWAP, 0, i, arr.clone()));
            double tmp = arr[0]; arr[0] = arr[i]; arr[i] = tmp;
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
            heapify(arr, i, 0, emit);
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private void heapify(double[] arr, int n, int i, Consumer<SortStep> emit) {
        int largest = i, left = 2 * i + 1, right = 2 * i + 2;
        if (left  < n) { emit.accept(new SortStep(StepType.COMPARE, largest, left,  arr.clone())); if (arr[left]  > arr[largest]) largest = left;  }
        if (right < n) { emit.accept(new SortStep(StepType.COMPARE, largest, right, arr.clone())); if (arr[right] > arr[largest]) largest = right; }
        if (largest != i) {
            double tmp = arr[i]; arr[i] = arr[largest]; arr[largest] = tmp;
            emit.accept(new SortStep(StepType.SWAP, i, largest, arr.clone()));
            heapify(arr, n, largest, emit);
        }
    }

    @Override public String getName()       { return "Heap Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Heap Sort",
                "O(n log n)", "O(n log n)", "O(n log n)", "O(1)",
                "Algorithme de tri utilisant une structure de tas (heap) binaire. Construit d'abord un tas max, puis extrait répétitivement le maximum pour construire le tableau trié. Combine O(n log n) garanti et tri en place.",
                "https://fr.wikipedia.org/wiki/Tri_par_tas",
                false,
                Map.of(
                        "Java", """
                    void heapSort(int[] arr) {
                      int n = arr.length;
                      for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
                      for (int i=n-1;i>0;i--) {
                        int tmp=arr[0]; arr[0]=arr[i]; arr[i]=tmp;
                        heapify(arr,i,0);
                      }
                    }
                    void heapify(int[] arr, int n, int i) {
                      int largest=i, l=2*i+1, r=2*i+2;
                      if (l<n && arr[l]>arr[largest]) largest=l;
                      if (r<n && arr[r]>arr[largest]) largest=r;
                      if (largest!=i) {
                        int tmp=arr[i]; arr[i]=arr[largest]; arr[largest]=tmp;
                        heapify(arr,n,largest);
                      }
                    }""",
                        "Python", """
                      def heap_sort(arr):
                        n = len(arr)
                        for i in range(n//2-1, -1, -1):
                          heapify(arr, n, i)
                        for i in range(n-1, 0, -1):
                          arr[0], arr[i] = arr[i], arr[0]
                          heapify(arr, i, 0)

                      def heapify(arr, n, i):
                        largest = i
                        l, r = 2*i+1, 2*i+2
                        if l < n and arr[l] > arr[largest]: largest = l
                        if r < n and arr[r] > arr[largest]: largest = r
                        if largest != i:
                          arr[i], arr[largest] = arr[largest], arr[i]
                          heapify(arr, n, largest)""",
                        "C++", """
                   void heapify(int arr[], int n, int i) {
                     int largest=i, l=2*i+1, r=2*i+2;
                     if (l<n && arr[l]>arr[largest]) largest=l;
                     if (r<n && arr[r]>arr[largest]) largest=r;
                     if (largest!=i) {
                       swap(arr[i],arr[largest]);
                       heapify(arr,n,largest);
                     }
                   }
                   void heapSort(int arr[], int n) {
                     for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
                     for (int i=n-1;i>0;i--) {
                       swap(arr[0],arr[i]);
                       heapify(arr,i,0);
                     }
                   }""",
                        "C", """
                 void heapify(int arr[], int n, int i) {
                   int largest=i, l=2*i+1, r=2*i+2, tmp;
                   if (l<n && arr[l]>arr[largest]) largest=l;
                   if (r<n && arr[r]>arr[largest]) largest=r;
                   if (largest!=i) {
                     tmp=arr[i]; arr[i]=arr[largest]; arr[largest]=tmp;
                     heapify(arr,n,largest);
                   }
                 }
                 void heapSort(int arr[], int n) {
                   for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
                   for (int i=n-1;i>0;i--) {
                     int tmp=arr[0]; arr[0]=arr[i]; arr[i]=tmp;
                     heapify(arr,i,0);
                   }
                 }""",
                        "C#", """
                  void HeapSort(int[] arr) {
                    int n = arr.Length;
                    for (int i=n/2-1;i>=0;i--) Heapify(arr,n,i);
                    for (int i=n-1;i>0;i--) {
                      (arr[0], arr[i]) = (arr[i], arr[0]);
                      Heapify(arr,i,0);
                    }
                  }
                  void Heapify(int[] arr, int n, int i) {
                    int largest=i, l=2*i+1, r=2*i+2;
                    if (l<n && arr[l]>arr[largest]) largest=l;
                    if (r<n && arr[r]>arr[largest]) largest=r;
                    if (largest!=i) {
                      (arr[i],arr[largest])=(arr[largest],arr[i]);
                      Heapify(arr,n,largest);
                    }
                  }""",
                        "JavaScript", """
                          function heapSort(arr) {
                            const n = arr.length;
                            for (let i=Math.floor(n/2)-1;i>=0;i--) heapify(arr,n,i);
                            for (let i=n-1;i>0;i--) {
                              [arr[0],arr[i]]=[arr[i],arr[0]];
                              heapify(arr,i,0);
                            }
                            return arr;
                          }
                          function heapify(arr, n, i) {
                            let largest=i, l=2*i+1, r=2*i+2;
                            if (l<n && arr[l]>arr[largest]) largest=l;
                            if (r<n && arr[r]>arr[largest]) largest=r;
                            if (largest!==i) {
                              [arr[i],arr[largest]]=[arr[largest],arr[i]];
                              heapify(arr,n,largest);
                            }
                          }""",
                        "PHP", """
                   function heapSort(array &$arr): void {
                     $n = count($arr);
                     for ($i=intdiv($n,2)-1;$i>=0;$i--) heapify($arr,$n,$i);
                     for ($i=$n-1;$i>0;$i--) {
                       [$arr[0],$arr[$i]]=[$arr[$i],$arr[0]];
                       heapify($arr,$i,0);
                     }
                   }
                   function heapify(array &$arr, int $n, int $i): void {
                     $largest=$i; $l=2*$i+1; $r=2*$i+2;
                     if ($l<$n && $arr[$l]>$arr[$largest]) $largest=$l;
                     if ($r<$n && $arr[$r]>$arr[$largest]) $largest=$r;
                     if ($largest!=$i) {
                       [$arr[$i],$arr[$largest]]=[$arr[$largest],$arr[$i]];
                       heapify($arr,$n,$largest);
                     }
                   }"""
                )
        );
    }
}