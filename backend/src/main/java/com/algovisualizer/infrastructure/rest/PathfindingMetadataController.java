package com.algovisualizer.infrastructure.rest;

import com.algovisualizer.domain.model.PathfindingMetadata;
import com.algovisualizer.domain.port.PathfindingAlgorithm;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pathfinding")
@CrossOrigin(origins = "http://localhost:4200")
public class PathfindingMetadataController {

    private final List<PathfindingAlgorithm> algorithms;

    public PathfindingMetadataController(List<PathfindingAlgorithm> algorithms) {
        this.algorithms = algorithms;
    }

    @GetMapping
    public List<PathfindingMetadata> getAll() {
        return algorithms.stream().map(PathfindingAlgorithm::getMetadata).toList();
    }

    @GetMapping("/{name}")
    public PathfindingMetadata getOne(@PathVariable String name) {
        return algorithms.stream()
                .filter(a -> a.getName().equalsIgnoreCase(name))
                .map(PathfindingAlgorithm::getMetadata)
                .findFirst()
                .orElseThrow();
    }
}