import { Injectable, inject, DestroyRef } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private destroyRef = inject(DestroyRef);

  private client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    debug: (msg: string) => console.log('[STOMP]', msg),
    reconnectDelay: 5000,
  });

  private connected = false;

  connect(): Observable<void> {
    return new Observable(observer => {
      this.client.onConnect = () => {
        this.connected = true;
        observer.next();
      };
      this.client.onStompError = frame => observer.error(frame);
      this.client.activate();
    });
  }

  subscribe<T>(topic: string): Observable<T> {
    return new Observable<T>(observer => {
      const sub = this.client.subscribe(topic, (msg: IMessage) =>
        observer.next(JSON.parse(msg.body) as T)
      );
      return () => sub.unsubscribe();
    }).pipe(takeUntilDestroyed(this.destroyRef));
  }

  send(destination: string, body: unknown): void {
    if (this.connected) {
      this.client.publish({ destination, body: JSON.stringify(body) });
    }
  }

  disconnect(): void {
    this.client.deactivate();
    this.connected = false;
  }
}