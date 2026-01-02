import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import * as Sentry from "@sentry/browser"

import Auth from "@/scenes/auth"
import Elections from "@/scenes/elections"
import Account from "@/scenes/account"
import Trends from "@/scenes/trends"

import Navbar from "@/components/NavBar"
import Loader from "@/components/loader"

import useStore from "@/services/store"
import api from "@/services/api"

import { environment, SENTRY_URL } from "./config"

if (environment === "production") {
  Sentry.init({ dsn: SENTRY_URL, environment: "app" })
}

export default function App() {
  return (
    <BrowserRouter basename="/political-trends/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/auth/*" element={<Auth />} />
        </Route>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Navigate to="/trends" replace />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/account" element={<Account />} />
          <Route path="/trends" element={<Trends />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}

const AuthLayout = () => {
  const { user } = useStore()
  if (user) return <Navigate to="/" replace={true} />
  return (
    <div className="flex flex-col justify-center items-center gap-8 w-screen h-screen">
      <h1 className="text-3xl font-bold">Boilerplate</h1>
      <Outlet />
    </div>
  )
}

const UserLayout = () => {
  const [loading, setLoading] = useState(true)
  const { user, setUser, isNavCollapsed } = useStore()

  async function fetchUser() {
    try {
      const { ok, token, user } = await api.get("/user/signin_token")
      if (!ok) {
        setUser(null)
        return
      }
      api.setToken(token)
      setUser(user)
    } catch (e) {
      console.log(e)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  if (loading) return <Loader />

  if (!user) return <Navigate to="/auth" replace={true} />

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-auto bg-gray-50 transition-all duration-300 ${isNavCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <Outlet />
      </main>
    </div>
  )
}
