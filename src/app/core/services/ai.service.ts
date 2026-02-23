import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    chartConfig?: any;
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
        this.addMessage('assistant', '¡Hola! Soy SUBE IA. Estoy aquí para ayudarte a encontrar información rápidamente, resumir proyectos o buscar clientes. ¿En qué te ayudo hoy?');
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
            const callable = httpsCallable<{ prompt: string, context?: any }, { success: boolean, response: string }>(this.functions, 'askSubeIA');

            // Inject the current history into the context so the model has "memory" of the conversation
            // We limit to the last 6 messages to save tokens.
            const recentHistory = this.historySubject.value
                .slice(-6)
                .map(msg => `${msg.role === 'user' ? 'Usuario' : 'SUBE IA'}: ${msg.content}`)
                .join('\\n');

            const enrichedContext = {
                ...context,
                conversation_history: recentHistory
            };

            const result = await callable({ prompt, context: enrichedContext });

            if (result.data && result.data.success) {
                let textResponse = result.data.response;
                let chartConfig: any = undefined;

                // Extraer bloque json_chart si el LLM lo retorna
                const chartRegex = /```json_chart([\s\S]*?)```/;
                const match = chartRegex.exec(textResponse);
                if (match && match[1]) {
                    try {
                        chartConfig = JSON.parse(match[1].trim());
                        textResponse = textResponse.replace(match[0], ''); // Remover texto del bloque
                    } catch (e) { console.error('Error parseando JSON chart de SUBE IA', e); }
                }

                this.addMessage('assistant', textResponse.trim(), chartConfig);
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
     * Helper function to append messages to history
     */
    private addMessage(role: 'user' | 'assistant' | 'system', content: string, chartConfig?: any) {
        const current = this.historySubject.value;
        this.historySubject.next([...current, { role, content, chartConfig, timestamp: new Date() }]);
    }

    /**
     * Clears the current session history
     */
    clearHistory() {
        this.historySubject.next([]);
        this.addMessage('assistant', 'La conversación ha sido reiniciada. ¿En qué más puedo ayudarte?');
    }
}
