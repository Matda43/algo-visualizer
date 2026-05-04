package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.DataType;
import com.algovisualizer.domain.model.SortStep;
import com.algovisualizer.domain.model.StepType;
import com.algovisualizer.domain.port.SortingAlgorithm;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Controller
public class AlgoSessionHandlerController {

    private final Map<String, SortingAlgorithm> algorithms;
    private final SimpMessagingTemplate          template;
    private final Map<String, SessionState>      sessions  = new ConcurrentHashMap<>();
    private final ScheduledExecutorService       scheduler =
            Executors.newScheduledThreadPool(Runtime.getRuntime().availableProcessors());
    private final ExecutorService                generatorPool =
            Executors.newCachedThreadPool();

    public AlgoSessionHandlerController(
            List<SortingAlgorithm> algorithmList,
            StepBroadcasterService broadcaster,
            SimpMessagingTemplate template
    ) {
        this.algorithms = algorithmList.stream()
                .collect(Collectors.toMap(SortingAlgorithm::getName, Function.identity()));
        this.template   = template;
    }

    @MessageMapping("/session.start")
    public void startSession(StartSessionRequest req) {
        SortingAlgorithm algo = algorithms.get(req.algo());
        if (algo == null) return;

        doStop(req.sessionId());

        double[]     normalized = normalizeArray(req.array(), req.dataType());
        SessionState state      = new SessionState();
        state.speedMs.set(Math.max(1, req.speedMs()));
        sessions.put(req.sessionId(), state);

        // Thread générateur avec backpressure
        state.generatorTask = generatorPool.submit(() -> {
            try {
                algo.generateSteps(normalized, step -> {
                    if (state.stopped.get()) throw new StoppedException();
                    QueuedStep qs = new QueuedStep(
                            step.type(), step.indexA(), step.indexB(),
                            step.stateSnapshot(), false
                    );
                    try { state.queue.put(qs); }
                    catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new StoppedException();
                    }
                });
            } catch (StoppedException ignored) {
            } finally {
                state.queue.offer(QueuedStep.end());
            }
        });

        scheduleSender(req.sessionId(), state);
    }

    @MessageMapping("/session.pause")
    public void pauseSession(SessionIdRequest req) {
        SessionState state = sessions.get(req.sessionId());
        if (state == null) return;
        state.paused.set(true);
        cancelSender(state);
    }

    @MessageMapping("/session.resume")
    public void resumeSession(SessionIdRequest req) {
        SessionState state = sessions.get(req.sessionId());
        if (state == null || state.stopped.get()) return;
        state.paused.set(false);
        scheduleSender(req.sessionId(), state);
    }

    @MessageMapping("/session.step")
    public void nextStep(SessionIdRequest req) {
        SessionState state = sessions.get(req.sessionId());
        if (state == null || !state.paused.get() || state.stopped.get()) return;
        sendOneStep(req.sessionId(), state);
    }

    @MessageMapping("/session.stop")
    public void stopSession(String sessionId) { doStop(sessionId); }

    @MessageMapping("/session.speed")
    public void setSpeed(SpeedRequest req) {
        SessionState state = sessions.get(req.sessionId());
        if (state == null || state.stopped.get()) return;
        state.speedMs.set(Math.max(1, req.speedMs()));
        if (!state.paused.get()) {
            cancelSender(state);
            scheduleSender(req.sessionId(), state);
        }
    }

    @MessageMapping("/session.execute")
    public void executeSession(StartSessionRequest req) {
        SortingAlgorithm algo = algorithms.get(req.algo());
        if (algo == null) return;
        double[] normalized = normalizeArray(req.array(), req.dataType());

        int[] stats = {0, 0, 0};
        double[][] done = {null};

        algo.generateSteps(normalized, step -> {
            switch (step.type()) {
                case COMPARE -> stats[0]++;
                case SWAP    -> stats[1]++;
                case PIVOT   -> stats[2]++;
                case DONE    -> done[0] = step.stateSnapshot();
            }
        });

        if (done[0] == null) return;
        template.convertAndSend("/topic/execute." + req.sessionId(),
                new ExecuteResult(done[0], stats[0], stats[1], stats[2],
                        req.sessionId(), req.dataType()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void scheduleSender(String sessionId, SessionState state) {
        String topic = "/topic/session." + sessionId;
        long   delay = Math.max(1, state.speedMs.get());

        state.senderTask = scheduler.scheduleAtFixedRate(() -> {
            if (state.stopped.get() || state.paused.get()) return;
            sendOneStep(sessionId, state);
        }, 0, delay, TimeUnit.MILLISECONDS);
    }

    private void sendOneStep(String sessionId, SessionState state) {
        String      topic = "/topic/session." + sessionId;
        QueuedStep  qs    = state.queue.poll();
        if (qs == null) return; // Pas encore disponible, retry au prochain tick

        if (qs.isEnd()) {
            doStop(sessionId);
            return;
        }

        SortStep step = new SortStep(qs.type(), qs.indexA(), qs.indexB(), qs.stateSnapshot());
        template.convertAndSend(topic, step);
    }

    private void cancelSender(SessionState state) {
        if (state.senderTask != null && !state.senderTask.isDone())
            state.senderTask.cancel(false);
    }

    private void doStop(String sessionId) {
        SessionState state = sessions.remove(sessionId);
        if (state == null) return;
        state.stopped.set(true);
        cancelSender(state);
        if (state.generatorTask != null) state.generatorTask.cancel(true);
        state.queue.clear();
    }

    private double[] normalizeArray(double[] array, DataType dataType) {
        if (array == null) return new double[0];
        double[] result = new double[array.length];
        for (int i = 0; i < array.length; i++) {
            result[i] = switch (dataType) {
                case INT, CHAR -> Math.floor(array[i]);
                case LONG      -> Math.floor(array[i]);
                case FLOAT     -> Math.round(array[i] * 100.0)   / 100.0;
                case DOUBLE    -> Math.round(array[i] * 10000.0) / 10000.0;
                case STRING    -> array[i];
            };
        }
        return result;
    }

    // Exception interne pour arrêter le générateur proprement
    private static class StoppedException extends RuntimeException {
        StoppedException() { super(null, null, true, false); }
    }
}