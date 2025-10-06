import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Interface que define o estado atual do vídeo
 * Usado para sincronizar o player principal com o mini player
 */
export interface VideoState {
  currentTime: number;   // Tempo atual do vídeo em segundos
  playerState: number;   // Estado do player YouTube (0=ended, 1=playing, 2=paused, etc.)
  isPlaying: boolean;    // Se o vídeo está reproduzindo
  lastUpdate: number;    // Timestamp da última atualização
}

/**
 * Interface para configuração de vídeo/playlist
 * Permite três tipos de configuração:
 * 1. Vídeo único (videoId)
 * 2. Playlist do YouTube (playlistId)
 * 3. Lista customizada de vídeos (videoIds)
 */
export interface VideoConfig {
  videoId?: string;      // ID de um vídeo único do YouTube
  playlistId?: string;   // ID de uma playlist do YouTube
  videoIds?: string[];   // Array de IDs para playlist customizada
}

/**
 * Serviço centralizado para gerenciamento de estado de vídeo
 *
 * Responsável por:
 * - Manter configuração centralizada de vídeo/playlist
 * - Sincronizar estado entre player principal e mini player
 * - Evitar conflitos entre múltiplos players
 * - Fornecer estado consistente para toda a aplicação
 *
 * Arquitetura:
 * - Player principal controla o estado (isMainPlayer=true)
 * - Mini player apenas recebe atualizações (isMainPlayer=false)
 * - Sincronização via BehaviorSubject para tempo real
 */
@Injectable({
  providedIn: 'root'
})
export class VideoStateService {
  // Estado inicial padrão para todos os players
  private readonly initialState: VideoState = {
    currentTime: 0,     // Começa do início
    playerState: -1,    // Estado "unstarted" do YouTube
    isPlaying: false,   // Não reproduzindo inicialmente
    lastUpdate: Date.now()
  };

  // 🎯 CONFIGURAÇÃO DO VÍDEO
  // Modifique aqui para mudar o vídeo/playlist em toda a aplicação
  private readonly videoConfig: VideoConfig = {
    videoId: 'WdxYgjjPSjg', // 👈 ID do vídeo único
    // playlistId: 'PL590L5WQmH8e3rwpbQWcDegcbBbudSXSP', // 👈 ID da playlist (descomente para usar)
    // videoIds: ['dQw4w9WgXcQ', 'oHg5SJYRHA0', 'fJ9rUzIMcZQ'], // 👈 Lista de vídeos (descomente para usar)
  };

  // Streams reativos para comunicação com componentes
  private readonly videoStateSubject = new BehaviorSubject<VideoState>(this.initialState);
  public readonly videoState$ = this.videoStateSubject.asObservable();

  // Controla qual player tem autoridade para atualizar o estado
  // Evita conflitos quando múltiplos players estão ativos
  private activePlayerId: string | null = null;

  /**
   * Retorna a configuração de vídeo centralizada
   * Usado pelos componentes video-player para obter configuração
   */
  getVideoConfig(): VideoConfig {
    return { ...this.videoConfig };
  }

  /**
   * Obtém o estado atual do vídeo
   * Usado para sincronizar novos players com o estado existente
   */
  getCurrentState(): VideoState {
    return this.videoStateSubject.value;
  }

  /**
   * Atualiza o estado do vídeo
   * Apenas o player ativo pode atualizar para evitar conflitos
   *
   * @param state - Estado parcial a ser atualizado
   * @param playerId - ID do player que está solicitando a atualização
   */

  updateState(state: Partial<VideoState>, playerId: string): void {
    // Só permitir atualização do player ativo
    if (this.activePlayerId && this.activePlayerId !== playerId) {
      return;
    }

    const currentState = this.videoStateSubject.value;
    const newState: VideoState = {
      ...currentState,
      ...state,
      lastUpdate: Date.now()
    };

    this.videoStateSubject.next(newState);
  }

  setActivePlayer(playerId: string): void {
    this.activePlayerId = playerId;
  }

  saveCurrentTime(time: number, playerId: string): void {
    this.updateState({ currentTime: time }, playerId);
  }

  savePlayerState(playerState: number, isPlaying: boolean, playerId: string): void {
    this.updateState({ playerState, isPlaying }, playerId);
  }

  forceUpdateState(state: Partial<VideoState>): void {
    const currentState = this.videoStateSubject.value;
    const newState: VideoState = {
      ...currentState,
      ...state,
      lastUpdate: Date.now()
    };
    this.videoStateSubject.next(newState);
  }
}
