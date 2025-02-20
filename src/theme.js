import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: true, // включаем автоматическое определение темы системы
};

const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
};

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === "dark" ? "gray.900" : "gray.50",
      color: props.colorMode === "dark" ? "white" : "gray.800",
    },
  }),
};

const components = {
  Box: {
    variants: {
      solid: (props) => ({
        bg: props.colorMode === "dark" ? "gray.700" : "white",
        borderColor: props.colorMode === "dark" ? "gray.600" : "gray.200",
      }),
    },
    defaultProps: {
      variant: "solid",
    },
  },
  Input: {
    variants: {
      outline: (props) => ({
        field: {
          bg: props.colorMode === "dark" ? "gray.700" : "white",
          borderColor: props.colorMode === "dark" ? "gray.600" : "gray.200",
          color: props.colorMode === "dark" ? "white" : "gray.800",
          _hover: {
            borderColor: props.colorMode === "dark" ? "gray.500" : "gray.300",
          },
          _placeholder: {
            color: props.colorMode === "dark" ? "gray.400" : "gray.500",
          },
        },
      }),
    },
    defaultProps: {
      variant: "outline",
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
});

// Важно: экспортируем config отдельно
export { config };
export { theme };
