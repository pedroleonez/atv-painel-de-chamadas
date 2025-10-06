import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AudioService } from './audio.service';
import { CallData, AppState } from '../models/call.model';

/**
 * Serviço principal para gerenciamento de chamadas
 *
 * Responsável por:
 * - Gerar chamadas automáticas ou manuais
 * - Gerenciar estados da aplicação (DEFAULT/CALLING)
 * - Manter histórico de chamadas
 * - Gerar senhas padronizadas por especialidade
 * - Integrar com o serviço de áudio para notificações sonoras
 */
@Injectable({
  providedIn: 'root'
})
export class CallService {
  // Observables para comunicação reativa com os componentes
  private readonly currentStateSubject = new BehaviorSubject<AppState>(AppState.DEFAULT);
  private readonly currentCallSubject = new BehaviorSubject<CallData | null>(null);
  private readonly callHistorySubject = new BehaviorSubject<CallData[]>([]);

  // Streams públicos para subscrição dos componentes
  currentState$ = this.currentStateSubject.asObservable();
  currentCall$ = this.currentCallSubject.asObservable();
  callHistory$ = this.callHistorySubject.asObservable();

  // Mapeamento de especialidades para siglas (formato das senhas)
  // Cada especialidade tem uma sigla única usada na geração das senhas
  private readonly specialtyAcronyms: { [key: string]: string } = {
    'Cardiologista': 'CARD',
    'Pediatra': 'PED',
    'Neurologista': 'NEURO',
    'Dermatologista': 'DERMA',
    'Ortopedista': 'ORTO'
  };

  // Contadores sequenciais por especialidade para geração de senhas únicas
  // Ex: CARD-001N, CARD-002N, etc.
  private specialtyCounters: { [key: string]: number } = {};

  // Dados mockados para simulação (em produção viria de uma API)
  private readonly mockDoctors = [
    { name: 'José Ferreira', specialty: 'Cardiologista' },
    { name: 'Ana Souza', specialty: 'Pediatra' },
    { name: 'Carlos Silva', specialty: 'Neurologista' },
    { name: 'Mariana Costa', specialty: 'Dermatologista' },
    { name: 'José Pereira', specialty: 'Ortopedista' }
  ];

  // Histórico local de chamadas (limitado a 4 últimas)
  private callHistory: CallData[] = [];

  constructor(private readonly audioService: AudioService) {
    this.initializeSpecialtyCounters();
  }

  /**
   * Inicializa os contadores de senha para todas as especialidades
   * Garante que cada especialidade comece com contador zerado
   */
  private initializeSpecialtyCounters(): void {
    // Inicializa contadores para todas as especialidades
    Object.keys(this.specialtyAcronyms).forEach(specialty => {
      this.specialtyCounters[specialty] = 0;
    });
  }

  /**
   * Gera uma nova chamada com dados aleatórios
   *
   * Processo:
   * 1. Seleciona um médico aleatório
   * 2. Incrementa contador da especialidade
   * 3. Gera senha no formato SIGLA-XXXN
   * 4. Atribui guichê aleatório
   *
   * @returns CallData - Objeto com dados completos da chamada
   */
  private generateCall(): CallData {
    const doctor = this.mockDoctors[Math.floor(Math.random() * this.mockDoctors.length)];

    // Incrementa o contador da especialidade
    this.specialtyCounters[doctor.specialty]++;

    // Gera a senha no formato SIGLA-001N
    const acronym = this.specialtyAcronyms[doctor.specialty] || 'GEN';
    const counter = this.specialtyCounters[doctor.specialty].toString().padStart(3, '0');
    const password = `${acronym}-${counter}N`;

    return {
      id: Math.random().toString(36).substring(2, 15),
      password: password,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      guichet: Math.floor(Math.random() * 10) + 1,
      timestamp: new Date()
    };
  }

  /**
   * Método público para gerar uma nova chamada
   *
   * Fluxo completo:
   * 1. Gera dados da chamada
   * 2. Reproduz som de notificação
   * 3. Atualiza histórico (máximo 4 chamadas)
   * 4. Muda estado para CALLING
   * 5. Programa retorno ao estado DEFAULT após 15s
   */
  generateNewCall(): void {
    const newCall = this.generateCall();

    // Reproduzir som de chamada
    this.audioService.playCallTone();

    // Adicionar ao histórico
    this.callHistory.unshift(newCall);
    if (this.callHistory.length > 4) {
      this.callHistory = this.callHistory.slice(0, 4);
    }

    // Atualizar observables
    this.currentCallSubject.next(newCall);
    this.callHistorySubject.next([...this.callHistory]);
    this.currentStateSubject.next(AppState.CALLING);

    // Voltar ao estado padrão após 15 segundos
    setTimeout(() => {
      this.currentStateSubject.next(AppState.DEFAULT);
      this.currentCallSubject.next(null);
    }, 15000);
  }

  getCurrentCall(): CallData | null {
    return this.currentCallSubject.value;
  }

  getLastCall(): CallData | null {
    return this.callHistory.length > 0 ? this.callHistory[0] : null;
  }

  getCallHistory(): CallData[] {
    return this.callHistory.slice(1); // Retorna histórico sem a última chamada
  }

  getCurrentState(): AppState {
    return this.currentStateSubject.value;
  }

  /**
   * Inicia o sistema de chamadas automáticas para demonstração
   *
   * Gera uma nova chamada a cada 30 segundos, mas apenas se:
   * - O estado atual for DEFAULT (não está em chamada)
   *
   * Em produção, este método seria substituído por:
   * - Integração com sistema de fila
   * - WebSocket para chamadas em tempo real
   * - API para receber comandos externos
   */
  startAutoCall(): void {
    setInterval(() => {
      if (this.getCurrentState() === AppState.DEFAULT) {
        this.generateNewCall();
      }
    }, 30000); // Nova chamada a cada 30 segundos
  }
}
