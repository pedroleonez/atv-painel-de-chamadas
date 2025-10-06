import { Component, OnDestroy, OnInit } from '@angular/core';
import { CallService } from '../../services/call.service';
import { AppState, CallData } from '../../models/call.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CallDisplay } from '../../components/call-display/call-display';
import { VideoPlayer } from '../../components/video-player/video-player';
import { VideoStateService } from '../../services/video-state.service';

/**
 * Container Highlight - Área principal da aplicação
 *
 * Responsável por:
 * - Alternar entre vídeo (estado DEFAULT) e chamada (estado CALLING)
 * - Exibir informações da chamada atual com overlay
 * - Controlar visibilidade do player principal
 * - Manter altura consistente entre estados
 *
 * Estados:
 * - DEFAULT: Mostra vídeo em tela cheia
 * - CALLING: Mostra overlay com informações da chamada
 */
@Component({
  selector: 'app-highlight',
  imports: [CommonModule, CallDisplay, VideoPlayer],
  templateUrl: './highlight.html',
  styleUrls: ['./highlight.css']
})
export class Highlight implements OnInit, OnDestroy {
  // Controla se está no estado de chamada
  isCallingState = false;

  // Dados da chamada atual (null quando não há chamada)
  currentCall: CallData | null = null;

  // Controla visibilidade do vídeo
  showVideo = false;

  // Array para gerenciar subscrições reativas
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly callService: CallService,
    private readonly videoStateService: VideoStateService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura subscrições reativas para estados da aplicação
   *
   * Gerencia transições entre:
   * - Estado DEFAULT → CALLING: Esconde vídeo, exibe chamada
   * - Estado CALLING → DEFAULT: Esconde chamada, exibe vídeo
   */
  private setupSubscriptions(): void {
    // Subscrição para mudanças de estado da aplicação
    const stateSubscription = this.callService.currentState$.subscribe(state => {
      const wasCallingState = this.isCallingState;
      this.isCallingState = state === AppState.CALLING;

      // Transição: CALLING → DEFAULT
      // Mostra o vídeo principal quando volta ao estado padrão
      if (state === AppState.DEFAULT && wasCallingState) {
        this.showVideo = true;
      }

      // Transição: DEFAULT → CALLING
      // Esconde o vídeo quando entra em chamada
      if (state === AppState.CALLING && !wasCallingState) {
        this.showVideo = false;
      }

      // Garantir que vídeo seja exibido no estado DEFAULT
      if (state === AppState.DEFAULT) {
        this.showVideo = true;
      }
    });

    const callSubscription = this.callService.currentCall$.subscribe(call => {
      this.currentCall = call;
    });

    this.subscriptions.push(stateSubscription, callSubscription);
  }
}
