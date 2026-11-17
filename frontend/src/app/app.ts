import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CafeteriaService, Contacto, Inicio, MensajeChat, Producto } from './cafeteria.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, AfterViewChecked, OnDestroy {
  title = 'CoffeeHouse';
  productos: Producto[] = [];
  productImages = [
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=720&q=75',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=720&q=75'
  ];
  mensajeInicio: Inicio = {};
  errorConexion: string = '';
  cargandoProductos = true;
  pedidoAgregado = '';
  contacto: Contacto = { nombre: '', email: '', mensaje: '' };
  enviandoContacto = false;
  errorContacto = '';
  mensajeContactoExito = '';
  chatAbierto = false;
  mensajeUsuario = '';
  cargandoRespuesta = false;
  respuestaEnCurso = '';
  errorChat = '';
  mensajesChat: MensajeChat[] = [
    { role: 'assistant', content: '¡Hola! Soy tu barista virtual. ¿Qué te gustaría saber?' }
  ];
  @ViewChild('chatMessages') private chatMessages?: ElementRef<HTMLDivElement>;

  private pedidoTimeout?: ReturnType<typeof setTimeout>;
  private contactoTimeout?: ReturnType<typeof setTimeout>;
  private lastChatScrollState = '';
  private chatSubscription?: Subscription;

  constructor(
    private cafeteriaService: CafeteriaService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngAfterViewChecked(): void {
    const messagesElement = this.chatMessages?.nativeElement;
    if (!messagesElement) {
      this.lastChatScrollState = '';
      return;
    }

    const scrollState = `${this.mensajesChat.length}:${this.cargandoRespuesta}:${this.respuestaEnCurso.length}:${this.errorChat}`;
    if (scrollState !== this.lastChatScrollState) {
      messagesElement.scrollTop = messagesElement.scrollHeight;
      this.lastChatScrollState = scrollState;
    }
  }

  ngOnDestroy(): void {
    if (this.pedidoTimeout) {
      clearTimeout(this.pedidoTimeout);
    }
    if (this.contactoTimeout) {
      clearTimeout(this.contactoTimeout);
    }
    this.chatSubscription?.unsubscribe();
  }

  agregarPedido(nombre: string): void {
    this.pedidoAgregado = `¡${nombre} añadido a tu pedido! Buena elección.`;
    if (this.pedidoTimeout) {
      clearTimeout(this.pedidoTimeout);
    }
    this.pedidoTimeout = setTimeout(() => {
      this.pedidoAgregado = '';
      this.changeDetector.detectChanges();
    }, 4500);
    this.changeDetector.detectChanges();
  }

  enviarContacto(form?: NgForm): void {
    if (this.enviandoContacto) return;

    this.enviandoContacto = true;
    this.errorContacto = '';
    this.mensajeContactoExito = '';

    this.cafeteriaService.enviarContacto(this.contacto).subscribe({
      next: () => {
        this.contacto = { nombre: '', email: '', mensaje: '' };
        form?.resetForm(this.contacto);
        this.mensajeContactoExito = '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto';
        this.enviandoContacto = false;
        if (this.contactoTimeout) {
          clearTimeout(this.contactoTimeout);
        }
        this.contactoTimeout = setTimeout(() => {
          this.mensajeContactoExito = '';
          this.changeDetector.detectChanges();
        }, 5000);
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        console.error('Error al enviar el formulario de contacto:', error);
        this.errorContacto = 'No se pudo enviar el mensaje. Inténtalo nuevamente en un momento.';
        this.enviandoContacto = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.cafeteriaService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargandoProductos = false;
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.errorConexion = 'No se pudieron cargar los productos del servidor.';
        this.cargandoProductos = false;
        this.changeDetector.detectChanges();
      }
    });

    this.cafeteriaService.getInicio().subscribe({
      next: (data) => {
        this.mensajeInicio = data ?? {};
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar inicio:', err);
        this.changeDetector.detectChanges();
      }
    });
  }

  enviarMensaje(): void {
    const texto = this.mensajeUsuario.trim();
    if (!texto || this.cargandoRespuesta) return;

    this.mensajesChat.push({ role: 'user', content: texto });
    this.mensajeUsuario = '';
    this.errorChat = '';
    this.respuestaEnCurso = '';
    this.cargandoRespuesta = true;

    this.chatSubscription = this.cafeteriaService.enviarMensajeEnStreaming(texto).subscribe({
      next: (fragmento) => {
        this.respuestaEnCurso += fragmento;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        console.warn('No se pudo completar la respuesta del chatbot:', error);
        if (this.respuestaEnCurso.trim()) {
          this.mensajesChat.push({ role: 'assistant', content: this.respuestaEnCurso.trim() });
        }
        const respuesta = error instanceof Error
          && !(error instanceof TypeError)
          && error.message
          ? error.message
          : 'No se pudo contactar al barista virtual. Intenta nuevamente.';
        this.mensajesChat.push({ role: 'assistant', content: respuesta });
        this.respuestaEnCurso = '';
        this.errorChat = '';
        this.cargandoRespuesta = false;
        this.changeDetector.detectChanges();
      },
      complete: () => {
        this.mensajesChat.push({
          role: 'assistant',
          content: this.respuestaEnCurso.trim() || 'No alcancé a preparar una respuesta. Inténtalo nuevamente.'
        });
        this.respuestaEnCurso = '';
        this.cargandoRespuesta = false;
        this.changeDetector.detectChanges();
      }
    });
  }
}