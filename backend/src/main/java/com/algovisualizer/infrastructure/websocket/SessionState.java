package com.algovisualizer.infrastructure.websocket;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

public class SessionState {
    public final BlockingQueue<QueuedStep> queue   = new LinkedBlockingQueue<>(500);
    public final AtomicLong   speedMs              = new AtomicLong(100);
    public final AtomicBoolean paused              = new AtomicBoolean(false);
    public final AtomicBoolean stopped             = new AtomicBoolean(false);
    public volatile ScheduledFuture<?> senderTask;
    public volatile Future<?> generatorTask;
}