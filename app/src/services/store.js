import { create } from "zustand"

const store = create(set => ({
  user: null,
  setUser: user => set(() => ({ user })),

  organization: null,
  setOrganization: organization => set(() => ({ organization })),

  isNavCollapsed: false,
  setNavCollapsed: isNavCollapsed => set(() => ({ isNavCollapsed }))
}))

export default store
