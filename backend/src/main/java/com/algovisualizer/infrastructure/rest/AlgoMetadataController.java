package com.algovisualizer.infrastructure.rest;

import com.algovisualizer.domain.model.AlgoMetadata;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/algorithms")
@CrossOrigin(origins = "http://localhost:4200")
public class AlgoMetadataController {

    private final List<SortingAlgorithm> algorithms;

    public AlgoMetadataController(List<SortingAlgorithm> algorithms) {
        this.algorithms = algorithms;
    }

    @GetMapping
    public List<AlgoMetadata> getAll() {
        return algorithms.stream()
                .map(SortingAlgorithm::getMetadata)
                .toList();
    }

    @GetMapping("/{name}")
    public AlgoMetadata getOne(@PathVariable String name) {
        return algorithms.stream()
                .filter(a -> a.getName().equalsIgnoreCase(name))
                .map(SortingAlgorithm::getMetadata)
                .findFirst()
                .orElseThrow();
    }
}