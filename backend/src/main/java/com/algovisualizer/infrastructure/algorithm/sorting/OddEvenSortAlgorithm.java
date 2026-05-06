package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class OddEvenSortAlgorithm implements SortingAlgorithm {

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;
        boolean sorted = false;

        while (!sorted) {
            sorted = true;

            // Passe impaire : indices 1, 3, 5, ...
            for (int i = 1; i < n - 1; i += 2) {
                emit.accept(new SortStep(StepType.COMPARE, i, i + 1, arr.clone()));
                if (arr[i] > arr[i + 1]) {
                    double tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp;
                    emit.accept(new SortStep(StepType.SWAP, i, i + 1, arr.clone()));
                    sorted = false;
                }
            }

            // Passe paire : indices 0, 2, 4, ...
            for (int i = 0; i < n - 1; i += 2) {
                emit.accept(new SortStep(StepType.COMPARE, i, i + 1, arr.clone()));
                if (arr[i] > arr[i + 1]) {
                    double tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp;
                    emit.accept(new SortStep(StepType.SWAP, i, i + 1, arr.clone()));
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
    public String getName() { return "Odd-Even Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Odd-Even Sort",
                "O(n²)", "O(n²)", "O(n)", "O(1)",
                "Algorithme de tri pair-impair (ou tri brique) qui alterne deux passes : une sur les paires d'indices impairs adjacents, une sur les paires paires. Parallélisable car les échanges d'une même passe sont indépendants. Utilisé dans les réseaux de tri parallèles.",
                "https://fr.wikipedia.org/wiki/Tri_pair-impair",
                true,
                Map.of(
                        "Java", """
                    void oddEvenSort(int[] arr) {
                      int n = arr.length;
                      boolean sorted = false;
                      while (!sorted) {
                        sorted = true;
                        for (int i=1;i<n-1;i+=2)
                          if (arr[i]>arr[i+1]) { swap(arr,i,i+1); sorted=false; }
                        for (int i=0;i<n-1;i+=2)
                          if (arr[i]>arr[i+1]) { swap(arr,i,i+1); sorted=false; }
                      }
                    }""",
                        "Python", """
                      def odd_even_sort(arr):
                        n = len(arr)
                        sorted_ = False
                        while not sorted_:
                          sorted_ = True
                          for i in range(1, n-1, 2):
                            if arr[i] > arr[i+1]:
                              arr[i],arr[i+1]=arr[i+1],arr[i]; sorted_=False
                          for i in range(0, n-1, 2):
                            if arr[i] > arr[i+1]:
                              arr[i],arr[i+1]=arr[i+1],arr[i]; sorted_=False""",
                        "C++", """
                   void oddEvenSort(int arr[], int n) {
                     bool sorted=false;
                     while (!sorted) {
                       sorted=true;
                       for (int i=1;i<n-1;i+=2)
                         if (arr[i]>arr[i+1]) { swap(arr[i],arr[i+1]); sorted=false; }
                       for (int i=0;i<n-1;i+=2)
                         if (arr[i]>arr[i+1]) { swap(arr[i],arr[i+1]); sorted=false; }
                     }
                   }""",
                        "C", """
                 void oddEvenSort(int arr[], int n) {
                   int sorted=0, tmp;
                   while (!sorted) {
                     sorted=1;
                     for (int i=1;i<n-1;i+=2)
                       if (arr[i]>arr[i+1]) { tmp=arr[i];arr[i]=arr[i+1];arr[i+1]=tmp;sorted=0; }
                     for (int i=0;i<n-1;i+=2)
                       if (arr[i]>arr[i+1]) { tmp=arr[i];arr[i]=arr[i+1];arr[i+1]=tmp;sorted=0; }
                   }
                 }""",
                        "C#", """
                  void OddEvenSort(int[] arr) {
                    int n=arr.Length; bool sorted=false;
                    while (!sorted) {
                      sorted=true;
                      for (int i=1;i<n-1;i+=2)
                        if (arr[i]>arr[i+1]) { (arr[i],arr[i+1])=(arr[i+1],arr[i]); sorted=false; }
                      for (int i=0;i<n-1;i+=2)
                        if (arr[i]>arr[i+1]) { (arr[i],arr[i+1])=(arr[i+1],arr[i]); sorted=false; }
                    }
                  }""",
                        "JavaScript", """
                          function oddEvenSort(arr) {
                            const n=arr.length; let sorted=false;
                            while (!sorted) {
                              sorted=true;
                              for (let i=1;i<n-1;i+=2)
                                if (arr[i]>arr[i+1]) { [arr[i],arr[i+1]]=[arr[i+1],arr[i]]; sorted=false; }
                              for (let i=0;i<n-1;i+=2)
                                if (arr[i]>arr[i+1]) { [arr[i],arr[i+1]]=[arr[i+1],arr[i]]; sorted=false; }
                            }
                            return arr;
                          }""",
                        "PHP", """
                   function oddEvenSort(array &$arr): void {
                     $n=count($arr); $sorted=false;
                     while (!$sorted) {
                       $sorted=true;
                       for ($i=1;$i<$n-1;$i+=2)
                         if ($arr[$i]>$arr[$i+1]) { [$arr[$i],$arr[$i+1]]=[$arr[$i+1],$arr[$i]]; $sorted=false; }
                       for ($i=0;$i<$n-1;$i+=2)
                         if ($arr[$i]>$arr[$i+1]) { [$arr[$i],$arr[$i+1]]=[$arr[$i+1],$arr[$i]]; $sorted=false; }
                     }
                   }"""
                )
        );
    }
}