"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register form
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regNick, setRegNick] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push(data.user.role === "admin" ? "/admin" : "/");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUser,
          password: regPass,
          nickname: regNick,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription>
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">{t("login.loginTab")}</TabsTrigger>
              <TabsTrigger value="register">{t("login.registerTab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.username")}</label>
                <Input
                  placeholder={t("login.username")}
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.password")}</label>
                <Input
                  type="password"
                  placeholder={t("login.password")}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleLogin}
                disabled={!loginUser || !loginPass || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {t("login.loginBtn")}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t("login.demoHint")}
              </p>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.nickname")}</label>
                <Input
                  placeholder={t("login.nickname")}
                  value={regNick}
                  onChange={(e) => setRegNick(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.username")}</label>
                <Input
                  placeholder={t("login.username")}
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.password")}</label>
                <Input
                  type="password"
                  placeholder={t("login.password")}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleRegister}
                disabled={!regUser || !regPass || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {t("login.registerBtn")}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
