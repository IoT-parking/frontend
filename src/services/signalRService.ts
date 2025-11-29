import * as signalR from '@microsoft/signalr';

export interface SensorReading {
    sensorType: string;
    sensorInstanceId: string;
    value: number;
    unit: string;
    timestamp: string;
}

type SensorReadingCallback = (reading: SensorReading) => void;

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private callbacks: SensorReadingCallback[] = [];

    constructor() {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/sensorHub`, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount === 1) return 2000;
                    if (retryContext.previousRetryCount === 2) return 10000;
                    return 30000;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.on('ReceiveSensorReading', (reading: SensorReading) => {
            this.callbacks.forEach(callback => callback(reading));
        });


        this.connection.onreconnecting((error) => {
            console.warn('SignalR reconnecting...', error);
        });

        this.connection.onreconnected((connectionId) => {
            console.log('SignalR reconnected. Connection ID:', connectionId);
        });

        this.connection.onclose((error) => {
            console.error('SignalR connection closed', error);
        });
    }

    async start(): Promise<void> {
        if (!this.connection) return;

        try {
            await this.connection.start();
            console.log('SignalR connected. Connection ID:', this.connection.connectionId);
        } catch (error) {
            console.error('Error starting SignalR connection:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.connection) return;

        try {
            await this.connection.stop();
            console.log('SignalR connection stopped');
        } catch (error) {
            console.error('Error stopping SignalR connection:', error);
        }
    }

    onSensorReading(callback: SensorReadingCallback): () => void {
        this.callbacks.push(callback);
        
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    getConnectionState(): signalR.HubConnectionState {
        return this.connection?.state || signalR.HubConnectionState.Disconnected;
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }
}

export const signalRService = new SignalRService();
