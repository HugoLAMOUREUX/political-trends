import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Loader from "../../components/Loader";
import LoadingButton from "../../components/LoadingButton";
import TabItem from "../../components/TabItem";

import api from "../../services/api";

const INFORMATION = "INFORMATION";
const RAW_DATA = "RAW_DATA";

export default function UserView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [tab, setTab] = useState(INFORMATION);

  useEffect(() => {
    get();
  }, [id]);

  const get = async () => {
    try {
      const { data, ok } = await api.get(`/user/${id}`);
      if (!ok) return toast.error("Error fetching user");
      setUser(data);
    } catch (e) {
      console.log(e);
      toast.error("Error fetching user");
    }
  };

  if (!user) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <button onClick={() => navigate("/user")} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </button>
      </div>

      <nav className="flex items-center gap-2 pl-2">
        <TabItem tab={INFORMATION} title="Information" setTab={setTab} active={tab === INFORMATION} />
        <TabItem tab={RAW_DATA} title="Raw Data" setTab={setTab} active={tab === RAW_DATA} />
      </nav>
      <div className="bg-white rounded-md p-6 border border-gray-200 shadow-sm">
        {tab === INFORMATION && <Information user={user} setUser={setUser} />}
        {tab === RAW_DATA && <RawData user={user} />}
      </div>
    </div>
  );
}

function Information({ user, setUser }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(user);
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    setValues(user);
  }, [user]);

  const onUpdate = async () => {
    setBtnLoading(true);
    try {
      const { data, ok } = await api.put(`/user/${user._id}`, values);
      if (!ok) return toast.error("Error updating user");
      toast.success("Updated!");
      setUser(data);
    } catch (e) {
      console.log(e);
      toast.error("Error updating user");
    } finally {
      setBtnLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const { ok } = await api.remove(`/user/${user._id}`);
      if (!ok) return toast.error("Error deleting user");
      toast.success("Deleted!");
      navigate("/user");
    } catch (e) {
      console.log(e);
      toast.error("Error deleting user");
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input className="w-full" value={values.name || ""} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input className="w-full" value={values.email || ""} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select className="w-full" value={values.role || "user"} onChange={(e) => setValues({ ...values, role: e.target.value })}>
            <option value="user">User</option>
            <option value="client">Client</option>
          </select>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
          <input className="w-full bg-gray-100" value={values.last_login_at ? new Date(values.last_login_at).toLocaleString() : "Never"} disabled />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
          <input className="w-full bg-gray-100" value={values.created_at ? new Date(values.created_at).toLocaleString() : "—"} disabled />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
        <LoadingButton className="py-2 px-4 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800" loading={btnLoading} onClick={() => onUpdate()}>
          Update
        </LoadingButton>

        <button className="py-2 px-4 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function RawData({ user }) {
  return (
    <div className="bg-gray-50 p-4 rounded-md overflow-auto">
      <pre className="break-all whitespace-pre-wrap text-sm text-gray-800">{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
