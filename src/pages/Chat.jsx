import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const toast = useToast();

  const loadMessages = async () => {
    try {
      const response = await api.get("/messages"); // Убираем лишний /api/
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Ошибка загрузки сообщений",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const newSocket = io("http://192.168.0.105:5000", {
      // Замените X.X на ваш локальный IP-адрес
      withCredentials: true,
      transports: ["websocket", "polling"], // Добавляем явную поддержку WebSocket и polling
    });
    setSocket(newSocket);

    loadMessages();

    newSocket.on("connect", () => {
      console.log("Connected to server");
      newSocket.emit("join_room", "general");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      const messageData = {
        content: message,
        sender: user.username,
        userId: user.id,
        roomId: "general",
        timestamp: new Date().toISOString(),
      };

      socket.emit("send_message", messageData);
      setMessage("");
    }
  };

  return (
    <Box h="100vh" p={4}>
      <VStack h="full" spacing={4}>
        <Box
          flex={1}
          w="full"
          borderWidth={1}
          borderRadius="md"
          p={4}
          overflowY="auto">
          {messages.map((msg, idx) => (
            <Box
              key={msg._id || idx}
              bg={msg.sender === user.username ? "blue.100" : "gray.100"}
              p={2}
              borderRadius="md"
              mb={2}
              ml={msg.sender === user.username ? "auto" : 0}
              mr={msg.sender === user.username ? 0 : "auto"}
              maxW="70%">
              <Text fontSize="sm" fontWeight="bold">
                {msg.sender}
              </Text>
              <Text>{msg.content}</Text>
              <Text fontSize="xs" color="gray.500" textAlign="right">
                {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <HStack as="form" w="full" onSubmit={sendMessage}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
          />
          <Button type="submit" colorScheme="blue">
            Отправить
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Chat;
