package com.algovisualizer.infrastructure.websocket;

import com.algovisualizer.domain.model.PathStep;
import com.algovisualizer.domain.port.PathfindingAlgorithm;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Controller
public class PathfindingSessionHandlerController {

    private final Map<String, PathfindingAlgorithm> algorithms;
    private final SimpMessagingTemplate              template;
    private final Map<String, PathfindingSession>    sessions  = new ConcurrentHashMap<>();
    private final ScheduledExecutorService           scheduler =
            Executors.newScheduledThreadPool(Runtime.getRuntime().availableProcessors());
    private final ExecutorService                    generatorPool =
            Executors.newCachedThreadPool();

    public PathfindingSessionHandlerController(
            List<PathfindingAlgorithm> algorithmList,
            SimpMessagingTemplate template
    ) {
        this.algorithms = algorithmList.stream()
                .collect(Collectors.toMap(PathfindingAlgorithm::getName, Function.identity()));
        this.template   = template;
    }

    @MessageMapping("/path.start")
    public void startSession(PathfindingRequest req) {
        PathfindingAlgorithm algo = algorithms.get(req.algo());
        if (algo == null) return;

        doStop(req.sessionId());

        PathfindingSession session = new PathfindingSession();
        session.speedMs.set(Math.max(1, req.speedMs()));
        sessions.put(req.sessionId(), session);

        session.generatorTask = generatorPool.submit(() -> {
            try {
                algo.findPath(
                        req.walls(), req.rows(), req.cols(),
                        req.startRow(), req.startCol(), req.endRow(), req.endCol(),
                        req.allowDiagonal(),
                        step -> {
                            if (session.stopped.get()) throw new StoppedException();
                            try { session.queue.put(step); }
                            catch (InterruptedException e) {
                                Thread.currentThread().interrupt();
                                throw new StoppedException();
                            }
                        }
                );
            } catch (StoppedException ignored) {
            } finally {
                session.queue.offer(endMarker());
            }
        });

        scheduleSender(req.sessionId(), session);
    }

    @MessageMapping("/path.pause")
    public void pause(SessionIdRequest req) {
        PathfindingSession session = sessions.get(req.sessionId());
        if (session == null) return;
        session.paused.set(true);
        cancelSender(session);
    }

    @MessageMapping("/path.resume")
    public void resume(SessionIdRequest req) {
        PathfindingSession session = sessions.get(req.sessionId());
        if (session == null || session.stopped.get()) return;
        session.paused.set(false);
        scheduleSender(req.sessionId(), session);
    }

    @MessageMapping("/path.stop")
    public void stop(String sessionId) { doStop(sessionId); }

    @MessageMapping("/path.speed")
    public void setSpeed(SpeedRequest req) {
        PathfindingSession session = sessions.get(req.sessionId());
        if (session == null || session.stopped.get()) return;
        session.speedMs.set(Math.max(1, req.speedMs()));
        if (!session.paused.get()) {
            cancelSender(session);
            scheduleSender(req.sessionId(), session);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void scheduleSender(String sessionId, PathfindingSession session) {
        long delay = Math.max(1, session.speedMs.get());
        session.senderTask = scheduler.scheduleAtFixedRate(() -> {
            if (session.stopped.get() || session.paused.get()) return;
            sendOneStep(sessionId, session);
        }, 0, delay, TimeUnit.MILLISECONDS);
    }

    private void sendOneStep(String sessionId, PathfindingSession session) {
        String    topic = "/topic/path." + sessionId;
        PathStep  step  = session.queue.poll();
        if (step == null) return;
        if (step.type() == null) { // marqueur fin
            doStop(sessionId);
            return;
        }
        template.convertAndSend(topic, step);
    }

    private void cancelSender(PathfindingSession session) {
        if (session.senderTask != null && !session.senderTask.isDone())
            session.senderTask.cancel(false);
    }

    private void doStop(String sessionId) {
        PathfindingSession session = sessions.remove(sessionId);
        if (session == null) return;
        session.stopped.set(true);
        cancelSender(session);
        if (session.generatorTask != null) session.generatorTask.cancel(true);
        session.queue.clear();
    }

    private PathStep endMarker() {
        return new PathStep(null, -1, -1, false, 0, 0);
    }

    private static class StoppedException extends RuntimeException {
        StoppedException() { super(null, null, true, false); }
    }
}