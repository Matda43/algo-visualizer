package com.algovisualizer.infrastructure.algorithm.sorting;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Component
public class TreeSortAlgorithm implements SortingAlgorithm {

    private static class Node {
        double value;
        Node   left, right;
        Node(double value) { this.value = value; }
    }

    @Override
    public void generateSteps(double[] array, Consumer<SortStep> emit) {
        double[] arr = array.clone();
        int n = arr.length;

        // Insérer les éléments un par un dans le BST (visualisation via PIVOT/COMPARE)
        Node root = null;
        for (int i = 0; i < n; i++) {
            emit.accept(new SortStep(StepType.PIVOT, i, i, arr.clone()));
            root = insert(root, arr[i]);
        }

        // Parcours infixe → extraction dans l'ordre trié
        List<Double> sorted = new ArrayList<>();
        inorder(root, sorted);

        // Réécrire le tableau trié avec animation SWAP/SORTED
        for (int i = 0; i < n; i++) {
            arr[i] = sorted.get(i);
            emit.accept(new SortStep(StepType.SWAP, i, i, arr.clone()));
            emit.accept(new SortStep(StepType.SORTED, i, i, arr.clone()));
        }

        emit.accept(new SortStep(StepType.DONE, -1, -1, arr));
    }

    private Node insert(Node node, double value) {
        if (node == null) return new Node(value);
        if (value < node.value) node.left  = insert(node.left,  value);
        else                    node.right = insert(node.right, value);
        return node;
    }

    private void inorder(Node node, List<Double> result) {
        if (node == null) return;
        inorder(node.left, result);
        result.add(node.value);
        inorder(node.right, result);
    }

    @Override
    public String getName() { return "Tree Sort"; }

    @Override
    public AlgoMetadata getMetadata() {
        return new AlgoMetadata(
                "Tree Sort",
                "O(n log n)", "O(n²)", "O(n log n)", "O(n)",
                "Algorithme de tri qui insère tous les éléments dans un arbre binaire de recherche (BST) puis effectue un parcours infixe pour récupérer les valeurs dans l'ordre croissant. Simple à implémenter mais dégradé à O(n²) sur des données déjà triées sans rééquilibrage.",
                "https://fr.wikipedia.org/wiki/Tri_arborescent",
                true,
                Map.of(
                        "Java", """
                    class Node { int val; Node l, r; Node(int v){val=v;} }
                    Node insert(Node n, int v) {
                      if (n==null) return new Node(v);
                      if (v<n.val) n.l=insert(n.l,v);
                      else         n.r=insert(n.r,v);
                      return n;
                    }
                    void inorder(Node n, int[] arr, int[] i) {
                      if (n==null) return;
                      inorder(n.l,arr,i);
                      arr[i[0]++]=n.val;
                      inorder(n.r,arr,i);
                    }
                    void treeSort(int[] arr) {
                      Node root=null;
                      for (int v:arr) root=insert(root,v);
                      inorder(root,arr,new int[]{0});
                    }""",
                        "Python", """
                      class Node:
                        def __init__(self, v): self.v=v; self.l=self.r=None
                      def insert(node, v):
                        if not node: return Node(v)
                        if v < node.v: node.l=insert(node.l,v)
                        else:          node.r=insert(node.r,v)
                        return node
                      def inorder(node, res):
                        if not node: return
                        inorder(node.l,res); res.append(node.v); inorder(node.r,res)
                      def tree_sort(arr):
                        root=None
                        for v in arr: root=insert(root,v)
                        res=[]; inorder(root,res)
                        arr[:]=res""",
                        "C++", """
                   struct Node { int v; Node *l=nullptr, *r=nullptr; Node(int v):v(v){} };
                   Node* insert(Node* n, int v) {
                     if (!n) return new Node(v);
                     if (v<n->v) n->l=insert(n->l,v);
                     else        n->r=insert(n->r,v);
                     return n;
                   }
                   void inorder(Node* n, int* arr, int& i) {
                     if (!n) return;
                     inorder(n->l,arr,i); arr[i++]=n->v; inorder(n->r,arr,i);
                   }
                   void treeSort(int arr[], int n) {
                     Node* root=nullptr;
                     for (int i=0;i<n;i++) root=insert(root,arr[i]);
                     int i=0; inorder(root,arr,i);
                   }""",
                        "C", """
                 typedef struct Node { int v; struct Node *l, *r; } Node;
                 Node* insert(Node* n, int v) {
                   if (!n) { Node* nd=malloc(sizeof(Node)); nd->v=v; nd->l=nd->r=NULL; return nd; }
                   if (v<n->v) n->l=insert(n->l,v); else n->r=insert(n->r,v);
                   return n;
                 }
                 void inorder(Node* n, int* arr, int* i) {
                   if (!n) return;
                   inorder(n->l,arr,i); arr[(*i)++]=n->v; inorder(n->r,arr,i);
                 }""",
                        "C#", """
                  class Node { public int V; public Node L, R; public Node(int v){V=v;} }
                  Node Insert(Node n, int v) {
                    if (n==null) return new Node(v);
                    if (v<n.V) n.L=Insert(n.L,v); else n.R=Insert(n.R,v);
                    return n;
                  }
                  void Inorder(Node n, int[] arr, ref int i) {
                    if (n==null) return;
                    Inorder(n.L,arr,ref i); arr[i++]=n.V; Inorder(n.R,arr,ref i);
                  }
                  void TreeSort(int[] arr) {
                    Node root=null;
                    foreach(int v in arr) root=Insert(root,v);
                    int i=0; Inorder(root,arr,ref i);
                  }""",
                        "JavaScript", """
                          class Node { constructor(v){this.v=v;this.l=this.r=null;} }
                          function insert(node, v) {
                            if (!node) return new Node(v);
                            if (v<node.v) node.l=insert(node.l,v);
                            else          node.r=insert(node.r,v);
                            return node;
                          }
                          function inorder(node, res) {
                            if (!node) return;
                            inorder(node.l,res); res.push(node.v); inorder(node.r,res);
                          }
                          function treeSort(arr) {
                            let root=null;
                            for (const v of arr) root=insert(root,v);
                            const res=[]; inorder(root,res); arr.splice(0,arr.length,...res);
                          }""",
                        "PHP", """
                   class Node { public $v,$l=null,$r=null; function __construct($v){$this->v=$v;} }
                   function insert($n,$v) {
                     if (!$n) return new Node($v);
                     if ($v<$n->v) $n->l=insert($n->l,$v); else $n->r=insert($n->r,$v);
                     return $n;
                   }
                   function inorder($n,&$res) {
                     if (!$n) return;
                     inorder($n->l,$res); $res[]=$n->v; inorder($n->r,$res);
                   }
                   function treeSort(array &$arr): void {
                     $root=null;
                     foreach($arr as $v) $root=insert($root,$v);
                     $res=[]; inorder($root,$res); $arr=$res;
                   }"""
                )
        );
    }
}