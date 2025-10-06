import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { VideoStateService, VideoConfig } from '../../services/video-state.service';
import { Subscription } from 'rxjs';

/**
 * Componente de player de vídeo YouTube
 *
 * Características:
 * - Suporte a vídeo único, playlist do YouTube ou lista customizada
 * - Sincronização entre player principal e mini player
 * - Configuração centralizada via VideoStateService
 * - Controles visíveis apenas no hover
 * - Loop infinito automático
 * - Responsivo com aspect ratio 16:9
 *
 * Uso:
 * - Player principal: isMainPlayer=true (controla estado)
 * - Mini player: isMainPlayer=false (recebe estado)
 */
@Component({
  selector: 'app-video-player',
  imports: [YouTubePlayerModule],
  templateUrl: './video-player.html',
  styleUrl: './video-player.css'
})
export class VideoPlayer implements OnInit, OnDestroy {
  // Define se é o player principal (controla) ou mini (segue)
  @Input() isMainPlayer: boolean = true;

  // Eventos emitidos para componentes pai
  @Output() playerReady = new EventEmitter<any>();
  @Output() stateChange = new EventEmitter<any>();

  // Configuração do vídeo obtida do serviço centralizado
  videoConfig!: VideoConfig;
  videoId: string = '';     // ID do vídeo atual
  playlistId?: string;      // ID da playlist (se estiver usando)
  videoIds?: string[];      // Lista de IDs (se estiver usando lista customizada)

  // Propriedades de controle interno do player
  private player: any = null;                    // Instância do YouTube Player
  private currentTime = 0;                       // Tempo atual para sincronização
  private isPlayerReady = false;                 // Se o player foi inicializado
  private playerState: number = -1;              // Estado atual do player
  private saveStateInterval: number | null = null; // Intervalo para salvar estado
  private readonly playerId: string;             // ID único deste player
  private readonly videoStateSubscription: Subscription | null = null; // Subscrição para estado

  // Configuração do YouTube Player
  // Ajustada dinamicamente baseada no tipo de conteúdo (vídeo/playlist)
  playerConfig: any = {
    autoplay: 1,           // Reproduz automaticamente
    mute: 1,              // Iniciar mudo
    loop: 1,              // Loop ativado
    // Parâmetros dinâmicos para playlist (definidos em setupPlayerConfig)
    listType: undefined,   // Tipo de lista (playlist/search/etc)
    list: undefined,       // ID da lista
    playlist: undefined,   // Lista customizada de vídeos
    index: 0              // Índice inicial da playlist
  };

