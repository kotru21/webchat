import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { theme, config } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ChakraProvider>
    </>
  );
}

export default App;
