import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente Header - Cabeçalho da aplicação
 *
 * Responsável por:
 * - Exibir data e hora atual em tempo real
 * - Mostrar logo e título da aplicação
 * - Manter informações consistentes no topo
 * - Atualização automática a cada segundo
 *
 * Design:
 * - Layout fixo no topo da aplicação
 * - Responsivo para diferentes telas
 */
@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  // Data formatada para exibição
  currentDate: string = '';

  // Hora formatada para exibição
  currentTime: string = '';

  // Referência do intervalo para limpeza
  private timeInterval: any;

  constructor() {}

  ngOnInit(): void {
    // Inicializa data/hora imediatamente
    this.updateDateTime();

    // Configura atualização automática a cada segundo
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    // Limpa intervalo para evitar memory leaks
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateDateTime(): void {
    const now = new Date();

    // Formatar data: "Terça-feira, 26 de setembro"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    const dateString = now.toLocaleDateString('pt-BR', options);
    // Capitalizar apenas a primeira letra
    this.currentDate = dateString.charAt(0).toUpperCase() + dateString.slice(1).toLowerCase();

    // Formatar hora: "16:43"
    this.currentTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
