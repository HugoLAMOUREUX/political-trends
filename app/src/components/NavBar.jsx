import React, { useEffect, useState, Fragment } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, Transition } from "@headlessui/react"
import { HiChartBar, HiBars3, HiXMark } from "react-icons/hi2"
import { BiTrendingUp } from "react-icons/bi"
import { MdHowToVote } from "react-icons/md"
import { TbLogout, TbUser } from "react-icons/tb"

import useStore from "@/services/store"
import api from "@/services/api"

const MENU = [
  { title: "Tendances", to: "/trends", logo: <BiTrendingUp className="h-6 w-6" /> },
  { title: "Élections", to: "/elections", logo: <MdHowToVote className="h-6 w-6" /> }
]

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser, isNavCollapsed, setNavCollapsed } = useStore()
  const [selected, setSelected] = useState(0)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const index = MENU.findIndex(e => location.pathname.includes(e.to))
    setSelected(index !== -1 ? index : 0)
  }, [location])

  useEffect(() => {
    // Close mobile menu when location changes
    setIsMobileOpen(false)
  }, [location])

  const handleLogout = async () => {
    setUser(null)
    api.removeToken()
    navigate("/auth")
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg">
        {isMobileOpen ? <HiXMark className="h-6 w-6" /> : <HiBars3 className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsMobileOpen(false)} />}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-600 to-indigo-700 shadow-xl z-40
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isNavCollapsed ? "lg:w-20" : "lg:w-64"}
          w-72
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-blue-500">
            <div className={`flex items-center ${isNavCollapsed ? "justify-center" : "gap-3"}`}>
              <HiChartBar className="h-8 w-8 text-white flex-shrink-0" />
              {!isNavCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-white font-bold text-lg whitespace-nowrap">Political Trends</h1>
                  <p className="text-blue-200 text-xs whitespace-nowrap">Analyse électorale</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setNavCollapsed(!isNavCollapsed)}
            className="hidden lg:block absolute -right-3 top-20 bg-white rounded-full p-1.5 shadow-lg hover:shadow-xl transition-shadow"
          >
            {isNavCollapsed ? (
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          {/* Menu */}
          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="space-y-2">
              {MENU.map((menu, index) => (
                <Link
                  to={menu.to}
                  key={menu.title}
                  title={menu.title}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    selected === index ? "bg-white text-blue-600 shadow-lg" : "text-white hover:bg-blue-500 hover:bg-opacity-30"
                  } ${isNavCollapsed ? "justify-center" : ""}`}
                  onClick={() => setSelected(index)}
                >
                  <span className={selected === index ? "text-blue-600" : "text-white"}>{menu.logo}</span>
                  {!isNavCollapsed && <span className="text-sm font-semibold whitespace-nowrap">{menu.title}</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* Profile Section */}
          <div className="p-4 border-t border-blue-500">
            <Menu as="div" className="relative w-full">
              <Menu.Button
                className={`w-full rounded-lg bg-blue-500 bg-opacity-30 hover:bg-opacity-50 transition-all duration-200 flex items-center gap-3 ${
                  isNavCollapsed ? "justify-center p-2" : "px-4 py-3"
                }`}
              >
                {user?.avatar ? (
                  <img className="h-10 w-10 rounded-full border-2 border-white object-cover flex-shrink-0" src={user.avatar} alt="" />
                ) : (
                  <span className="h-10 w-10 rounded-full border-2 border-white bg-white flex items-center justify-center uppercase font-bold text-blue-600 text-sm flex-shrink-0">
                    {user?.name?.[0] || "U"}
                  </span>
                )}
                {!isNavCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{user?.name || "Utilisateur"}</p>
                  </div>
                )}
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className={`absolute bottom-full mb-2 ${isNavCollapsed ? "left-full ml-2" : "w-full"} min-w-[200px] rounded-lg bg-white shadow-lg p-2 space-y-1`}>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`w-full flex items-center justify-between rounded-md px-4 py-2 text-sm ${active ? "bg-gray-100 text-gray-900" : "text-gray-700"}`}
                        onClick={() => navigate("/account")}
                      >
                        Mon Profil
                        <TbUser className="h-5 w-5" />
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`w-full flex items-center justify-between rounded-md px-4 py-2 text-sm text-white ${active ? "bg-red-600" : "bg-red-500"}`}
                        onClick={handleLogout}
                      >
                        Se déconnecter
                        <TbLogout className="h-5 w-5" />
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
