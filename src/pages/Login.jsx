import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Link,
  useToast,
} from "@chakra-ui/react";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      authLogin(data, data.token);
      navigate("/");
    } catch (error) {
      console.error("Ошибка входа:", error);
      let errorData = "";
      if (error.response) {
        // Если сервер вернул строку (например, HTML с <!doctype html>), выводим её как есть
        if (typeof error.response.data === "string") {
          errorData = error.response.data;
        } else {
          errorData = JSON.stringify(error.response.data, null, 2);
        }
      } else {
        errorData = error.message;
      }
      toast({
        title: "Ошибка входа",
        description: errorData,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius={8}>
      <VStack as="form" spacing={4} onSubmit={handleSubmit}>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Пароль</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={loading}>
          Войти
        </Button>
        <Text>
          Нет аккаунта?{" "}
          <Link as={RouterLink} to="/register" color="blue.500">
            Зарегистрироваться
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default Login;
