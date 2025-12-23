import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

import Loader from "../../components/Loader";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

import api from "../../services/api";

export default function UserList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState();
  const [filter, setFilter] = useState({
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState();
  const handleNextPage = () => setCurrentPage((prev) => prev + 1);
  const handlePreviousPage = () => setCurrentPage((prev) => prev - 1);

  useEffect(() => {
    getUsers();
    setCurrentPage(1);
  }, [filter, location]);

  useEffect(() => {
    getUsers();
  }, [currentPage]);

  const getUsers = async () => {
    try {
      const { data, ok, total } = await api.post("/user/search", {
        search: filter.search,
        page: currentPage,
        per_page: 10,
      });
      if (!ok) return toast.error("Error fetching users");
      setUsers(data);
      setTotal(total);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching users");
    }
  };

  if (!users) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-6 w-full justify-between">
          <SearchBar search={filter.search} setFilter={setFilter} />
          <div className="text-sm text-gray-600 whitespace-nowrap flex items-center">
            Total: <span className="font-semibold font-mono text-gray-900 ml-1">{total || 0}</span> users
          </div>
        </div>
      </div>

      <div className="flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border shadow-md rounded-lg bg-white">
              <table className="min-w-[600px] w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-xs lg:text-sm text-gray-700">Name</th>
                    <th className="p-3 text-left font-medium text-xs lg:text-sm text-gray-700">Email</th>
                    <th className="p-3 text-left font-medium text-xs lg:text-sm text-gray-700">Role</th>
                    <th className="p-3 text-left font-medium text-xs lg:text-sm text-gray-700">Last Login</th>
                    <th className="p-3 text-left font-medium text-xs lg:text-sm text-gray-700">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user, i) => (
                      <tr key={i} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate(`/user/${user._id}`)}>
                        <td className="p-3 text-xs lg:text-sm text-gray-900 font-medium">{user.name || "—"}</td>
                        <td className="p-3 text-xs lg:text-sm text-gray-700">{user.email}</td>
                        <td className="p-3 text-xs lg:text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "client" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="p-3 text-xs lg:text-sm text-gray-700">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}</td>
                        <td className="p-3 text-xs lg:text-sm text-gray-700">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))
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
