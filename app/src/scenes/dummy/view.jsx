import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import Loader from "@/components/loader"
import LoadingButton from "@/components/loadingButton"
import TabItem from "@/components/TabItem"
import api from "@/services/api"

const INFORMATION = "INFORMATION"
const RAW_DATA = "RAW_DATA"

export default function DummyView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState()
  const [tab, setTab] = useState(INFORMATION)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const { data, ok } = await api.get(`/dummy/${id}`)
      if (!ok) return toast.error("Error fetching data")
      setData(data)
    } catch (e) {
      toast.error("Error fetching data")
    }
  }

  if (!data) return <Loader />

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate("/dummy")} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to list
      </button>

      <nav className="flex items-center gap-2">
        <TabItem tab={INFORMATION} title="Information" setTab={setTab} active={tab === INFORMATION} />
        <TabItem tab={RAW_DATA} title="Raw Data" setTab={setTab} active={tab === RAW_DATA} />
      </nav>

      <div className="bg-white rounded-md p-6 border border-gray-200 shadow-sm">
        {tab === INFORMATION && <Information data={data} setData={setData} />}
        {tab === RAW_DATA && <RawData data={data} />}
      </div>
    </div>
  )
}

function Information({ data, setData }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(data)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setValues(data)
  }, [data])

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await api.put(`/dummy/${data._id}`, values)
      if (!res.ok) throw new Error()
      setData(res.data)
      toast.success("Updated successfully!")
    } catch (e) {
      toast.error("Error updating")
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return
    try {
      const res = await api.remove(`/dummy/${data._id}`)
      if (!res.ok) throw new Error()
      toast.success("Deleted successfully!")
      navigate("/dummy")
    } catch (e) {
      toast.error("Error deleting")
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={values.name || ""}
            onChange={e => setValues({ ...values, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
          <input className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"} disabled />
        </div>

        <div className="w-full col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            rows={4}
            value={values.description || ""}
            onChange={e => setValues({ ...values, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <LoadingButton loading={loading} onClick={handleUpdate} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors">
          Update
        </LoadingButton>
        <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
          Delete
        </button>
      </div>
    </div>
  )
}

function RawData({ data }) {
  return (
    <div className="bg-gray-50 p-4 rounded-md overflow-auto">
      <pre className="break-all whitespace-pre-wrap text-sm text-gray-800">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