  constructor(private readonly videoStateService: VideoStateService) {
    // Gera ID único para identificar este player nas sincronizações
    // Formato: player_<hash>_<timestamp>
    this.playerId = `player_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  }

  ngOnInit(): void {
    // Obter configuração centralizada do vídeo
    this.videoConfig = this.videoStateService.getVideoConfig();
    this.videoId = this.videoConfig.videoId || 'dQw4w9WgXcQ';
    this.playlistId = this.videoConfig.playlistId;
    this.videoIds = this.videoConfig.videoIds;

    // Configurar playerConfig baseado no tipo de conteúdo
    this.setupPlayerConfig();

    // Aplicar estado do serviço se disponível
    const currentState = this.videoStateService.getCurrentState();
    this.currentTime = currentState.currentTime;
    this.playerState = currentState.playerState;

    // Definir este player como ativo se for o principal
    if (this.isMainPlayer) {
      this.videoStateService.setActivePlayer(this.playerId);
    }
  }

  private setupPlayerConfig(): void {
    if (this.playlistId) {
      // Configurar para playlist do YouTube
      this.playerConfig.listType = 'playlist';
      this.playerConfig.list = this.playlistId;
      // Remover propriedades de vídeo único
      delete this.playerConfig.playlist;
    } else if (this.videoIds && this.videoIds.length > 1) {
      // Configurar para lista de vídeos
      this.playerConfig.playlist = this.videoIds.slice(1); // Primeiro vídeo via videoId, resto via playlist
      // Remover propriedades de playlist do YouTube
      delete this.playerConfig.listType;
      delete this.playerConfig.list;
    } else {
      // Configuração padrão para vídeo único
      delete this.playerConfig.listType;
      delete this.playerConfig.list;
      delete this.playerConfig.playlist;
    }
  }

  getVideoId(): string {
    // Para playlists, usar o primeiro vídeo se videoIds estiver definido
    if (this.videoIds && this.videoIds.length > 0) {
      return this.videoIds[0];
    }
    // Para playlist do YouTube, usar um vídeo padrão (será sobrescrito pela playlist)
    if (this.playlistId) {
      return ''; // YouTube vai carregar o primeiro vídeo da playlist
    }
    // Retornar videoId padrão
    return this.videoId;
  }

  ngOnDestroy(): void {
    // Limpar intervalos
    if (this.saveStateInterval) {
      clearInterval(this.saveStateInterval);
    }

    if (this.videoStateSubscription) {
      this.videoStateSubscription.unsubscribe();
    }

    // Salvar estado atual no serviço
    if (this.player && this.isPlayerReady) {
      this.videoStateService.forceUpdateState({
        currentTime: this.player.getCurrentTime(),
        playerState: this.player.getPlayerState(),
        isPlaying: this.player.getPlayerState() === 1,
        lastUpdate: Date.now()
      });
    }
  }

  onPlayerReady(event: any): void {
    this.player = event.target;
    this.isPlayerReady = true;

    const currentState = this.videoStateService.getCurrentState();

    // Configurar salvamento periódico do estado apenas para o player principal
    if (this.isMainPlayer) {
      // Definir como player ativo
      this.videoStateService.setActivePlayer(this.playerId);

      if (this.saveStateInterval) {
        clearInterval(this.saveStateInterval);
      }

      this.saveStateInterval = window.setInterval(() => {
        if (this.player && this.isPlayerReady) {
          const newTime = this.player.getCurrentTime();
          const newState = this.player.getPlayerState();

          // Manter sempre reproduzindo
          if (newState !== 1 && newState !== 0) { // Se não está tocando nem terminou
            this.player.playVideo();
          }

          // Salvar estado no serviço
          this.videoStateService.updateState({
            currentTime: newTime,
            playerState: newState,
            isPlaying: newState === 1
          }, this.playerId);

          // Sincronizar mini players
          this.syncMiniPlayers();
        }
      }, 250); // Ainda mais frequente para capturar mudanças rapidamente
    }

    // Restaurar posição e estado do serviço
    if (currentState.currentTime > 0) {
      setTimeout(() => {
        this.player.seekTo(currentState.currentTime, true);

        // SEMPRE garantir que está reproduzindo
        setTimeout(() => {
          this.player.playVideo();
          this.videoStateService.updateState({ isPlaying: true }, this.playerId);
        }, 200);

        // Mini player deve ficar mutado inicialmente
        if (!this.isMainPlayer) {
          this.player.mute();
        }
      }, 500);
    } else {
      // Se não há estado salvo, garantir que inicia tocando
      setTimeout(() => {
        this.player.playVideo();
        this.videoStateService.updateState({
          isPlaying: true,
          playerState: 1,
          currentTime: 0
        }, this.playerId);
      }, 1000);
    }

    this.playerReady.emit(event);
  }

  onStateChange(event: any): void {
    // Apenas o player principal controla o estado compartilhado
    if (this.isMainPlayer && this.player && this.isPlayerReady) {
      const newTime = this.player.getCurrentTime();

      // Se o vídeo terminou (state 0 = ended), reiniciar para loop infinito
      if (event.data === 0) {
        setTimeout(() => {
          this.player.seekTo(0, true);
          this.player.playVideo();
          this.videoStateService.updateState({
            currentTime: 0,
            isPlaying: true,
            playerState: 1
          }, this.playerId);
        }, 100);
        return;
      }

      this.videoStateService.updateState({
        currentTime: newTime,
        playerState: event.data,
        isPlaying: event.data === 1
      }, this.playerId);

      // Sincronizar imediatamente com mini players
      this.syncMiniPlayers();
    }

    this.stateChange.emit(event);
  }

  // Método para sincronizar mini players
  private syncMiniPlayers(): void {
    // Este método será usado para disparar eventos de sincronização
    // A sincronização real acontece via estado compartilhado no serviço
  }

  // Método para sincronizar com outro player
  syncWith(time: number, state: number): void {
    if (this.player && this.isPlayerReady) {
      this.player.seekTo(time, true);
      if (state === 1 && this.isMainPlayer) {
        this.player.playVideo();
      } else if (state === 2) {
        this.player.pauseVideo();
      }
    }
  }
}
