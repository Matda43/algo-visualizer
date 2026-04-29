package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.SortStep;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class StepBroadcasterService {

    private final SimpMessagingTemplate template;
    private final Map<String, AtomicInteger> speedMap = new ConcurrentHashMap<>();

    public StepBroadcasterService(SimpMessagingTemplate template) {
        this.template = template;
    }

    public void stream(List<SortStep> steps, String topic) {
        CompletableFuture.runAsync(() -> {
            try {
                for (SortStep step : steps) {
                    template.convertAndSend(topic, step);
                    int delay = speedMap.getOrDefault(topic, new AtomicInteger(100)).get();
                    Thread.sleep(delay);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

    public void updateSpeed(String sessionId, int ms) {
        speedMap.computeIfAbsent(sessionId, k -> new AtomicInteger()).set(ms);
    }

    public void cleanup(String sessionId) {
        speedMap.remove(sessionId);
    }
}