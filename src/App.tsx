import React, { useRef, useState, useEffect, Component, RefObject } from 'react';
import axios from 'axios';
import { useSockets } from './context/socket.context';

import { AppBar, Box, Button, Divider, IconButton, ListItem, ListItemText, Stack, TextField, TextFieldProps, Toolbar } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { css } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';

const URL = 'https://fastchat-server.fly.dev';
// const URL = 'http://127.0.0.1:8000';
// const URL = 'http://chat-server';

const Header = ({title} : {title: string}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='static'>
        <Toolbar>
          {title}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

type Message = {
  id: number;
  userName: string;
  text: string;
  like: number;
};

const fetchChat = async (url: string = URL): Promise<object[]> => {
    return axios.get(`${url}/messages`).then((res) => {
      const messages: object[] = res.data;
      return messages;
    })
};

const App = () => {
  const {socket, messages, setMessages} = useSockets();
  const messageRef = useRef<TextFieldProps>(null);
  console.log(messages);

  const [loaded, setOnLoad] = useState(false);
  const [chats, setChats] = useState<Message[]>([]);

  useEffect(() => {
    const onPageLoad = () => {
      setOnLoad(true);
    }

    if (document.readyState === 'complete') {
      onPageLoad();
    } else {
      window.addEventListener('load', onPageLoad);
      return () => window.removeEventListener('load', onPageLoad);
    }
  }, []);

  if (!loaded) {
    socket.emit('join', socket.id);
  }
  const postLike = (id: number) => {
    axios.put(`${URL}/messages/${id}`).then((_) => {
      socket.emit('like', id);
    });
  }

  const MessageRow = ({message}: {message: Message}) => {
    return (
      <Grid container spacing={2}>
        <Grid xs={8}>
          <ListItemText>
            {message.text}
          </ListItemText>
        </Grid>
        <Grid xs={2}>
          <ListItem>
            <IconButton aria-label='like' onClick={() => postLike(message.id)}>
              <ThumbUpAltOutlinedIcon />
            </IconButton>
          </ListItem>
        </Grid>
        <Grid xs={2}>
          <ListItem>
            {message.like}
          </ListItem>
        </Grid>
      </Grid>
    );
  }

  const ChatList = ({chatList}: {chatList: Message[]}) => {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Stack spacing={1} divider={<Divider flexItem/>}>
          {
          chatList.map((chat, i) => {
            return (
              <MessageRow message={chat} key={`message_${i}`} />
            );
          })
          }
        </Stack>
      </Box>
    );
  };

  const getChat = async () => {
    const message = await fetchChat() as Message[];
    setChats(message.map((obj, _) => {
      const msg: Message = obj as Message;
      console.log(msg);
      return msg;
    }));
    // setChats(message);
  };

  const sendClick = () => {
    const chatText = messageRef.current?.value;
    if (!String(chatText).trim()) return;

    const newMessage = {text: chatText, user: '名無し'};
    axios.post<Message>(`${URL}/messages`, newMessage).then((response) => {
      console.log('add');
      console.log(response.data)
      socket.emit('add', response.data);
      messageRef.current!.value = "";
      messageRef.current?.focus();
    });
  };

  useEffect(() => {
    const onJoin = (sid: string) => {
      getChat();
      console.info(`join: ${sid}`);
    };

    const onAdd = (newMessage: Message) => {
      console.log('new msg');
      console.log(...chats.map((chat) => {return chat}));
      newMessage.like = 0;
      setChats(current => [...current, newMessage]);
    };

    const onLike = (message_id: number) => {
      setChats(prevState => prevState.map((chat) => {
        if (chat.id === message_id) {
          return {...chat, like: chat.like + 1}
        } else {
          return chat;
        }
      }));
      console.log(chats);
    };

    socket.on('broadcast_join', onJoin);
    socket.on('broadcast_add', onAdd);
    socket.on('broadcast_like', onLike)

    return () => {
      socket.off('broadcast_join', onJoin);
      socket.off('broadcast_add', onAdd);
      socket.off('broadcast_like', onLike);
    };
  }, []);

  return (
    <div>
      <Header title='fast chat'/>
      <Stack spacing={1}>
        <ChatList chatList={chats} />
        <TextField id='message_area' inputRef={messageRef} label='write message' multiline maxRows={4} />
        <Button onClick={sendClick}>Send</Button>
      </Stack>
    </div>
  )
};

export default App;
