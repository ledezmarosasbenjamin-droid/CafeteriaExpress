import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app';
import { CafeteriaService } from './cafeteria.service';

describe('App', () => {
  const cafeteriaServiceMock = {
    getProductos: () => of([{ id: 1, nombre: 'Café americano', precio: 12 }]),
    getInicio: () => of({ titulo: 'CoffeeHouse' }),
    enviarContacto: () => of({ success: true, message: 'Mensaje guardado' }),
    enviarMensaje: () => of({ respuesta: 'Hola' }),
    enviarMensajeEnStreaming: () => of('Hola')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: CafeteriaService, useValue: cafeteriaServiceMock }
      ]
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the cafe data returned by the service', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('CoffeeHouse');
    expect(compiled.querySelector('.producto-card h3')?.textContent).toContain('Café americano');
  });

  it('should open the chat and send a message to the chatbot endpoint', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.chat-btn')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.chat-window')).toBeTruthy();

    fixture.componentInstance.mensajeUsuario = '¿Qué café recomiendas?';
    fixture.componentInstance.enviarMensaje();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.chat-message').length).toBe(3);
    expect(compiled.querySelector('.chat-message.assistant')?.textContent).toContain('Hola');
  });

  it('should show a confirmation when a product is added to the order', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.btn-card')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.order-toast')?.textContent)
      .toContain('Café americano añadido a tu pedido');
  });

  it('should submit the contact form and clear its fields on success', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const nombre = compiled.querySelector<HTMLInputElement>('#contact-name')!;
    const email = compiled.querySelector<HTMLInputElement>('#contact-email')!;
    const mensaje = compiled.querySelector<HTMLTextAreaElement>('#contact-message')!;
    nombre.value = 'Ana';
    nombre.dispatchEvent(new Event('input'));
    email.value = 'ana@example.com';
    email.dispatchEvent(new Event('input'));
    mensaje.value = 'Quiero conocer el menú.';
    mensaje.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    compiled.querySelector<HTMLFormElement>('.contact-form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.contacto).toEqual({
      nombre: '',
      email: '',
      mensaje: ''
    });
    expect(nombre.value).toBe('');
    expect(email.value).toBe('');
    expect(mensaje.value).toBe('');
    expect(fixture.componentInstance.mensajeContactoExito)
      .toBe('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto');
  });
});
