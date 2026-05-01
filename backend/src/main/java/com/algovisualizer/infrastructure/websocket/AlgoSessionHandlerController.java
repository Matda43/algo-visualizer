package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Controller
public class AlgoSessionHandlerController {

    private final Map<String, SortingAlgorithm> algorithms;
    private final StepBroadcasterService broadcaster;
    private final SimpMessagingTemplate template;

    public AlgoSessionHandlerController(
            List<SortingAlgorithm> algorithmList,
            StepBroadcasterService broadcaster,
            SimpMessagingTemplate template
    ) {
        // Spring automatically injects all implementations of SortingAlgorithm
        this.algorithms = algorithmList
                .stream()
                .collect(Collectors.toMap(SortingAlgorithm::getName, Function.identity()));
        this.broadcaster = broadcaster;
        this.template = template;
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

    @MessageMapping("/session.execute")
    public void executeSession(StartSessionRequest req) {
        SortingAlgorithm algo = algorithms.get(req.algo());
        if (algo == null) return;

        int[] arr = req.array().clone();
        List<SortStep> steps = algo.generateSteps(arr);

        // Trouver le step DONE et compter les stats
        int comparisons = 0, swaps = 0, pivots = 0;
        SortStep doneStep = null;

        for (SortStep step : steps) {
            switch (step.type()) {
                case COMPARE -> comparisons++;
                case SWAP    -> swaps++;
                case PIVOT   -> pivots++;
                case DONE    -> doneStep = step;
            }
        }

        if (doneStep == null) return;

        // Envoyer un seul message avec les stats complètes
        ExecuteResult result = new ExecuteResult(
                doneStep.stateSnapshot(),
                comparisons, swaps, pivots,
                req.sessionId()
        );
        template.convertAndSend("/topic/execute." + req.sessionId(), result);
    }
}