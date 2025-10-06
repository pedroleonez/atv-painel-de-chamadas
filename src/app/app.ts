import { Component, OnInit, signal } from '@angular/core';
import { Header } from './components/header/header';
import { Highlight } from './containers/highlight/highlight';
import { Sidebar } from './containers/sidebar/sidebar';
import { CallService } from './services/call.service';

/**
 * Componente raiz da aplicação - Painel de Chamadas
 *
 * Este é o componente principal que orquestra toda a aplicação.
 * Responsável por:
 * - Inicializar os serviços principais
 * - Coordenar o layout geral (Header, Highlight, Sidebar)
 * - Controlar o ciclo de vida da aplicação
 */
@Component({
  selector: 'app-root',
  imports: [Header, Highlight, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Título da aplicação (usado para identificação)
  protected readonly title = signal('atv-painel-de-chamadas');

  constructor(private readonly callService: CallService) {}

  ngOnInit(): void {
    // Configuração inicial da aplicação
    // Inicia o sistema de chamadas automáticas para demonstração
    this.callService.startAutoCall();
  }
}
