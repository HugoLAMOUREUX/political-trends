import { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import Modal from "@/components/modal"
import LoadingButton from "@/components/loadingButton"
import api from "@/services/api"

export default function CreateModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: "", description: "" })
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!values.name || !values.description) {
      return toast.error("Please fill all fields")
    }

    setLoading(true)
    try {
      const { data, ok } = await api.post("/dummy", values)
      if (!ok) throw new Error()
      toast.success("Created successfully!")
      setValues({ name: "", description: "" })
      onClose()
      navigate(`/dummy/${data._id}`)
    } catch (e) {
      toast.error("Error creating item")
    }
    setLoading(false)
  }

  const handleClose = () => {
    setValues({ name: "", description: "" })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-[90vw] md:w-[500px]">
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-6 text-gray-900">Create New Item</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={values.name}
              onChange={e => setValues({ ...values, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Enter description"
              value={values.description}
              onChange={e => setValues({ ...values, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 mt-6">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <LoadingButton
            loading={loading}
            disabled={!values.name || !values.description}
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Create
          </LoadingButton>
        </div>
      </div>
    </Modal>
  )
}
