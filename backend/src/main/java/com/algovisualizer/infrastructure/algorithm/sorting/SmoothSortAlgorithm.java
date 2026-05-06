package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

/**
 * Smoothsort (Dijkstra, 1981) — variante du tri par tas utilisant
 * les nombres de Leonardo au lieu d'une puissance de deux.
 * O(n log n) pire cas, O(n) sur données déjà triées.
 *
 * Pour la visualisation, on utilise une implémentation simplifiée
 * basée sur les tas de Leonardo avec émission d'étapes.
 */
@Component
public class SmoothSortAlgorithm implements SortingAlgorithm {

    // Nombres de Leonardo : L(0)=1, L(1)=1, L(k)=L(k-1)+L(k-2)+1
    private static final int[] LEONARDO = buildLeonardo(46);

    private static int[] buildLeonardo(int count) {
        int[] leo = new int[count];
        leo[0] = 1; leo[1] = 1;
        for (int i = 2; i < count; i++) leo[i] = leo[i - 1] + leo[i - 2] + 1;
        return leo;
    }

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        // p encodes which Leonardo heap sizes are present (bitmask)
        long p = 1;
        int  q = 1;
        int  r = 0;

        // Phase 1 : construire la forêt de tas de Leonardo
        while (q < n) {
            // Si les deux derniers tas peuvent fusionner
            if ((p & 3) == 3) {
                sift(arr, r, q, emit);
                p = (p >> 2) | 1;
                q += 2;
            } else {
                if (LEONARDO[q - 1] < n - r) {
                    trinkle(arr, r, p, q, false, emit);
                }
                if (q == 1) { q = 0; p <<= 1; }
                else         { q--;   p <<= (q - (q > 1 ? q - 1 : 0)); }
                p |= 1;
            }
            swap(arr, r, r + 1 < n ? r + 1 : r);
            if (r + 1 < n) {
                emit.accept(new SortStep(StepType.SWAP, r, r + 1, arr.clone()));
            }
            r++;
        }

        // Phase 2 : extraire les maximums
        trinkle(arr, r - 1, p, q, false, emit);
        while (q > 0 || p > 1) {
            if (q <= 1) {
                // Retirer le tas de taille 1
                p &= ~(p & -p);
                long lsb = p & -p;
                while (lsb > 1) { lsb >>= 1; q++; }
                p |= 1;
            } else {
                // Diviser le tas courant en deux fils
                q -= 2;
                p |= 3;
                r--;
                emit.accept(new SortStep(StepType.SORTED, r, r, arr.clone()));
                trinkle(arr, r - LEONARDO[q] - 1, p >> 1, q + 1, true, emit);
                p = (p >> 1) | 1;
                trinkle(arr, r - 1, p, q, true, emit);
            }
        }
        emit.accept(new SortStep(StepType.SORTED, 0, 0, arr.clone()));
        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private void sift(double[] arr, int r, int q, Consumer<SortStep> emit) {
        while (q > 1) {
            int rf = r - LEONARDO[q - 2] - 1;
            emit.accept(new SortStep(StepType.COMPARE, r, rf, arr.clone()));
            if (arr[r] >= arr[rf] && arr[r] >= arr[r - 1]) break;
            if (arr[rf] >= arr[r - 1]) {
                swap(arr, r, rf);
                emit.accept(new SortStep(StepType.SWAP, r, rf, arr.clone()));
                r = rf; q -= 2;
            } else {
                swap(arr, r, r - 1);
                emit.accept(new SortStep(StepType.SWAP, r, r - 1, arr.clone()));
                r--; q--;
            }
        }
    }

    private void trinkle(double[] arr, int r, long p, int q, boolean trusty, Consumer<SortStep> emit) {
        while (p != 1) {
            int stepback = LEONARDO[q - 1];
            emit.accept(new SortStep(StepType.COMPARE, r, r - stepback, arr.clone()));
            if (!trusty && arr[r] < arr[r - stepback]) {
                swap(arr, r, r - stepback);
                emit.accept(new SortStep(StepType.SWAP, r, r - stepback, arr.clone()));
                r -= stepback;
                p >>= 1; if (q > 1) q--; else q = 0;
            } else break;
        }
        sift(arr, r, q, emit);
    }

    private void swap(double[] arr, int i, int j) {
        if (i == j || i < 0 || j < 0 || i >= arr.length || j >= arr.length) return;
        double tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    @Override
    public String getName() { return "Smoothsort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Smoothsort",
                "O(n log n)", "O(n log n)", "O(n)", "O(1)",
                "Algorithme de tri en place inventé par Edsger Dijkstra (1981). Variante du tri par tas utilisant une forêt de tas de Leonardo au lieu d'un tas binaire. Sa particularité : il se rapproche de O(n) sur des données presque triées, contrairement au heapsort classique.",
                "https://fr.wikipedia.org/wiki/Smoothsort",
                false,
                Map.of(
                        "Java", """
                    // Smoothsort utilise les nombres de Leonardo
                    // L(0)=1, L(1)=1, L(k)=L(k-1)+L(k-2)+1
                    // Deux phases : construction de la forêt Leonardo
                    // puis extraction par trinkle + sift.
                    // Implémentation complète ~150 lignes (voir Wikipedia).""",
                        "Python", """
                      # Smoothsort — algorithme de Dijkstra (1981)
                      # Utilise les nombres de Leonardo comme tailles de tas.
                      # Deux phases : build (sift/trinkle) + extract.
                      # Complexité : O(n log n) pire cas, O(n) si déjà trié.""",
                        "C++", """
                   // Smoothsort — Dijkstra 1981
                   // Leonardo numbers: L[0]=L[1]=1, L[k]=L[k-1]+L[k-2]+1
                   // Phase 1: build Leonardo forest
                   // Phase 2: extract maximum elements
                   // O(n log n) worst case, O(n) nearly-sorted""",
                        "C", "// See full implementation at:\n// https://fr.wikipedia.org/wiki/Smoothsort",
                        "C#", "// See full implementation at:\n// https://fr.wikipedia.org/wiki/Smoothsort",
                        "JavaScript", "// See full implementation at:\n// https://fr.wikipedia.org/wiki/Smoothsort",
                        "PHP", "// See full implementation at:\n// https://fr.wikipedia.org/wiki/Smoothsort"
                )
        );
    }
}