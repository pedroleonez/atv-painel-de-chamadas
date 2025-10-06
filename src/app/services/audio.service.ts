import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Serviço de Áudio - Gerencia reprodução de sons da chamada
 *
 * Responsável por:
 * - Gerenciar permissões de áudio do navegador
 * - Reproduzir som de notificação de chamadas
 * - Controlar estado ativado/desativado do áudio
 * - Fallback para problemas de reprodução
 *
 * Funcionamento:
 * - Áudio desabilitado por padrão (política dos navegadores)
 * - Requer interação do usuário para ativar (clique no botão)
 * - Pré-carrega arquivo de áudio para performance
 */
@Injectable({
  providedIn: 'root'
})
export class AudioService {
  // Observable para comunicar estado do áudio aos componentes
  private readonly audioEnabledSubject = new BehaviorSubject<boolean>(false);

  // Instância do elemento de áudio pré-carregado
  private callToneAudio: HTMLAudioElement | null = null;

  // Estado interno do áudio
  private isAudioEnabled = false;

  // Stream público para subscrição
  audioEnabled$ = this.audioEnabledSubject.asObservable();

  constructor() {
    this.initializeAudio();
  }

  /**
   * Inicializa e pré-carrega o arquivo de áudio
   * Otimiza performance para reprodução instantânea
   */
  private initializeAudio(): void {
    try {
      // Criar elemento de áudio e pré-carregar
      this.callToneAudio = new Audio();
      this.callToneAudio.src = '/assets/tone.mp3';  // Som de notificação
      this.callToneAudio.volume = 0.7;              // Volume otimizado
      this.callToneAudio.preload = 'auto';          // Pré-carregamento automático
      this.callToneAudio.load();                    // Forçar carregamento
    } catch (error) {
      // Falha na inicialização - áudio não disponível
    }
  }

  /**
   * Reproduz som de notificação de chamada
   * Apenas funciona se áudio estiver habilitado pelo usuário
   */
  playCallTone(): void {
    // Verificar se áudio está ativado antes de reproduzir
    if (!this.isAudioEnabled) {
      return;
    }

    try {
      if (this.callToneAudio) {
        this.callToneAudio.currentTime = 0;

        const playPromise = this.callToneAudio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Call tone played successfully
            })
            .catch((error) => {
              // Fallback: try to create new audio instance
              this.playCallToneFallback();
            });
        }
      } else {
        this.playCallToneFallback();
      }
    } catch (error) {
      this.playCallToneFallback();
    }
  }

  private playCallToneFallback(): void {
    try {
      const audio = new Audio('/assets/tone.mp3');
      audio.volume = 0.7;
      audio.play().catch((error) => {
        // Fallback audio also failed
      });
    } catch (error) {
      // Fallback audio creation failed
    }
  }

  // Método público para permitir interação inicial do usuário (política dos navegadores)
  enableAudio(): void {
    if (this.callToneAudio && !this.isAudioEnabled) {
      // Play silently to enable audio context
      const originalVolume = this.callToneAudio.volume;
      this.callToneAudio.volume = 0;
      this.callToneAudio.play()
        .then(() => {
          this.callToneAudio!.volume = originalVolume;
          this.callToneAudio!.pause();
          this.callToneAudio!.currentTime = 0;
          this.isAudioEnabled = true;
          this.audioEnabledSubject.next(true);
        })
        .catch((error) => {
          // Could not enable audio context
        });
    }
  }

  // Método para desativar áudio
  disableAudio(): void {
    this.isAudioEnabled = false;
    this.audioEnabledSubject.next(false);
  }

  // Método para verificar se áudio está ativado
  isAudioActive(): boolean {
    return this.isAudioEnabled;
  }

  // Método para alternar estado do áudio
  toggleAudio(): void {
    if (this.isAudioEnabled) {
      this.disableAudio();
    } else {
      this.enableAudio();
    }
  }
}
