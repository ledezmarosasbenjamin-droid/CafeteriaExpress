import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
}

export interface Inicio {
  titulo?: string;
  mensaje?: string;
  subtitulo?: string;
}

export interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

export interface Contacto {
  nombre: string;
  email: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class CafeteriaService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
  }

  getInicio(): Observable<Inicio | null> {
    return this.http.get<Inicio | null>(`${this.apiUrl}/inicio`);
  }

  enviarContacto(contacto: Contacto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/contacto`,
      contacto
    );
  }

  enviarMensaje(mensaje: string): Observable<{ respuesta: string }> {
    return this.http.post<{ respuesta: string }>(`${this.apiUrl}/chatbot`, { mensaje });
  }

  enviarMensajeEnStreaming(mensaje: string): Observable<string> {
    return new Observable<string>((subscriber) => {
      const controller = new AbortController();
      const procesarStream = async () => {
        const response = await fetch(`${this.apiUrl}/chatbot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream'
          },
          body: JSON.stringify({ mensaje }),
          signal: controller.signal
        });

        if (!response.ok) {
          const error = await response.json() as { respuesta?: unknown };
          throw new Error(
            typeof error.respuesta === 'string'
              ? error.respuesta
              : `El barista respondió con un error (${response.status}).`
          );
        }

        if (!response.body) {
          throw new Error('El navegador no pudo abrir la respuesta en tiempo real.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const procesarEvento = (evento: string): boolean => {
          const data = evento
            .split('\n')
            .filter((linea) => linea.startsWith('data:'))
            .map((linea) => linea.slice(5).trimStart())
            .join('\n');

          if (!data) return true;

          const payload = JSON.parse(data) as {
            token?: unknown;
            respuesta?: unknown;
            error?: unknown;
          };

          if (typeof payload.error === 'string') {
            subscriber.error(new Error(
              typeof payload.respuesta === 'string'
                ? payload.respuesta
                : 'El barista tuvo un problema al generar la respuesta.'
            ));
            return false;
          }

          if (typeof payload.token === 'string') {
            subscriber.next(payload.token);
          }

          return !subscriber.closed;
        };

        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');

          let separator = buffer.indexOf('\n\n');
          while (separator !== -1) {
            const evento = buffer.slice(0, separator);
            buffer = buffer.slice(separator + 2);
            if (!procesarEvento(evento)) return;
            separator = buffer.indexOf('\n\n');
          }

          if (done) break;
        }

        if (buffer.trim() && !procesarEvento(buffer)) return;
        subscriber.complete();
      };

      void procesarStream().catch((error: unknown) => {
        if (!subscriber.closed) subscriber.error(error);
      });

      return () => controller.abort();
    });
  }
}