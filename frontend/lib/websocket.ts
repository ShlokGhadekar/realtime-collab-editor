import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface CodeChangeMessage {
    roomCode: string;
    content: string;
    senderUsername: string;
    language: string;
    timestamp: number;
}

export interface PresenceMessage {
    roomCode: string;
    username: string;
    event: string;
    timestamp: number;
}

// store client per room so two tabs don't overwrite each other
const clients: Map<string, Client> = new Map();

export const connectWebSocket = (
    roomCode: string,
    username: string,
    onCodeChange: (message: CodeChangeMessage) => void,
    onPresenceChange: (message: PresenceMessage) => void,
    onConnected: () => void
) => {
    // disconnect existing connection for this room if any
    if (clients.has(roomCode)) {
        clients.get(roomCode)?.deactivate();
        clients.delete(roomCode);
    }

    const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        connectHeaders: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        onConnect: () => {
            console.log(`WebSocket connected for room ${roomCode}`);

            client.subscribe(`/topic/room/${roomCode}`, (msg) => {
                try {
                    const body = JSON.parse(msg.body) as CodeChangeMessage;
                    console.log('Received code change from:', body.senderUsername);
                    onCodeChange(body);
                } catch (e) {
                    console.error('Failed to parse message', e);
                }
            });

            client.subscribe(`/topic/room/${roomCode}/presence`, (msg) => {
                try {
                    const body = JSON.parse(msg.body) as PresenceMessage;
                    onPresenceChange(body);
                } catch (e) {
                    console.error('Failed to parse presence', e);
                }
            });

            // announce arrival after subscriptions are set up
            client.publish({
                destination: '/app/room/presence',
                body: JSON.stringify({
                    roomCode,
                    username,
                    event: 'JOINED',
                    timestamp: Date.now(),
                }),
            });

            onConnected();
        },
        onStompError: (frame) => {
            console.error('STOMP error', frame);
        },
        onDisconnect: () => {
            console.log(`WebSocket disconnected for room ${roomCode}`);
        },
    });

    clients.set(roomCode, client);
    client.activate();
};

export const sendCodeChange = (message: CodeChangeMessage) => {
    const client = clients.get(message.roomCode);
    if (!client) {
        console.warn('No client found for room', message.roomCode);
        return;
    }
    if (client.connected) {
        client.publish({
            destination: '/app/room/edit',
            body: JSON.stringify(message),
        });
    } else {
        // wait up to 3 seconds for connection then retry once
        setTimeout(() => {
            if (client.connected) {
                client.publish({
                    destination: '/app/room/edit',
                    body: JSON.stringify(message),
                });
            }
        }, 1000);
    }
};

export const disconnectWebSocket = (roomCode: string, username: string) => {
    const client = clients.get(roomCode);
    if (client?.connected) {
        client.publish({
            destination: '/app/room/presence',
            body: JSON.stringify({
                roomCode,
                username,
                event: 'LEFT',
                timestamp: Date.now(),
            }),
        });
    }
    client?.deactivate();
    clients.delete(roomCode);
};