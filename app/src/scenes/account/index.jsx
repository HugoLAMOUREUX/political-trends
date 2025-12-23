import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { FiUser, FiMail, FiLock } from "react-icons/fi"

import useStore from "@/services/store"
import api from "@/services/api"
import Loader from "@/components/loader"
import FileInput from "@/components/file-input"

export default function Account() {
  const { user, setUser } = useStore()
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({
    name: "",
    email: "",
    avatar: ""
  })

  useEffect(() => {
    if (user) {
      setValues({
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || ""
      })
    }
  }, [user])

  const handleChange = e => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { ok, data } = await api.put("/user", values)
      if (!ok) throw new Error()
      setUser(data)
      toast.success("Profil mis à jour avec succès !")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <Loader />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon Profil</h1>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
            <FileInput value={values.avatar} name="avatar" folder="avatars" onChange={e => setValues({ ...values, avatar: e.target.value })} />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center mb-2">
              <FiUser className="mr-2 text-blue-500" size={18} />
              Nom
            </label>
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Votre nom"
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center mb-2">
              <FiMail className="mr-2 text-blue-500" size={18} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <PasswordSection />
    </div>
  )
}

function PasswordSection() {
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({
    password: "",
    newPassword: "",
    verifyPassword: ""
  })

  const handleChange = e => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (values.newPassword !== values.verifyPassword) {
      return toast.error("Les mots de passe ne correspondent pas")
    }
    if (values.newPassword.length < 6) {
      return toast.error("Le mot de passe doit contenir au moins 6 caractères")
    }
    setLoading(true)
    try {
      const { ok } = await api.post("/user/reset_password", values)
      if (!ok) throw new Error()
      toast.success("Mot de passe mis à jour avec succès !")
      setValues({ password: "", newPassword: "", verifyPassword: "" })
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la mise à jour du mot de passe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FiLock className="mr-2 text-blue-500" size={20} />
        Changer le mot de passe
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            name="newPassword"
            value={values.newPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            name="verifyPassword"
            value={values.verifyPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !values.password || !values.newPassword || !values.verifyPassword}
            className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  )
}
