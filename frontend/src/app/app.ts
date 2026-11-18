import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CafeteriaService, Contacto, Inicio, MensajeChat, Producto } from './cafeteria.service';

export interface CartItem {
  id: string;
  producto: Producto;
  cantidad: number;
  tamano: string;
  leche: string;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
  imagen: string;
}

export interface MetodoExtraccion {
  nombre: string;
  icono: string;
  tiempo: string;
  perfil: string;
  descripcion: string;
}

export interface Testimonio {
  nombre: string;
  rol: string;
  comentario: string;
  estrellas: number;
  avatar: string;
  fecha: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, AfterViewChecked, OnDestroy {
  title = 'Café de altura, sabor de origen';

  // Catálogo base de alta calidad con datos enriquecidos
  readonly defaultCatalog: Producto[] = [
    {
      id: 1,
      nombre: 'Café Americano',
      precio: 18,
      descripcion: 'Espresso doble suavizado con agua caliente filtrada; limpio, equilibrado y con sutiles notas cítricas.',
      categoria: 'Calientes',
      popular: true,
      intensidad: 4,
      notasCata: ['Cacao', 'Cítricos', 'Nuez'],
      origen: 'Caranavi, La Paz · 1,700m'
    },
    {
      id: 2,
      nombre: 'Mocaccino',
      precio: 25,
      descripcion: 'Espresso intenso, chocolate artesanal 70% cacao y leche sedosa, terminado con cacao fino rallado.',
      categoria: 'Especialidades',
      popular: true,
      intensidad: 3,
      notasCata: ['Chocolate Belga', 'Canela', 'Vainilla'],
      origen: 'Villa Tunari, Cochabamba · 1,500m'
    },
    {
      id: 3,
      nombre: 'Caramel Velvet Latte',
      precio: 24,
      descripcion: 'Espresso equilibrado con leche vaporizada ultra sedosa y un hilo de toffee de caramelo salado casero.',
      categoria: 'Calientes',
      popular: true,
      intensidad: 2,
      notasCata: ['Caramelo', 'Mantequilla', 'Miel'],
      origen: 'Samaipata, Santa Cruz · 1,600m'
    },
    {
      id: 4,
      nombre: 'Flat White Artesanal',
      precio: 24,
      descripcion: 'Doble ristretto con microespuma de textura sedosa que realza el dulzor y cuerpo natural del grano.',
      categoria: 'Calientes',
      popular: false,
      intensidad: 4,
      notasCata: ['Frutos Secos', 'Caramelo', 'Panela'],
      origen: 'Yungas, La Paz · 1,800m'
    },
    {
      id: 5,
      nombre: 'Iced Vanilla Cold Brew',
      precio: 26,
      descripcion: 'Maceración lenta en frío durante 18 horas; baja acidez, dulzor natural y toque de vainilla sobre hielo.',
      categoria: 'Fríos',
      popular: true,
      intensidad: 4,
      notasCata: ['Vainilla', 'Mora Silvestre', 'Malta'],
      origen: 'Chapare, Cochabamba · 1,450m'
    },
    {
      id: 6,
      nombre: 'Frappé Espresso Choco',
      precio: 28,
      descripcion: 'Espresso doble frappé batido con hielo cristalino, leche fresca, crema batida y jarabe de chocolate.',
      categoria: 'Fríos',
      popular: false,
      intensidad: 3,
      notasCata: ['Chocolate Negro', 'Crema', 'Espresso'],
      origen: 'Caranavi, La Paz · 1,650m'
    },
    {
      id: 7,
      nombre: 'Croissant de Mantequilla Francés',
      precio: 15,
      descripcion: 'Hojaldre artesanal con pura mantequilla, crujiente por fuera y tierno por dentro. Horneado cada mañana.',
      categoria: 'Repostería',
      popular: true,
      intensidad: 1,
      notasCata: ['Mantequilla', 'Tostado', 'Caramelo'],
      origen: 'Elaboración artesanal propia'
    },
    {
      id: 8,
      nombre: 'Brownie de Chocolate & Nueces',
      precio: 18,
      descripcion: 'Bizcocho húmedo e intenso de cacao boliviano con trozos de nueces seleccionadas y corazón fundente.',
      categoria: 'Repostería',
      popular: false,
      intensidad: 1,
      notasCata: ['Cacao 70%', 'Nuez Tostada', 'Café'],
      origen: 'Elaboración artesanal propia'
    },
    {
      id: 9,
      nombre: 'Cheesecake de Frutos Rojos',
      precio: 23,
      descripcion: 'Tarta cremosa de queso con base crujiente de galleta de canela y coulis artesanal de frutos del bosque.',
      categoria: 'Repostería',
      popular: true,
      intensidad: 1,
      notasCata: ['Arándano', 'Frambuesa', 'Queso Crema'],
      origen: 'Elaboración artesanal propia'
    }
  ];

  productImages = [
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    '/products/mocaccino.jpg',
    'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'
  ];

  productos: Producto[] = [];
  mensajeInicio: Inicio = {
    titulo: 'Café de altura, sabor de origen',
    subtitulo: 'Sabor de origen en cada preparación.',
    mensaje: 'Granos de especialidad cultivados en alturas privilegiadas, tostados en pequeños lotes y preparados con pasión para una experiencia inolvidable.'
  };

  errorConexion = '';
  cargandoProductos = true;
  pedidoAgregado = '';

  // Filtros y búsqueda interactiva
  terminoBusqueda = '';
  categoriaSeleccionada = 'Todos';
  readonly categorias: string[] = ['Todos', 'Calientes', 'Fríos', 'Repostería', 'Favoritos'];
  criterioOrden: 'default' | 'precio-asc' | 'precio-desc' | 'nombre' = 'default';
  favoritos: Set<number> = new Set([1, 2, 5]);

  // Carrito de compras interactivo
  carrito: CartItem[] = [];
  carritoAbierto = false;
  codigoCupon = '';
  descuentoAplicado = 0;
  mensajeCupon = '';
  tipoEntrega: 'local' | 'llevar' | 'delivery' = 'local';
  pedidoConfirmadoModal = false;
  ultimoPedidoId = '';

  // Modal de Detalle / Personalización
  modalDetalleAbierto = false;
  productoDetalle: Producto | null = null;
  detalleTamano = 'Mediano';
  detalleLeche = 'Entera';
  detalleCantidad = 1;
  detalleNotas = '';

  // Recomendador de café interactivo (Barista Matcher)
  quizMood = '';
  quizPreferencia = '';
  quizResultado: Producto | null = null;

  // Métodos de extracción interactivos
  readonly metodosExtraccion: MetodoExtraccion[] = [
    {
      nombre: 'Espresso Doble',
      icono: '☕',
      tiempo: '25-30 seg',
      perfil: 'Intenso, aromático y con crema dorada espesa',
      descripcion: 'Extracción a 9 bares de presión con agua a 92°C, capturando los aceites esenciales más puros del grano.'
    },
    {
      nombre: 'V60 Pour Over',
      icono: '⏳',
      tiempo: '3.5 min',
      perfil: 'Cuerpo ligero, limpio, con notas florales y acidez brillante',
      descripcion: 'Filtrado manual de precisión con vertido en espiral que resalta los matices más complejos del origen.'
    },
    {
      nombre: 'Prensa Francesa',
      icono: '🫖',
      tiempo: '4 min',
      perfil: 'Cuerpo pleno, denso y con notas terrosas profundas',
      descripcion: 'Inmersión completa donde los posos se funden con el agua, conservando todos los aceites naturales.'
    },
    {
      nombre: 'Cold Brew 18h',
      icono: '🧊',
      tiempo: '18 horas',
      perfil: 'Extra suave, 65% menos ácido y con dulzor achocolatado',
      descripcion: 'Maceración paciente en frío que extrae sabores dulces y notas de caramelo sin amargor.'
    }
  ];
  metodoActivoIndex = 0;

  // Testimonios y reseñas
  readonly testimonios: Testimonio[] = [
    {
      nombre: 'Sofía Montenegro',
      rol: 'Cliente habitual · Arquitecta',
      comentario: 'El mejor Flat White de Cochabamba sin discusión. El ambiente es acogedor, la música impecable y el aroma a café recién tostado te atrapa.',
      estrellas: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      fecha: 'Ayer'
    },
    {
      nombre: 'Rodrigo Albarracín',
      rol: 'Coffee Explorer · Diseñador',
      comentario: 'La atención de los baristas es de otro nivel. Te explican el origen del café y preparan cada taza con amor artesanal. El croissant es un 10.',
      estrellas: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      fecha: 'Hace 3 días'
    },
    {
      nombre: 'Luciana Valdivia',
      rol: 'Estudiante universitaria',
      comentario: 'El Cold Brew con vainilla es adictivo en las tardes cálidas. Además el chatbot barista en la web me sugirió exactamente lo que quería probar.',
      estrellas: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      fecha: 'Esta semana'
    }
  ];
  testimonioActivo = 0;

  // Formulario de contacto
  contacto: Contacto = { nombre: '', email: '', mensaje: '' };
  motivoContacto = 'Consulta general';
  enviandoContacto = false;
  errorContacto = '';
  mensajeContactoExito = '';

  // Chatbot con Barista Virtual
  chatAbierto = false;
  mensajeUsuario = '';
  cargandoRespuesta = false;
  respuestaEnCurso = '';
  errorChat = '';
  mensajesChat: MensajeChat[] = [
    {
      role: 'assistant',
      content: '¡Hola! Soy tu barista virtual de Café de altura, sabor de origen. ¿Te gustaría una recomendación especial o tienes alguna duda sobre nuestro menú?'
    }
  ];

  // Prompts rápidos para el chat
  readonly sugerenciasChat: string[] = [
    '☕ ¿Cuál es el café más suave?',
    '⚡ Necesito energía para estudiar',
    '🧊 ¿Qué bebidas frías tienen?',
    '🥐 ¿Qué postre recomiendas?',
    '📍 ¿Dónde están ubicados?',
    '⏰ ¿Cuáles son sus horarios?'
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

  ngOnInit(): void {
    this.cargarDatos();
  }

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
    if (this.pedidoTimeout) clearTimeout(this.pedidoTimeout);
    if (this.contactoTimeout) clearTimeout(this.contactoTimeout);
    this.chatSubscription?.unsubscribe();
  }

  cargarDatos(): void {
    this.cargandoProductos = true;
    this.cafeteriaService.getProductos().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Fusionar con datos de presentación
          this.productos = data.map((prod, index) => {
            const fallback = this.defaultCatalog[index % this.defaultCatalog.length];
            return {
              ...fallback,
              ...prod,
              imagen: this.obtenerImagenProducto(prod),
              categoria: prod.categoria || fallback.categoria || (index % 3 === 0 ? 'Calientes' : index % 3 === 1 ? 'Especialidades' : 'Repostería'),
              popular: prod.popular !== undefined ? prod.popular : (index % 2 === 0),
              intensidad: prod.intensidad || fallback.intensidad || 3,
              notasCata: prod.notasCata || fallback.notasCata || ['Notas de origen', 'Tueste medio']
            };
          });
        } else {
          this.productos = this.defaultCatalog.map(p => ({
            ...p,
            imagen: this.obtenerImagenProducto(p)
          }));
        }
        this.cargandoProductos = false;
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        console.warn('Backend no disponible, usando catálogo de especialidad integrado:', err);
        this.productos = this.defaultCatalog.map(p => ({
          ...p,
          imagen: this.obtenerImagenProducto(p)
        }));
        this.cargandoProductos = false;
        this.changeDetector.detectChanges();
      }
    });

    this.cafeteriaService.getInicio().subscribe({
      next: (data) => {
        if (data && data.titulo) {
          this.mensajeInicio = data;
        }
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.changeDetector.detectChanges();
      }
    });
  }

  // --- FILTRADO Y BÚSQUEDA ---
  get productosFiltrados(): Producto[] {
    let lista = [...this.productos];

    // Filtro por término de búsqueda
    if (this.terminoBusqueda.trim()) {
      const q = this.terminoBusqueda.toLowerCase().trim();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
      );
    }

    // Filtro por categoría
    if (this.categoriaSeleccionada === 'Favoritos') {
      lista = lista.filter(p => this.favoritos.has(p.id));
    } else if (this.categoriaSeleccionada !== 'Todos') {
      lista = lista.filter(p => (p.categoria || '').toLowerCase() === this.categoriaSeleccionada.toLowerCase());
    }

    // Ordenamiento
    if (this.criterioOrden === 'precio-asc') {
      lista.sort((a, b) => a.precio - b.precio);
    } else if (this.criterioOrden === 'precio-desc') {
      lista.sort((a, b) => b.precio - a.precio);
    } else if (this.criterioOrden === 'nombre') {
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return lista;
  }

  seleccionarCategoria(cat: string): void {
    this.categoriaSeleccionada = cat;
  }

  toggleFavorito(id: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.favoritos.has(id)) {
      this.favoritos.delete(id);
    } else {
      this.favoritos.add(id);
    }
  }

  esFavorito(id: number): boolean {
    return this.favoritos.has(id);
  }

  // --- CARRITO DE COMPRAS ---
  agregarPedido(nombre: string): void {
    const prod = this.productos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase()) ||
                 this.defaultCatalog.find(p => p.nombre.toLowerCase() === nombre.toLowerCase()) || {
                   id: 999,
                   nombre,
                   precio: 20,
                   descripcion: ''
                 };

    this.agregarAlCarrito(prod, 1, 'Mediano', 'Entera');

    this.pedidoAgregado = `¡${nombre} añadido a tu pedido! Buena elección.`;
    if (this.pedidoTimeout) clearTimeout(this.pedidoTimeout);
    this.pedidoTimeout = setTimeout(() => {
      this.pedidoAgregado = '';
      this.changeDetector.detectChanges();
    }, 4500);
    this.changeDetector.detectChanges();
  }

  agregarAlCarrito(prod: Producto, cantidad = 1, tamano = 'Mediano', leche = 'Entera', notas = ''): void {
    let recargoTamano = 0;
    if (tamano === 'Grande (16 oz)') recargoTamano = 4;
    if (tamano === 'Chico (8 oz)') recargoTamano = -2;

    let recargoLeche = 0;
    if (leche.includes('Almendras') || leche.includes('Avena')) recargoLeche = 3;

    const precioUnitario = Math.max(1, prod.precio + recargoTamano + recargoLeche);
    const key = `${prod.id}-${tamano}-${leche}-${notas.trim()}`;

    const index = this.carrito.findIndex(item => item.id === key);
    const imagen = prod.imagen || this.obtenerImagenProducto(prod.id);

    if (index > -1) {
      this.carrito[index].cantidad += cantidad;
      this.carrito[index].subtotal = this.carrito[index].cantidad * this.carrito[index].precioUnitario;
    } else {
      this.carrito.push({
        id: key,
        producto: prod,
        cantidad,
        tamano,
        leche,
        precioUnitario,
        subtotal: cantidad * precioUnitario,
        notas: notas.trim(),
        imagen
      });
    }

    this.changeDetector.detectChanges();
  }

  quitarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
    this.changeDetector.detectChanges();
  }

  cambiarCantidad(index: number, delta: number): void {
    if (this.carrito[index]) {
      this.carrito[index].cantidad += delta;
      if (this.carrito[index].cantidad <= 0) {
        this.quitarDelCarrito(index);
      } else {
        this.carrito[index].subtotal = this.carrito[index].cantidad * this.carrito[index].precioUnitario;
      }
      this.changeDetector.detectChanges();
    }
  }

  vaciarCarrito(): void {
    this.carrito = [];
    this.descuentoAplicado = 0;
    this.mensajeCupon = '';
    this.changeDetector.detectChanges();
  }

  toggleCarrito(): void {
    this.carritoAbierto = !this.carritoAbierto;
  }

  get cantidadTotalCarrito(): number {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  get subtotalCarrito(): number {
    return this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get totalCarrito(): number {
    const total = this.subtotalCarrito - this.descuentoAplicado;
    return Math.max(0, total);
  }

  aplicarCupon(): void {
    const code = this.codigoCupon.trim().toUpperCase();
    if (code === 'COFFEE2026' || code === 'BARISTA' || code === 'ESPECIAL') {
      const descuento = Math.round(this.subtotalCarrito * 0.15);
      this.descuentoAplicado = descuento;
      this.mensajeCupon = `¡Cupón ${code} aplicado! Ahorraste Bs. ${descuento} (15% OFF).`;
    } else if (code) {
      this.descuentoAplicado = 0;
      this.mensajeCupon = 'Cupón no válido. Prueba usando "COFFEE2026".';
    }
  }

  confirmarPedido(): void {
    if (this.carrito.length === 0) return;
    this.ultimoPedidoId = 'CH-' + Math.floor(1000 + Math.random() * 9000);
    this.pedidoConfirmadoModal = true;
  }

  cerrarModalConfirmacion(): void {
    this.pedidoConfirmadoModal = false;
    this.vaciarCarrito();
    this.carritoAbierto = false;
  }

  pedirPorWhatsApp(): void {
    if (this.carrito.length === 0) return;

    let mensaje = `☕ *¡Hola Café de altura, sabor de origen! Quiero realizar un pedido:*\n\n`;
    this.carrito.forEach((item, i) => {
      mensaje += `*${i + 1}. ${item.producto.nombre}* x${item.cantidad}\n`;
      mensaje += `   • Tamaño: ${item.tamano}\n`;
      if (item.leche && item.leche !== 'Entera') mensaje += `   • Leche: ${item.leche}\n`;
      if (item.notas) mensaje += `   • Nota: ${item.notas}\n`;
      mensaje += `   • Subtotal: Bs. ${item.subtotal}\n\n`;
    });

    mensaje += `*Modalidad:* ${this.tipoEntrega.toUpperCase()}\n`;
    if (this.descuentoAplicado > 0) {
      mensaje += `*Descuento aplicado:* -Bs. ${this.descuentoAplicado}\n`;
    }
    mensaje += `*TOTAL A PAGAR: Bs. ${this.totalCarrito}*\n\n`;
    mensaje += `¡Muchas gracias!`;

    const url = `https://wa.me/59170000000?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // --- MODAL DE DETALLE DEL PRODUCTO ---
  abrirDetalle(producto: Producto): void {
    this.productoDetalle = producto;
    this.detalleTamano = 'Mediano (12 oz)';
    this.detalleLeche = 'Entera';
    this.detalleCantidad = 1;
    this.detalleNotas = '';
    this.modalDetalleAbierto = true;
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto = false;
    this.productoDetalle = null;
  }

  incrementarCantidadDetalle(): void {
    this.detalleCantidad++;
  }

  decrementarCantidadDetalle(): void {
    if (this.detalleCantidad > 1) {
      this.detalleCantidad--;
    }
  }

  get precioDetalleTotal(): number {
    if (!this.productoDetalle) return 0;
    let extraTamano = 0;
    if (this.detalleTamano.includes('Grande')) extraTamano = 4;
    if (this.detalleTamano.includes('Chico')) extraTamano = -2;

    let extraLeche = 0;
    if (this.detalleLeche.includes('+3')) extraLeche = 3;

    const unitario = Math.max(1, this.productoDetalle.precio + extraTamano + extraLeche);
    return unitario * this.detalleCantidad;
  }

  agregarDesdeDetalle(): void {
    if (!this.productoDetalle) return;
    this.agregarAlCarrito(
      this.productoDetalle,
      this.detalleCantidad,
      this.detalleTamano,
      this.detalleLeche,
      this.detalleNotas
    );
    this.pedidoAgregado = `¡${this.productoDetalle.nombre} añadido a tu pedido!`;
    this.cerrarDetalle();

    if (this.pedidoTimeout) clearTimeout(this.pedidoTimeout);
    this.pedidoTimeout = setTimeout(() => {
      this.pedidoAgregado = '';
      this.changeDetector.detectChanges();
    }, 4500);
  }

  obtenerImagenProducto(prod: Producto | number | string): string {
    let id = 1;
    let nombre = '';

    if (typeof prod === 'number') {
      id = prod;
    } else if (typeof prod === 'string') {
      nombre = prod.toLowerCase();
    } else if (prod && typeof prod === 'object') {
      id = prod.id || 1;
      nombre = (prod.nombre || '').toLowerCase();
    }

    if (nombre.includes('moca') || nombre.includes('mocaccino')) {
      return '/products/mocaccino.jpg';
    }
    if (nombre.includes('americano')) {
      return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('latte')) {
      return 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('flat white')) {
      return 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('cold brew') || nombre.includes('iced')) {
      return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('frappé') || nombre.includes('frappe')) {
      return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('croissant')) {
      return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('brownie')) {
      return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80';
    }
    if (nombre.includes('cheesecake') || nombre.includes('tarta')) {
      return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80';
    }

    const idx = (id - 1) % this.productImages.length;
    return this.productImages[Math.max(0, idx)];
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80') {
      img.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80';
    }
  }

  // --- RECOMENDADOR / QUIZ INTERACTIVO ---
  seleccionarQuizMood(mood: string): void {
    this.quizMood = mood;
    this.calcularRecomendacion();
  }

  seleccionarQuizPreferencia(pref: string): void {
    this.quizPreferencia = pref;
    this.calcularRecomendacion();
  }

  calcularRecomendacion(): void {
    if (!this.quizMood || !this.quizPreferencia) return;

    if (this.quizPreferencia === 'Frio' || this.quizMood === 'Refrescante') {
      this.quizResultado = this.productos.find(p => p.id === 5) || this.defaultCatalog[4];
    } else if (this.quizPreferencia === 'Intenso' || this.quizMood === 'Energia') {
      this.quizResultado = this.productos.find(p => p.id === 1 || p.id === 4) || this.defaultCatalog[0];
    } else if (this.quizPreferencia === 'Dulce' || this.quizMood === 'Antojo') {
      this.quizResultado = this.productos.find(p => p.id === 2 || p.id === 3) || this.defaultCatalog[1];
    } else {
      this.quizResultado = this.productos.find(p => p.id === 3) || this.defaultCatalog[2];
    }
  }

  reiniciarQuiz(): void {
    this.quizMood = '';
    this.quizPreferencia = '';
    this.quizResultado = null;
  }

  // --- MÉTODOS DE EXTRACCIÓN Y TESTIMONIOS ---
  seleccionarMetodo(index: number): void {
    this.metodoActivoIndex = index;
  }

  siguienteTestimonio(): void {
    this.testimonioActivo = (this.testimonioActivo + 1) % this.testimonios.length;
  }

  anteriorTestimonio(): void {
    this.testimonioActivo = (this.testimonioActivo - 1 + this.testimonios.length) % this.testimonios.length;
  }

  // --- FORMULARIO DE CONTACTO ---
  enviarContacto(form?: NgForm): void {
    if (this.enviandoContacto) return;

    this.enviandoContacto = true;
    this.errorContacto = '';
    this.mensajeContactoExito = '';

    const payload: Contacto = {
      nombre: this.contacto.nombre,
      email: this.contacto.email,
      mensaje: `[Asunto: ${this.motivoContacto}] ${this.contacto.mensaje}`
    };

    this.cafeteriaService.enviarContacto(payload).subscribe({
      next: () => {
        this.contacto = { nombre: '', email: '', mensaje: '' };
        form?.resetForm(this.contacto);
        this.mensajeContactoExito = '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto';
        this.enviandoContacto = false;
        if (this.contactoTimeout) clearTimeout(this.contactoTimeout);
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

  // --- CHATBOT ---
  enviarMensajeRapido(texto: string): void {
    this.mensajeUsuario = texto;
    this.enviarMensaje();
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
        console.warn('Fallback chatbot:', error);
        if (this.respuestaEnCurso.trim()) {
          this.mensajesChat.push({ role: 'assistant', content: this.respuestaEnCurso.trim() });
        }
        const respuesta = error instanceof Error && !(error instanceof TypeError) && error.message
          ? error.message
          : '¡Hola! Te recomiendo probar nuestro Caramel Velvet Latte o el Flat White, son deliciosos y preparados al momento.';
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
