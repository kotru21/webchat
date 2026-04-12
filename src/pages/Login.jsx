import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "@context/useAuth";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { useLoginForm } from "@features/auth/model/useLoginForm";

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const {
    email,
    password,
    loading,
    fieldErrors,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  } = useLoginForm({
    onAuthenticated: (data) => {
      authLogin(data, data.token, data.refreshToken);
      navigate("/");
    },
  });

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <Card className="w-full max-w-lg border-border/70 bg-card/92 backdrop-blur-xl m3-elev-2">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl">Вход в WebChat</CardTitle>
            <CardDescription>
              Продолжите диалог с вашей командой в едином рабочем пространстве.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={fieldErrors.password ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
              </div>

              <Button type="submit" className="h-11 w-full text-sm" disabled={loading}>
                {loading ? "Выполняется вход..." : "Войти"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            Нет аккаунта?
            <RouterLink
              to="/register"
              className="ml-1.5 font-medium text-primary underline-offset-4 hover:underline">
              Зарегистрироваться
            </RouterLink>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
