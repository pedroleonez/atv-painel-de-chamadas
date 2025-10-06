import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallData } from '../../models/call.model';

/**
 * Componente de Exibição de Chamada
 *
 * Responsável por:
 * - Exibir informações detalhadas da chamada atual
 * - Mostrar senha, médico, especialidade e guichê
 * - Formatação visual destacada para boa visibilidade
 * - Design responsivo para diferentes tamanhos de tela
 *
 * Usado como overlay no highlight durante o estado CALLING
 */
@Component({
  selector: 'app-call-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-display.html',
  styleUrl: './call-display.css',
})
export class CallDisplay {
  // Dados da chamada a ser exibida (null = nenhuma chamada)
  @Input() currentCall: CallData | null = null;
}
