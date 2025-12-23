import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io"

import Loader from "@/components/loader"
import SearchBar from "@/components/SearchBar"
import api from "@/services/api"

import CreateModal from "./createModal"

const PER_PAGE = 10

export default function DummyList() {
  const navigate = useNavigate()
  const [data, setData] = useState()
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({ search: "", page: 1 })
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    try {
      const res = await api.post("/dummy/search", {
        search: filter.search,
        limit: PER_PAGE,
        offset: (filter.page - 1) * PER_PAGE
      })
      if (!res.ok) return toast.error("Error fetching data")
      setData(res.data)
      setTotal(res.total)
    } catch (e) {
      toast.error("Error fetching data")
    }
  }

  if (!data) return <Loader />

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-full max-w-md">
          <SearchBar search={filter.search} setFilter={setFilter} placeholder="Search..." />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold font-mono text-gray-900">{total}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">
                      No data found
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/dummy/${item._id}`)}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{item.description}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between py-1">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(filter.page - 1) * PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(total, filter.page * PER_PAGE)}</span> of{" "}
            <span className="font-medium">{total}</span> results
          </p>
          <nav className="inline-flex -space-x-px rounded-md shadow-sm bg-white">
            <button
              disabled={filter.page <= 1}
              onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <IoIosArrowBack className="h-5 w-5" />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">{filter.page}</span>
            <button
              disabled={filter.page * PER_PAGE >= total}
              onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <IoIosArrowForward className="h-5 w-5" />
            </button>
          </nav>
        </div>
      )}

      <CreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
