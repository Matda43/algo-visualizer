package com.algovisualizer.infrastructure.rest;

import com.algovisualizer.domain.model.GeneratedGraph;
import com.algovisualizer.domain.model.GeneratedGrid;
import com.algovisualizer.domain.service.GraphGenerationService;
import com.algovisualizer.domain.service.GridGenerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pathfinding/generate")
@CrossOrigin(origins = "http://localhost:4200")
public class PathfindingGenerationController {

    private final GridGenerationService  gridService;
    private final GraphGenerationService graphService;

    public PathfindingGenerationController(
            GridGenerationService  gridService,
            GraphGenerationService graphService
    ) {
        this.gridService  = gridService;
        this.graphService = graphService;
    }

    // ── Grille / Labyrinthe ────────────────────────────────────────────────

    @PostMapping("/grid")
    public ResponseEntity<GeneratedGrid> generateGrid(@RequestBody GridGenerationRequest req) {
        if (req.rows() < 2 || req.rows() > 200 || req.cols() < 2 || req.cols() > 200) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(gridService.generate(req));
    }

    // ── Graphe ─────────────────────────────────────────────────────────────

    @PostMapping("/graph")
    public ResponseEntity<GeneratedGraph> generateGraph(@RequestBody GraphGenerationRequest req) {
        if (req.vertexCount() < 2 || req.vertexCount() > 500) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(graphService.generate(req));
    }

    // ── Validation graphe / arbre ──────────────────────────────────────────

    @PostMapping("/validate")
    public ResponseEntity<List<String>> validateGraph(@RequestBody GraphValidationRequest req) {
        return ResponseEntity.ok(graphService.validate(req));
    }
}