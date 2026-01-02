import { useState, useEffect } from "react"
import { HiCalendar, HiUsers, HiChartBar, HiCheckCircle } from "react-icons/hi2"
import toast from "react-hot-toast"
import api from "@/services/api"

export default function Elections() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchElections()
  }, [])

  async function fetchElections() {
    setLoading(true)
    try {
      const { ok, data } = await api.get("/election")
      if (!ok) throw new Error("Erreur lors du chargement des élections")
      setElections(data.sort((a, b) => b.year - a.year))
    } catch (error) {
      console.error("Error fetching elections:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  function formatNumber(num) {
    return new Intl.NumberFormat("fr-FR").format(num)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Élections Présidentielles</h1>
          <p className="text-gray-600">Vue d'ensemble des élections présidentielles françaises</p>
        </div>

        {/* Elections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {elections.map(election => (
            <div key={election.election_id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">{election.year}</h2>
                  <HiCheckCircle className="h-8 w-8" />
                </div>
                <p className="text-blue-100 mt-1 capitalize">{election.election_type}</p>
              </div>

              {/* Body Card */}
              <div className="p-6 space-y-4">
                {/* Tour 1 */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">1er TOUR</div>
                    <span className="text-sm text-gray-500">{formatDate(election.tour_1.date)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-start gap-2">
                      <HiUsers className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Inscrits</p>
                        <p className="text-sm font-semibold text-gray-800">{formatNumber(election.tour_1.inscrits_amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <HiChartBar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Participation</p>
                        <p className="text-sm font-semibold text-gray-800">{election.tour_1.votants_pourcentage_inscrits.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <HiChartBar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Abstention</p>
                        <p className="text-sm font-semibold text-gray-800">{election.tour_1.abstentions_pourcentage_inscrits.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <HiChartBar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Blancs/Nuls</p>
                        <p className="text-sm font-semibold text-gray-800">{election.tour_1.blancs_pourcentage_inscrits.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tour 2 */}
                {election.tour_2 && (
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">2ème TOUR</div>
                      <span className="text-sm text-gray-500">{formatDate(election.tour_2.date)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="flex items-start gap-2">
                        <HiUsers className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Inscrits</p>
                          <p className="text-sm font-semibold text-gray-800">{formatNumber(election.tour_2.inscrits_amount)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <HiChartBar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Participation</p>
                          <p className="text-sm font-semibold text-gray-800">{election.tour_2.votants_pourcentage_inscrits.toFixed(2)}%</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <HiChartBar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Abstention</p>
                          <p className="text-sm font-semibold text-gray-800">{election.tour_2.abstentions_pourcentage_inscrits.toFixed(2)}%</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <HiChartBar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Blancs/Nuls</p>
                          <p className="text-sm font-semibold text-gray-800">{election.tour_2.blancs_pourcentage_inscrits.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {elections.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune élection disponible</p>
          </div>
        )}
      </div>
    </div>
  )
}
