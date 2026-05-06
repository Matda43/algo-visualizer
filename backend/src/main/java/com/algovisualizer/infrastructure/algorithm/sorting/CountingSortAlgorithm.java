package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

@Component
public class CountingSortAlgorithm implements SortingAlgorithm {

    private static final int MAX_RANGE = 10_000;

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        // Travailler sur les entiers
        int[] intArr = new int[n];
        int minVal = Integer.MAX_VALUE;
        int maxVal = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            intArr[i] = (int) arr[i];
            if (intArr[i] < minVal) minVal = intArr[i];
            if (intArr[i] > maxVal) maxVal = intArr[i];
        }

        int range = maxVal - minVal + 1;
        // Limiter la plage pour éviter un tableau de comptage trop grand
        if (range > MAX_RANGE) {
            // Fallback : émettre directement DONE sans étapes (cas non supporté)
            emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
            return;
        }

        int[] count = new int[range];

        // Phase comptage : émettre des COMPARE pour visualiser
        for (int i = 0; i < n; i++) {
            count[intArr[i] - minVal]++;
            emit.accept(new SortStep(StepType.COMPARE, i, i, arr.clone()));
        }

        // Phase reconstruction
        int outputIndex = 0;
        for (int i = 0; i < range; i++) {
            while (count[i] > 0) {
                arr[outputIndex] = i + minVal;
                emit.accept(new SortStep(StepType.SWAP, outputIndex, outputIndex, arr.clone()));
                outputIndex++;
                count[i]--;
            }
        }

        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    @Override
    public String getName() { return "Counting Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Counting Sort",
                "O(n + k)", "O(n + k)", "O(n + k)", "O(k)",
                "Algorithme de tri non comparatif qui compte les occurrences de chaque valeur (k = plage de valeurs). Reconstruit le tableau trié à partir du tableau de comptage. Très efficace quand k est proche de n, mais inadapté aux grandes plages de valeurs.",
                "https://fr.wikipedia.org/wiki/Tri_comptage",
                false,
                Map.of(
                        "Java", """
                    void countingSort(int[] arr) {
                      int min = arr[0], max = arr[0];
                      for (int v : arr) { if (v<min) min=v; if (v>max) max=v; }
                      int[] count = new int[max - min + 1];
                      for (int v : arr) count[v - min]++;
                      int k = 0;
                      for (int i = 0; i < count.length; i++)
                        while (count[i]-- > 0) arr[k++] = i + min;
                    }""",
                        "Python", """
                      def counting_sort(arr):
                        min_v, max_v = min(arr), max(arr)
                        count = [0] * (max_v - min_v + 1)
                        for v in arr: count[v - min_v] += 1
                        k = 0
                        for i, c in enumerate(count):
                          for _ in range(c):
                            arr[k] = i + min_v; k += 1""",
                        "C++", """
                   void countingSort(int arr[], int n) {
                     int mn=arr[0], mx=arr[0];
                     for (int i=1;i<n;i++) { mn=min(mn,arr[i]); mx=max(mx,arr[i]); }
                     vector<int> cnt(mx-mn+1,0);
                     for (int i=0;i<n;i++) cnt[arr[i]-mn]++;
                     int k=0;
                     for (int i=0;i<cnt.size();i++)
                       while (cnt[i]--) arr[k++]=i+mn;
                   }""",
                        "C", """
                 void countingSort(int arr[], int n) {
                   int mn=arr[0], mx=arr[0], i;
                   for (i=1;i<n;i++) { if(arr[i]<mn)mn=arr[i]; if(arr[i]>mx)mx=arr[i]; }
                   int range=mx-mn+1;
                   int cnt[range]; memset(cnt,0,sizeof(cnt));
                   for (i=0;i<n;i++) cnt[arr[i]-mn]++;
                   int k=0;
                   for (i=0;i<range;i++) while(cnt[i]--) arr[k++]=i+mn;
                 }""",
                        "C#", """
                  void CountingSort(int[] arr) {
                    int mn=arr[0], mx=arr[0];
                    foreach(int v in arr) { if(v<mn)mn=v; if(v>mx)mx=v; }
                    int[] cnt = new int[mx-mn+1];
                    foreach(int v in arr) cnt[v-mn]++;
                    int k=0;
                    for(int i=0;i<cnt.Length;i++)
                      while(cnt[i]-->0) arr[k++]=i+mn;
                  }""",
                        "JavaScript", """
                          function countingSort(arr) {
                            const mn=Math.min(...arr), mx=Math.max(...arr);
                            const cnt=new Array(mx-mn+1).fill(0);
                            arr.forEach(v => cnt[v-mn]++);
                            let k=0;
                            cnt.forEach((c,i) => { while(c-->0) arr[k++]=i+mn; });
                            return arr;
                          }""",
                        "PHP", """
                   function countingSort(array &$arr): void {
                     $mn=min($arr); $mx=max($arr);
                     $cnt=array_fill(0,$mx-$mn+1,0);
                     foreach($arr as $v) $cnt[$v-$mn]++;
                     $k=0;
                     foreach($cnt as $i=>$c)
                       while($c-->0) $arr[$k++]=$i+$mn;
                   }"""
                )
        );
    }
}