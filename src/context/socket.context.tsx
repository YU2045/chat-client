import { useContext, createContext, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface Context {
    socket: Socket,
    messages?: {id: number, userName: string, text: string, like: number}[],
    setMessages: Function
  }
  const socket = io(
    // 'http://chat-server',
    // 'http://127.0.0.1:8000',
    'https://4a8a-133-95-140-220.ngrok-free.app/',
    {transports: ['websocket', 'polling', 'flashsocket']}
)

  const SocketContext = createContext<Context>({
    socket,
    setMessages: () => false,
  });

  const SocketsProvider = (props: any) => {
    const [messages, setMessages] = useState([]);

    return (
      <SocketContext.Provider value={{socket, messages, setMessages}} {...props} />
    )
  }

  export const useSockets = () => useContext(SocketContext);

  export default SocketsProvider;
