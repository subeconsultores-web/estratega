import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject } from 'rxjs';

// Estructura adaptada al Schema de la Fase 1 Generative UI
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string; // Mensaje textual base en markdown
    actionType?: 'MESSAGE' | 'CHART' | 'ACTION_PROMPT'; // Múltiples layouts
    chartConfig?: any; // Contenedor original Chart.js JSON
    actionSuggested?: {
        actionId: string;
        buttonLabel: string;
        payload: any;
    };
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private functions = inject(Functions);

    // Store the conversation history for this session
    private historySubject = new BehaviorSubject<ChatMessage[]>([]);
    public history$ = this.historySubject.asObservable();

    // Flag to indicate when the model is processing
    private processingSubject = new BehaviorSubject<boolean>(false);
    public processing$ = this.processingSubject.asObservable();

    constructor() {
        // Optional: Seed the conversation with an initial greeting
        this.addMessage('assistant', '¡Hola! Soy SUBE IA 4.0. Estoy aquí para ayudarte a analizar contratos, obtener gráficas financieras o crear elementos CRM de forma dinámica. ¿En qué te ayudo hoy?');
    }

    /**
     * Envía un prompt a Gemini a través de la Cloud Function 'askSubeIA'
     */
    async askQuestion(prompt: string, context?: any): Promise<void> {
        if (!prompt.trim()) return;

        // Add user message to local UI
        this.addMessage('user', prompt);
        this.processingSubject.next(true);

        try {
            // El callable retorna el JSON directo dentro de data.data ahora
            const callable = httpsCallable<{ prompt: string, context?: any }, { success: boolean, data: any }>(this.functions, 'askSubeIA');

            // Inject the current history into the context so the model has "memory" of the conversation
            // We limit to the last 6 messages to save tokens.
            const recentHistory = this.historySubject.value
                .slice(-6)
                .map(msg => `${msg.role === 'user' ? 'Usuario' : 'SUBE IA'}: ${msg.content}`)
                .join('\n');

            const enrichedContext = {
                ...context,
                conversation_history: recentHistory
            };

            const result = await callable({ prompt, context: enrichedContext });

            if (result.data && result.data.success && result.data.data) {
                // Leer del modelo estricto (AI Generative UI JSON)
                const payload = result.data.data;
                const textResponse = payload.message || 'Sin mensaje de respuesta';
                const type = payload.actionType || 'MESSAGE';
                const chartCfg = payload.chartData;
                const suggestion = payload.actionSuggested;

                this.addStructuredMessage('assistant', textResponse.trim(), type, chartCfg, suggestion);
            } else {
                this.addMessage('assistant', 'Lo siento, no pude procesar esa solicitud correctamente.');
            }
        } catch (error) {
            console.error('Error invoking Sube IA:', error);
            this.addMessage('assistant', 'Hubo un error de conexión al contactar a mis servidores. Por favor, intenta de nuevo más tarde.');
        } finally {
            this.processingSubject.next(false);
        }
    }

    /**
     * Helper function to append TEXT messages to history
     */
    private addMessage(role: 'user' | 'assistant' | 'system', content: string) {
        const current = this.historySubject.value;
        this.historySubject.next([...current, { role, content, actionType: 'MESSAGE', timestamp: new Date() }]);
    }

    /**
     * Helper function to append STRUCTURED AI messages to history
     */
    private addStructuredMessage(role: 'user' | 'assistant', content: string, actionType: 'MESSAGE' | 'CHART' | 'ACTION_PROMPT', chartConfig?: any, actionSuggested?: any) {
        const current = this.historySubject.value;
        this.historySubject.next([...current, {
            role,
            content,
            actionType,
            chartConfig,
            actionSuggested,
            timestamp: new Date()
        }]);
    }

    /**
     * Clears the current session history
     */
    clearHistory() {
        this.historySubject.next([]);
        this.addMessage('assistant', 'La conversación ha sido reiniciada. ¿En qué más puedo ayudarte?');
    }
}
