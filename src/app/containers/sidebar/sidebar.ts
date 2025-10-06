import { Component, OnDestroy, OnInit } from '@angular/core';
import { CallService } from '../../services/call.service';
import { AppState, CallData } from '../../models/call.model';
import { Subscription } from 'rxjs';
import { AudioService } from '../../services/audio.service';
import { VideoPlayer } from '../../components/video-player/video-player';
import { VideoStateService } from '../../services/video-state.service';
import { CommonModule } from '@angular/common';

/**
 * Container Sidebar - Barra lateral da aplicação
 *
 * Responsável por:
 * - Exibir controle de áudio (liga/desliga)
 * - Mostrar senha atual no estado DEFAULT
 * - Exibir histórico de chamadas
 * - Mostrar mini vídeo durante chamadas (estado CALLING)
 * - Exibir histórico geral durante chamadas
 *
 * Layout responsivo:
 * - Desktop: Sidebar lateral fixa
 * - Mobile: Abaixo do highlight, altura automática
 */
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, VideoPlayer],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit, OnDestroy {
  // Estado atual da aplicação
  isCallingState = false;

  // Última chamada realizada (senha atual)
  lastCall: CallData | null = null;

  // Histórico das últimas chamadas (exibido no estado DEFAULT)
  callHistory: CallData[] = [];

  // Histórico completo (exibido no estado CALLING)
  allHistory: CallData[] = [];

  // Estado do áudio (ativado/desativado)
  audioEnabled = false;

  // Controla visibilidade do mini vídeo
  showMiniVideo = false;

  // Gerenciamento de subscrições reativas
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly callService: CallService,
    private readonly audioService: AudioService,
    private readonly videoStateService: VideoStateService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura subscrições reativas para estados e dados
   *
   * Gerencia:
   * - Transições de estado (DEFAULT ⇄ CALLING)
   * - Visibilidade do mini vídeo
   * - Atualizações de histórico
   * - Estado do áudio
   */
  private setupSubscriptions(): void {
    // Subscrição para mudanças de estado
    const stateSubscription = this.callService.currentState$.subscribe(state => {
      const wasCallingState = this.isCallingState;
      this.isCallingState = state === AppState.CALLING;

      // Transição: DEFAULT → CALLING
      // Mostra mini vídeo na sidebar durante chamada
      if (state === AppState.CALLING && !wasCallingState) {
        this.showMiniVideo = true;
      }

      // Transição: CALLING → DEFAULT
      // Esconde mini vídeo quando volta ao estado padrão
      if (state === AppState.DEFAULT && wasCallingState) {
        this.showMiniVideo = false;
      }
    });

    const historySubscription = this.callService.callHistory$.subscribe(history => {
      this.allHistory = [...history];
      this.lastCall = history.length > 0 ? history[0] : null;
      this.callHistory = history.slice(1, 5);
    });

    const audioSubscription = this.audioService.audioEnabled$.subscribe(enabled => {
      this.audioEnabled = enabled;
    });

    this.subscriptions.push(
      stateSubscription,
      historySubscription,
      audioSubscription
    );
  }

  private loadInitialData(): void {
    this.lastCall = this.callService.getLastCall();
    this.callHistory = this.callService.getCallHistory();
    this.allHistory = [this.lastCall, ...this.callHistory].filter(call => call !== null);
  }

  toggleAudio(): void {
    this.audioService.toggleAudio();
  }

  // --- Funções de formatação usadas no HTML ---
  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDoctorName(fullName: string): string {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].toUpperCase();
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return `${firstName.charAt(0)}. ${lastName.toUpperCase()}`;
  }

  formatSpecialty(specialty: string): string {
    const specialtyMap: { [key: string]: string } = {
      'Cardiologista': 'CARD',
      'Pediatra': 'PED',
      'Neurologista': 'NEURO',
      'Dermatologista': 'DERMA',
      'Ortopedista': 'ORTO'
    };
    return specialtyMap[specialty] || specialty.substring(0, 5).toUpperCase();
  }

  getFormattedDoctorInfo(call: CallData): string {
    return `${this.formatDoctorName(call.doctorName)}, ${this.formatSpecialty(call.specialty)}`;
  }
}
