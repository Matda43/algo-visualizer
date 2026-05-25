import { Component, input, computed, output } from '@angular/core';
import { GraphEdge, GraphVertex } from '../models/pathfinding.models';

@Component({
  selector:    'app-graph-renderer',
  standalone:  true,
  templateUrl: './graph-renderer.html',
  styleUrl:    './graph-renderer.scss',
})
export class GraphRendererComponent {

  vertexCount = input.required<number>();
  edges       = input.required<GraphEdge[]>();
  directed    = input(false);

  /** Sommets surligné par l'algo (visited) */
  visitedVertices  = input<Set<number>>(new Set());
  frontierVertices = input<Set<number>>(new Set());
  pathVertices     = input<Set<number>>(new Set());
  pathEdges        = input<Set<string>>(new Set());

  vertexClicked = output<number>();

  private readonly SVG_WIDTH  = 800;
  private readonly SVG_HEIGHT = 500;
  private readonly VERTEX_RADIUS = 22;

  vertices = computed((): GraphVertex[] => {
    const n = this.vertexCount();
    if (n === 0) return [];
    return this.layoutVertices(n);
  });

  edgesWithMidpoint = computed(() => {
    return this.edges().map(edge => {
      const from = this.vertices()[edge.from];
      const to   = this.vertices()[edge.to];
      if (!from || !to) return null;
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const key  = `${edge.from}-${edge.to}`;
      return { ...edge, from, to, midX, midY, key, isPath: this.pathEdges().has(key) };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  });

  /** Place les sommets en cercle, ou en grille si trop nombreux */
  private layoutVertices(n: number): GraphVertex[] {
    const cx = this.SVG_WIDTH  / 2;
    const cy = this.SVG_HEIGHT / 2;

    if (n <= 20) {
      const radius = Math.min(cx, cy) - 60;
      return Array.from({ length: n }, (_, index) => ({
        id: index,
        x:  cx + radius * Math.cos((2 * Math.PI * index) / n - Math.PI / 2),
        y:  cy + radius * Math.sin((2 * Math.PI * index) / n - Math.PI / 2),
      }));
    }

    // Grille pour > 20 sommets
    const cols = Math.ceil(Math.sqrt(n * (this.SVG_WIDTH / this.SVG_HEIGHT)));
    const rows = Math.ceil(n / cols);
    const spacingX = (this.SVG_WIDTH  - 100) / Math.max(cols - 1, 1);
    const spacingY = (this.SVG_HEIGHT - 100) / Math.max(rows - 1, 1);
    return Array.from({ length: n }, (_, index) => ({
      id: index,
      x:  50 + (index % cols) * spacingX,
      y:  50 + Math.floor(index / cols) * spacingY,
    }));
  }

  vertexClass(vertexId: number): string {
    if (this.pathVertices().has(vertexId))    return 'vertex vertex--path';
    if (this.visitedVertices().has(vertexId)) return 'vertex vertex--visited';
    if (this.frontierVertices().has(vertexId)) return 'vertex vertex--frontier';
    return 'vertex';
  }

  /** Calcule les points de la pointe de flèche pour les graphes orientés */
  arrowPoints(fromVertex: GraphVertex, toVertex: GraphVertex): string {
    const angle  = Math.atan2(toVertex.y - fromVertex.y, toVertex.x - fromVertex.x);
    const endX   = toVertex.x - (this.VERTEX_RADIUS + 6) * Math.cos(angle);
    const endY   = toVertex.y - (this.VERTEX_RADIUS + 6) * Math.sin(angle);
    const arrowL = 12;
    const arrowA = 0.4;
    const x1 = endX - arrowL * Math.cos(angle - arrowA);
    const y1 = endY - arrowL * Math.sin(angle - arrowA);
    const x2 = endX - arrowL * Math.cos(angle + arrowA);
    const y2 = endY - arrowL * Math.sin(angle + arrowA);
    return `${endX},${endY} ${x1},${y1} ${x2},${y2}`;
  }

  /** Point d'arrivée de la ligne pour éviter de traverser le cercle */
  lineEnd(fromVertex: GraphVertex, toVertex: GraphVertex): { x: number; y: number } {
    const angle = Math.atan2(toVertex.y - fromVertex.y, toVertex.x - fromVertex.x);
    return {
      x: toVertex.x - (this.VERTEX_RADIUS + (this.directed() ? 6 : 0)) * Math.cos(angle),
      y: toVertex.y - (this.VERTEX_RADIUS + (this.directed() ? 6 : 0)) * Math.sin(angle),
    };
  }

  lineStart(fromVertex: GraphVertex, toVertex: GraphVertex): { x: number; y: number } {
    const angle = Math.atan2(toVertex.y - fromVertex.y, toVertex.x - fromVertex.x);
    return {
      x: fromVertex.x + this.VERTEX_RADIUS * Math.cos(angle),
      y: fromVertex.y + this.VERTEX_RADIUS * Math.sin(angle),
    };
  }
}