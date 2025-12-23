import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import validator from "validator"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import { FiMail, FiEye, FiEyeOff, FiLock, FiUser } from "react-icons/fi"
// import { useGoogleLogin } from "@react-oauth/google";

import Loader from "../../components/loader"

import api from "../../services/api"
import store from "@/services/store"

export default function Signin() {
  const [email, setEmail] = useState("")
  const [userExists, setUserExists] = useState(null)
  const [forgotPassword, setForgotPassword] = useState(false)

  const { agency } = store()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="relative max-w-md w-full px-4">
        <div className="relative bg-white rounded-xl border border-blue-500/20 shadow-2xl p-6">
          {!email && !forgotPassword && !agency && <EmailCheck setEmail={setEmail} setUserExists={setUserExists} />}
          {agency && !email && !forgotPassword && <EmailCheckAgency setEmail={setEmail} setUserExists={setUserExists} />}
          {userExists && email && !forgotPassword && <SignIn email={email} setForgotPassword={setForgotPassword} />}
          {!userExists && email && !forgotPassword && <SignUp email={email} />}
          {forgotPassword && <ForgotPassword setForgotPassword={setForgotPassword} email={email} />}
        </div>
      </div>
    </div>
  )
}

// Email Check Component
const EmailCheck = ({ setEmail, setUserExists }) => {
  const [loading, setLoading] = useState(false)
  const [email, setEmailValue] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // const redirect = searchParams.get("redirect");

  //   const handleGoogleConnect = useGoogleLogin({
  //     scope: "openid email profile",
  //     onSuccess: async (tokenResponse) => {
  //       if (typeof window !== "undefined" && window.trackSigninStart) window.trackSigninStart();
  //       handleGoogleSuccess(tokenResponse);
  //     },
  //     onError: (error) => handleGoogleError(error),
  //   });

  //   const handleGoogleError = () => {
  //     toast.error(e.code);
  //   };

  //   const handleGoogleSuccess = async (credentialResponse) => {
  //     console.log("credentialResponse", credentialResponse);
  //     try {
  //       let referral_by = searchParams.get("ref");
  //       let utm_source = searchParams.get("utm_source");
  //       let utm_from = searchParams.get("utm_from");

  //       if (!referral_by) {
  //         const redirectParam = searchParams.get("redirect");
  //         if (redirectParam) {
  //           const redirectUrl = new URL(decodeURIComponent(redirectParam), window.location.origin);
  //           const redirectParams = new URLSearchParams(redirectUrl.search);
  //           referral_by = redirectParams.get("ref");
  //           utm_source = redirectParams.get("utm_source");
  //           utm_from = redirectParams.get("utm_from");
  //         }
  //       }

  //       const { user, token, isNewUser } = await api.post(`/user/auth/google`, {
  //         access_token: credentialResponse.access_token,
  //         referral_by: referral_by,
  //         waalego_utm_source: utm_source,
  //         waalego_utm_from: utm_from,
  //         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  //       });

  //       if (user) dispatch(setUser(user));
  //       if (token) api.setToken(token);

  //       // Track Google auth success
  //       if (typeof window !== "undefined") {
  //         if (isNewUser) {
  //           if (window.onSignupSuccess) window.onSignupSuccess("google");
  //           if (window.gtag) {
  //             window.gtag("event", "sign_up", { method: "google_oauth", event_category: "engagement", event_label: "user_registration" });
  //           }
  //         } else {
  //           if (window.onSigninSuccess) window.onSigninSuccess("google");
  //         }
  //       }

  //       if (!isNewUser && redirect) {
  //         navigate(redirect);
  //         return;
  //       }

  //       navigate("/");
  //     } catch (e) {
  //       console.log("e", e);
  //       toast.error(e.code);
  //     }
  //   };

  const handleSubmit = async e => {
    try {
      e.preventDefault()
      if (!email) return setError("Email is required")
      if (!validator.isEmail(email)) return setError("Invalid email address")
      if (typeof window !== "undefined" && window.trackSignupStart) window.trackSignupStart()

      setLoading(true)

      const { exists, isGoogleUser } = await api.post("/user/check-email", { email })
      if (isGoogleUser) return toast.error("This email is associated with a Google account. Please sign in with Google.")
      setEmail(email)
      setUserExists(exists)
    } catch (e) {
      if (e.code === "INVITATION_NOT_ACCEPTED") return toast.error(e.code)
      console.error(e)
      toast.error(e.code)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="mb-8 flex justify-center">
              <span className="text-xl font-extrabold text-gray-900">Boilerplate</span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to Boilerplate</h1>
      </div>

      {/* Google Sign In Button */}
      {/* <div className="mb-6">
        <button
          id="google-button"
          onClick={handleGoogleConnect}
          className="flex items-center justify-center w-full px-4 py-3 border border-blue-500/20 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>
      </div> */}

      {/* Divider */}
      {/* <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-600">or continue with email</span>
        </div>
      </div> */}

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-base text-gray-700 flex items-center mb-2">
            <FiMail className="mr-2 text-blue-400" size={20} />
            Email <span className="text-blue-400 ml-1">*</span>
          </label>
          <input
            id="email-input"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 text-base placeholder-gray-400"
            name="email"
            type="email"
            value={email}
            onChange={e => {
              setEmailValue(e.target.value)
              setError("")
            }}
            onFocus={() => {
              if (typeof window !== "undefined" && window.trackSignupStart) window.trackSignupStart()
            }}
            placeholder="example@company.com"
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>

        <button
          id="email-submit"
          className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? <Loader size="small" color="white" /> : "Continue with Email"}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our{" "}
          <a href="https://waalego.selego.co/terms-privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="https://waalego.selego.co/terms-privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

const EmailCheckAgency = ({ setEmail, setUserExists }) => {
  const [loading, setLoading] = useState(false)
  const [email, setEmailValue] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // const redirect = searchParams.get("redirect");

  const { agency } = store()

  // console.log("agency", agency);

  // const handleGoogleConnect = useGoogleLogin({
  //   scope: "openid email profile",
  //   onSuccess: async (tokenResponse) => {
  //     if (typeof window !== "undefined" && window.trackSigninStart) window.trackSigninStart();
  //     handleGoogleSuccess(tokenResponse);
  //   },
  //   onError: (error) => handleGoogleError(error),
  // });

  // const handleGoogleError = () => {
  //   toast.error("Error while signing in with Google");
  // };

  // const handleGoogleSuccess = async (credentialResponse) => {
  //   console.log("credentialResponse", credentialResponse);
  //   try {
  //     let referral_by = searchParams.get("ref");
  //     let utm_source = searchParams.get("utm_source");
  //     let utm_from = searchParams.get("utm_from");

  //     if (!referral_by) {
  //       const redirectParam = searchParams.get("redirect");
  //       if (redirectParam) {
  //         const redirectUrl = new URL(decodeURIComponent(redirectParam), window.location.origin);
  //         const redirectParams = new URLSearchParams(redirectUrl.search);
  //         referral_by = redirectParams.get("ref");
  //         utm_source = redirectParams.get("utm_source");
  //         utm_from = redirectParams.get("utm_from");
  //       }
  //     }

  //     const { user, token, isNewUser } = await api.post(`/user/auth/google`, {
  //       access_token: credentialResponse.access_token,
  //       referral_by: referral_by,
  //       waalego_utm_source: utm_source,
  //       waalego_utm_from: utm_from,
  //       timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  //     });

  //     if (user) dispatch(setUser(user));
  //     if (token) api.setToken(token);

  //     // Track Google auth success
  //     if (typeof window !== "undefined") {
  //       if (isNewUser) {
  //         if (window.onSignupSuccess) window.onSignupSuccess("google");
  //         if (window.gtag) {
  //           window.gtag("event", "sign_up", { method: "google_oauth", event_category: "engagement", event_label: "user_registration" });
  //         }
  //       } else {
  //         if (window.onSigninSuccess) window.onSigninSuccess("google");
  //       }
  //     }

  //     if (!isNewUser && redirect) {
  //       navigate(redirect);
  //       return;
  //     }

  //     navigate("/");
  //   } catch (e) {
  //     console.log("e", e);
  //     toast.error(e.code);
  //   }
  // };

  const handleSubmit = async e => {
    try {
      e.preventDefault()
      if (!email) return setError("Email is required")
      if (!validator.isEmail(email)) return setError("Invalid email address")
      if (typeof window !== "undefined" && window.trackSignupStart) window.trackSignupStart()

      setLoading(true)

      const { exists, isGoogleUser } = await api.post("/user/check-email", { email })
      if (isGoogleUser) return toast.error("This email is associated with a Google account. Please sign in with Google.")
      setEmail(email)
      setUserExists(exists)
    } catch (e) {
      if (e.code === "INVITATION_NOT_ACCEPTED") return toast.error(e.code)
      console.error(e)
      toast.error(e.code)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        {/* Agency Logo */}
        <div className="flex items-center justify-center mb-6">{agency.logo && <img src={agency.logo} alt="Agency Logo" className="h-20 max-w-[200px] object-contain" />}</div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to {agency.name}</h1>
      </div>
      {/* Google Sign In Button */}
      {/* <div className="mb-6">
        <button
          id="google-button"
          onClick={handleGoogleConnect}
          className="flex items-center justify-center w-full px-4 py-3 border border-blue-500/20 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>
      </div> */}

      {/* Divider */}
      {/* <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-600">or continue with email</span>
        </div>
      </div> */}

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-base text-gray-700 flex items-center mb-2">
            <FiMail className="mr-2 text-blue-400" size={20} />
            Email <span className="text-blue-400 ml-1">*</span>
          </label>
          <input
            id="email-input"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 text-base placeholder-gray-400"
            name="email"
            type="email"
            value={email}
            onChange={e => {
              setEmailValue(e.target.value)
              setError("")
            }}
            onFocus={() => {
              if (typeof window !== "undefined" && window.trackSignupStart) window.trackSignupStart()
            }}
            placeholder="example@company.com"
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>

        <button
          id="email-submit"
          className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? <Loader size="small" color="white" /> : "Continue with Email"}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our{" "}
          <a href="https://waalego.selego.co/terms-privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="https://waalego.selego.co/terms-privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

// Sign In Component
const SignIn = ({ email, setForgotPassword }) => {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [seePassword, setSeePassword] = useState(false)

  const { setUser } = store()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect")

  const handleSubmit = async e => {
    try {
      e.preventDefault()
      if (!password) return setError("Password is required")
      setLoading(true)

      const { user, token } = await api.post(`/user/signin`, { email, password })
      if (token) api.setToken(token)
      if (user) setUser(user)

      if (typeof window !== "undefined" && window.onSigninSuccess) window.onSigninSuccess("email")

      if (redirect) navigate(redirect)
      else navigate("/")
    } catch (e) {
      console.error(e)
      toast.error(e.code)
    }
    setLoading(false)
  }

  return (
    <form className="py-2 w-full" onSubmit={handleSubmit}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="mb-8 flex justify-center">
              <span className="text-xl font-extrabold text-gray-900">Boilerplate</span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to Boilerplate</h1>
        <p className="text-gray-600 text-base mt-2">Welcome to Boilerplate! Enter your password to continue</p>
      </div>
      <div className="mt-10 space-y-8">
        <div>
          <label className="text-base text-gray-700 flex items-center mb-2">
            <FiMail className="mr-2 text-blue-400" size={20} />
            Email
          </label>
          <input className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 text-base" name="email" type="email" id="email" value={email} disabled />
        </div>
        <div>
          <label className="text-base text-gray-700 flex items-center mb-2">
            <FiLock className="mr-2 text-blue-400" size={20} />
            Password <span className="text-blue-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 text-base"
              name="password"
              type={seePassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => setSeePassword(!seePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400">
              {seePassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <div className="text-right mt-2">
            <button type="button" onClick={() => setForgotPassword(true)} className="text-sm text-blue-400 hover:text-blue-300">
              Forgot password?
            </button>
          </div>
        </div>
        <button className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 hover:scale-105" type="submit">
          {loading ? <Loader size="small" color="white" /> : "Sign in"}
        </button>
      </div>
    </form>
  )
}

// Forgot Password Component
const ForgotPassword = ({ setForgotPassword, email }) => {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [emailValue, setEmailValue] = useState(email || "")
  const [error, setError] = useState("")

  const validateEmail = value => {
    if (!validator.isEmail(value)) {
      return "Invalid email address"
    }
    return ""
  }

  const handleSubmit = async e => {
    try {
      e.preventDefault()
      const validationError = validateEmail(emailValue)
      if (validationError) {
        setError(validationError)
        return
      }

      setLoading(true)
      await api.post("/user/forgot_password", { email: emailValue })
      toast.success("Password recovery link has been sent to your email")
      setDone(true)
    } catch (e) {
      console.error(e)
      toast.error(e.code)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="py-8 w-full">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Recovery Link Sent</h1>
          <p className="text-gray-600 text-base">Password recovery link has been sent to your email. Please check your inbox and follow the link to reset your password.</p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => setForgotPassword(false)}
            className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 hover:scale-105"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="py-8 w-full" onSubmit={handleSubmit}>
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="mb-8 flex justify-center">
              <span className="text-xl font-extrabold text-gray-900">Jobego</span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Forgot Password</h1>
        <p className="text-gray-600 text-base">Enter your email address below to receive the password reset link.</p>
      </div>
      <div className="mt-8 space-y-8">
        <div>
          <label className="text-base text-gray-700 flex items-center mb-2">
            <FiMail className="mr-2 text-blue-400" size={20} />
            Email <span className="text-blue-400 ml-1">*</span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 text-base"
            name="email"
            type="email"
            id="email"
            value={emailValue}
            onChange={e => {
              setEmailValue(e.target.value)
              setError("")
            }}
            placeholder="example@mail.com"
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
        <button className="w-full py-3 rounded-lg text-base font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 hover:scale-105" type="submit">
          {loading ? <Loader size="small" color="white" /> : "Send Recovery Link"}
        </button>
        <div className="w-full flex items-center my-2">
          <div className="border-b border-gray-300 w-full" />
          <span className="px-2 text-gray-500 text-xs">or</span>
          <div className="border-b border-gray-300 w-full" />
        </div>
        <button
          type="button"
          onClick={() => setForgotPassword(false)}
          className="w-full py-3 rounded-lg text-base font-semibold text-gray-700 transition-all bg-gray-100 hover:bg-gray-200"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  )
}

// Sign Up Component
const SignUp = ({ email }) => {
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({ email, password: "", name: "" })
  const [errors, setErrors] = useState({ password: "", name: "" })
  const [seePassword, setSeePassword] = useState(false)
  const navigate = useNavigate()

  const { setUser } = store()

  const handleChange = e => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
    setErrors({ ...errors, [name]: "" })
  }

  const handleSubmit = async e => {
    try {
      e.preventDefault()
      if (!values.name) return setErrors({ ...errors, name: "Name is required" })
      if (!values.password) return setErrors({ ...errors, password: "Password is required" })
      setLoading(true)

      const { user, token } = await api.post("/user/signup", values)

      if (token) api.setToken(token)
      if (user) setUser(user)

      navigate("/")
      toast.success("Account created successfully!")
    } catch (e) {
      console.error(e)
      toast.error(e.code)
    }
    setLoading(false)
  }

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="mb-8 flex justify-center">
              <span className="text-xl font-extrabold text-gray-900">Boilerplate</span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to Boilerplate</h1>
        <p className="text-gray-600 text-sm mt-4">Complete your registration to get started</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 flex items-center mb-1">
            <FiMail className="mr-2 text-blue-400" size={18} />
            Email
          </label>
          <input className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 text-sm" name="email" type="email" value={email} disabled />
        </div>
        <div>
          <label className="text-sm text-gray-700 flex items-center mb-1">
            <FiUser className="mr-2 text-blue-400" size={18} />
            Name <span className="text-blue-400 ml-1">*</span>
          </label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-900 text-sm"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-sm text-gray-700 flex items-center mb-1">
            <FiLock className="mr-2 text-blue-400" size={18} />
            Password <span className="text-blue-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-900 text-sm"
              name="password"
              type={seePassword ? "text" : "password"}
              value={values.password}
              onChange={handleChange}
              placeholder="Choose a secure password"
            />
            <button type="button" onClick={() => setSeePassword(!seePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400">
              {seePassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs text-gray-700">
          By signing up, you agree to our{" "}
          <a href="https://boilerplate.co/terms-privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Terms and Privacy Policy
          </a>
        </div>
        <button className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700" type="submit">
          {loading ? <Loader size="small" color="white" /> : "Create Account"}
        </button>
      </div>
    </form>
  )
}
