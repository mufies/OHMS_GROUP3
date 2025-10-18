import {useEffect, useReducer, useRef, useCallback} from 'react';
import {Client} from '@stomp/stompjs';
import type {IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type SubscriptionCallback = (message: any) => void;

type State = {
  client: Client | null;
  subscriptions: Map<string, any>;
};

type Action =
  | {type: 'SET_CLIENT'; payload: Client}
  | {type: 'ADD_SUBSCRIPTION'; payload: {destination: string; subscription: any}}
  | {type: 'REMOVE_SUBSCRIPTION'; payload: string}
  | {type: 'CLEAR_CLIENT'};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_CLIENT':
      return {...state, client: action.payload};
    case 'ADD_SUBSCRIPTION':
      return {...state, subscriptions: new Map(state.subscriptions).set(action.payload.destination, action.payload.subscription)};
    case 'REMOVE_SUBSCRIPTION':
      const updatedSubscriptions = new Map(state.subscriptions);
      updatedSubscriptions.delete(action.payload);
      return {...state, subscriptions: updatedSubscriptions};
    case 'CLEAR_CLIENT':
      return {client: null, subscriptions: new Map()};
    default:
      return state;
  }
};

export const useWebSocketService = (
  webSocketUrl: string,
  onConnectCallback: () => void,
  onErrorCallback: (error: string) => void,
) => {
  const [state, dispatch] = useReducer(reducer, {
    client: null,
    subscriptions: new Map(),
  });

  const clientRef = useRef<Client | null>(null);
  const isConnected = useRef(false);

  useEffect(() => {
    clientRef.current = state.client;
  }, [state.client]);

  const connect = useCallback(() => {
    if (state.client || isConnected.current) {
      console.log('⚠️ WebSocket already connected, skipping connection attempt');
      return;
    }

    console.log('🔌 Attempting to connect to WebSocket:', webSocketUrl);

    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(webSocketUrl);
      },
      connectHeaders: token ? {
        'Authorization': `Bearer ${token}`
      } : {},
      debug: str => console.log('🔌 STOMP Debug:', str),
      reconnectDelay: 2000, // Reduced from 5000ms for faster reconnection
      heartbeatIncoming: 10000, // Increased for stability
      heartbeatOutgoing: 10000, // Increased for stability
      onConnect: () => {
        isConnected.current = true;
        console.log('✅ WebSocket connected successfully');
        onConnectCallback();
      },
      onStompError: error => {
        console.error('❌ STOMP Error:', error);
        isConnected.current = false;
        onErrorCallback(error.headers['message'] || 'Unknown STOMP error');
      },
      onWebSocketError: error => {
        console.error('❌ WebSocket Error:', error);
        isConnected.current = false;
        onErrorCallback('WebSocket connection failed');
      },
      onDisconnect: () => {
        console.log('🔌 WebSocket disconnected');
        isConnected.current = false;
      },
    });

    client.activate();
    dispatch({type: 'SET_CLIENT', payload: client});
  }, [state.client, webSocketUrl, onConnectCallback, onErrorCallback]);

  const subscribe = useCallback(
    (destination: string, callback: SubscriptionCallback) => {
      const client = clientRef.current;
      if (!client || !isConnected.current) {
        console.error('❌ Cannot subscribe: WebSocket not connected');
        return;
      }

      if (state.subscriptions.has(destination)) {
        console.log('⚠️ Already subscribed to:', destination);
        return;
      }

      console.log('📡 Subscribing to:', destination);
      const subscription = client.subscribe(destination, (message: IMessage) => {
        console.log('📨 Received message on', destination, ':', message.body);
        if (message.body) {
          try {
            const parsedMessage = JSON.parse(message.body);
            callback(parsedMessage);
          } catch (error) {
            console.error('❌ Error parsing message:', error, 'Raw message:', message.body);
          }
        }
      });

      dispatch({type: 'ADD_SUBSCRIPTION', payload: {destination, subscription}});
      console.log('✅ Successfully subscribed to:', destination);
    },
    [state.subscriptions],
  );

  const send = useCallback((destination: string, body: Record<string, any> = {}) => {
    const client = clientRef.current;
    if (!client || !isConnected.current) {
      console.error('❌ Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      console.log('📤 Sending message to:', destination, 'Body:', body);
      client.publish({destination, body: JSON.stringify(body)});
      console.log('✅ Message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }, []);

  const unsubscribe = useCallback((destination: string) => {
    const subscription = state.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      dispatch({type: 'REMOVE_SUBSCRIPTION', payload: destination});
    }
  }, [state.subscriptions]);

  const disconnect = useCallback(() => {
    const client = clientRef.current;
    if (client && isConnected.current) {
      state.subscriptions.forEach(subscription => subscription.unsubscribe());
      client.deactivate();
      dispatch({type: 'CLEAR_CLIENT'});
      isConnected.current = false;
    }
  }, [state.subscriptions]);

  return {connect, subscribe, send, unsubscribe, disconnect};
};