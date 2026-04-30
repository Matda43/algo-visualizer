package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Controller
public class AlgoSessionHandlerController {

    private final Map<String, SortingAlgorithm> algorithms;
    private final StepBroadcasterService broadcaster;

    public AlgoSessionHandlerController(
            List<SortingAlgorithm> algorithmList,
            StepBroadcasterService broadcaster
    ) {
        // Spring automatically injects all implementations of SortingAlgorithm
        this.algorithms = algorithmList
                .stream()
                .collect(Collectors.toMap(SortingAlgorithm::getName, Function.identity()));
        this.broadcaster = broadcaster;
    }

    @MessageMapping("/session.start")
    public void startSession(
            StartSessionRequest req,
            SimpMessageHeaderAccessor headers
    ) {
        SortingAlgorithm algo = algorithms.get(req.algo());
        if (algo == null) return;

        List<SortStep> steps = algo.generateSteps(req.array());
        String topic = "/topic/session." + req.sessionId();
        broadcaster.stream(steps, topic, req.sessionId());
    }

    @MessageMapping("/session.speed")
    public void setSpeed(
            SpeedRequest req,
            SimpMessageHeaderAccessor headers
    ) {
        broadcaster.updateSpeed(req.sessionId(), req.speedMs());
    }
}