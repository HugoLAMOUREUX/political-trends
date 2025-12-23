import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingButton from "../../components/LoadingButton";

import api from "../../services/api";

export default function AdminList() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState();
  const [filter, setFilter] = useState({
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState();
  const handleNextPage = () => setCurrentPage((prev) => prev + 1);
  const handlePreviousPage = () => setCurrentPage((prev) => prev - 1);

  useEffect(() => {
    getAdmins();
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    getAdmins();
  }, [currentPage]);

  const getAdmins = async () => {
    try {
      const { data, ok, total, code } = await api.post("/admin/search", {
        search: filter.search,
        offset: (currentPage - 1) * 10,
      });
      if (!ok) return toast.error(code || "Error!");
      setAdmins(data);
      setTotal(total);
    } catch (error) {
      return toast.error("Error fetching admins!");
    }
  };

  if (!admins) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-full max-w-md">
          <SearchBar search={filter.search} setFilter={setFilter} placeholder="Search admins..." />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Total: <span className="font-semibold font-mono text-gray-900">{total || 0}</span> admins
          </div>
          <InviteAdmin onSuccess={getAdmins} />
        </div>
      </div>

      <div className="flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                        No admins found
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => {
                      const isPending = admin.invitation_token && admin.invitation_expires && new Date(admin.invitation_expires) > new Date();
                      const isExpired = admin.invitation_token && admin.invitation_expires && new Date(admin.invitation_expires) <= new Date();

                      return (
                        <tr key={admin._id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/${admin._id}`)}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{admin.name || "—"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{admin.email || "—"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {isPending && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>}
                            {isExpired && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>}
                            {!isPending && !isExpired && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                            {admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString() : "Never"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Pagination total={total} per_page={10} currentPage={currentPage} onNext={handleNextPage} onPrevious={handlePreviousPage} />
    </div>
  );
}

function InviteAdmin({ onSuccess }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [btnLoading, setBtnLoading] = useState(false);

  const onCreate = async () => {
    setBtnLoading(true);
    try {
      const { ok, code, data } = await api.post("/admin", values);

      if (!ok) {
        toast.error(code || "Error creating admin!");
        setBtnLoading(false);
      } else {
        toast.success("Admin invitation sent!");
        setOpen(false);
        setValues({});
        setBtnLoading(false);
        if (onSuccess) onSuccess();
        navigate(`/admin/${data._id}`);
      }
    } catch (error) {
      toast.error("Error creating admin!");
      setBtnLoading(false);
    }
  };

  return (
    <div>
      <button
        className="whitespace-nowrap flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
        onClick={() => setOpen(true)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Invite Admin
      </button>

      <Modal isOpen={open} className="!w-[90vw] md:!w-[500px] p-6" onClose={() => setOpen(false)}>
        <h1 className="text-xl font-semibold mb-6 text-gray-900">Invite New Admin</h1>

        <div className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input className="w-full" placeholder="Enter name" value={values.name || ""} onChange={(e) => setValues({ ...values, name: e.target.value })} />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input className="w-full" placeholder="Enter email" type="email" value={values.email || ""} onChange={(e) => setValues({ ...values, email: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 mt-6">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <LoadingButton
            className="py-2 px-4 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            loading={btnLoading}
            disabled={!values.name || !values.email}
            onClick={onCreate}
          >
            Send Invitation
          </LoadingButton>
        </div>
      </Modal>
    </div>
  );
}
