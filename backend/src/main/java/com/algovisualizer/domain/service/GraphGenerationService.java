package com.algovisualizer.domain.service;

import com.algovisualizer.domain.model.GeneratedGraph;
import com.algovisualizer.domain.model.GraphEdge;
import com.algovisualizer.infrastructure.rest.GraphGenerationRequest;
import com.algovisualizer.infrastructure.rest.GraphValidationRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GraphGenerationService {

    // ── Génération ─────────────────────────────────────────────────────────

    public GeneratedGraph generate(GraphGenerationRequest req) {
        int     n       = Math.max(2, req.vertexCount());
        double  minW    = req.minWeight();
        double  maxW    = Math.max(minW + 0.1, req.maxWeight());
        boolean tree    = req.tree();
        boolean directed = req.directed();

        List<GraphEdge> edges = tree
                ? generateTree(n, minW, maxW)
                : generateGraph(n, directed, minW, maxW);

        return new GeneratedGraph(n, edges, directed, tree, List.of());
    }

    /** Génère un arbre couvrant aléatoire (connexe, acyclique, N-1 arêtes). */
    private List<GraphEdge> generateTree(int n, double minW, double maxW) {
        Random rng   = new Random();
        List<GraphEdge> edges = new ArrayList<>();
        List<Integer> connected = new ArrayList<>();
        connected.add(0);
        List<Integer> remaining = new ArrayList<>();
        for (int i = 1; i < n; i++) remaining.add(i);

        while (!remaining.isEmpty()) {
            int fromIdx = rng.nextInt(connected.size());
            int toIdx   = rng.nextInt(remaining.size());
            int from    = connected.get(fromIdx);
            int to      = remaining.get(toIdx);
            double weight = roundToTwo(minW + rng.nextDouble() * (maxW - minW));
            edges.add(new GraphEdge(from, to, weight));
            connected.add(to);
            remaining.remove(toIdx);
        }

        return edges;
    }

    /** Génère un graphe aléatoire connexe. */
    private List<GraphEdge> generateGraph(int n, boolean directed, double minW, double maxW) {
        Random rng = new Random();
        // D'abord un arbre couvrant pour garantir la connexité
        List<GraphEdge> edges = new ArrayList<>(generateTree(n, minW, maxW));

        // Ajouter des arêtes supplémentaires (~30 % de la densité max)
        int extraEdges = (int) (n * (n - 1) * 0.15);
        Set<String> existing = new HashSet<>();
        for (GraphEdge e : edges) existing.add(e.from() + "-" + e.to());

        for (int attempt = 0; attempt < extraEdges * 3 && edges.size() < extraEdges + n - 1; attempt++) {
            int from = rng.nextInt(n);
            int to   = rng.nextInt(n);
            if (from == to) continue;
            String key = from + "-" + to;
            if (existing.contains(key)) continue;
            if (!directed) {
                String reverseKey = to + "-" + from;
                if (existing.contains(reverseKey)) continue;
            }
            double weight = roundToTwo(minW + rng.nextDouble() * (maxW - minW));
            edges.add(new GraphEdge(from, to, weight));
            existing.add(key);
        }

        return edges;
    }

    // ── Validation ─────────────────────────────────────────────────────────

    public List<String> validate(GraphValidationRequest req) {
        List<String> errors = new ArrayList<>();
        int          n      = req.vertexCount();
        List<GraphEdge> edges = req.edges();

        if (n < 1) {
            errors.add("Le nombre de sommets doit être ≥ 1.");
            return errors;
        }

        // Vérification des indices de sommets
        for (GraphEdge edge : edges) {
            if (edge.from() < 0 || edge.from() >= n || edge.to() < 0 || edge.to() >= n) {
                errors.add("Arête invalide : sommet " + edge.from() + " → " + edge.to()
                        + " hors plage [0, " + (n - 1) + "].");
            }
        }

        // Poids négatifs selon l'algorithme
        boolean forbidsNegative = req.algorithm() != null &&
                (req.algorithm().equalsIgnoreCase("Dijkstra") ||
                        req.algorithm().equalsIgnoreCase("A*") ||
                        req.algorithm().equalsIgnoreCase("Greedy BFS"));
        if (forbidsNegative) {
            for (GraphEdge edge : edges) {
                if (edge.weight() < 0) {
                    errors.add("L'algorithme " + req.algorithm()
                            + " ne supporte pas les poids négatifs (arête "
                            + edge.from() + " → " + edge.to() + " = " + edge.weight() + ").");
                }
            }
        }

        // Validation spécifique arbre
        if (req.expectTree()) {
            validateTree(n, edges, errors);
        }

        return errors;
    }

    private void validateTree(int n, List<GraphEdge> edges, List<String> errors) {
        // Un arbre sur N sommets doit avoir exactement N-1 arêtes
        if (edges.size() != n - 1) {
            errors.add("Un arbre sur " + n + " sommet(s) doit avoir exactement "
                    + (n - 1) + " arête(s) (reçu : " + edges.size() + ").");
        }

        // Vérification connexité + acyclicité via Union-Find
        int[] parent = new int[n];
        int[] rank   = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;

        for (GraphEdge edge : edges) {
            int rootFrom = find(parent, edge.from());
            int rootTo   = find(parent, edge.to());
            if (rootFrom == rootTo) {
                errors.add("Cycle détecté : l'arête " + edge.from() + " → " + edge.to()
                        + " crée un cycle.");
            } else {
                union(parent, rank, rootFrom, rootTo);
            }
        }

        // Connexité : tous les sommets doivent avoir la même racine
        if (!edges.isEmpty()) {
            int root = find(parent, 0);
            for (int vertex = 1; vertex < n; vertex++) {
                if (find(parent, vertex) != root) {
                    errors.add("Le graphe n'est pas connexe : le sommet " + vertex
                            + " n'est pas relié au reste de l'arbre.");
                }
            }
        }
    }

    // ── Union-Find ─────────────────────────────────────────────────────────

    private int find(int[] parent, int x) {
        if (parent[x] != x) parent[x] = find(parent, parent[x]);
        return parent[x];
    }

    private void union(int[] parent, int[] rank, int x, int y) {
        if (rank[x] < rank[y])      parent[x] = y;
        else if (rank[x] > rank[y]) parent[y] = x;
        else { parent[y] = x; rank[x]++; }
    }

    // ── Utilitaires ────────────────────────────────────────────────────────

    private double roundToTwo(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}