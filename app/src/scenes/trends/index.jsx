import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from "chart.js"
import "chartjs-adapter-date-fns"
import { fr } from "date-fns/locale"
import toast from "react-hot-toast"
import { HiChevronDown, HiChevronUp, HiAdjustmentsHorizontal } from "react-icons/hi2"
import api from "@/services/api"
import MultiSelect from "@/components/MultiSelect"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale)

// Political colors mapping
const POLITICAL_COLORS = {
  "Extreme gauche": "#8B0000",
  Gauche: "#FF6B6B",
  Centre: "#FFD700",
  Droite: "#87CEEB",
  "Extreme droite": "#00008B",
  Autre: "#808080"
}

export default function TrendsChart() {
  const [loading, setLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    parties: [],
    nuances: [],
    candidates: [],
    cities: [],
    election_types: []
  })

  const [filters, setFilters] = useState({
    selectedElectionTypes: [],
    selectedTours: [{ value: 1, label: "1er tour" }],
    startDate: "",
    endDate: "",
    selectedParties: [],
    selectedNuances: [],
    selectedCandidates: [],
    level: "national",
    city: "",
    groupBy: "nuance"
  })

  const [chartData, setChartData] = useState(null)

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    fetchFilterOptions()
    fetchChartData()
  }, [])

  async function fetchFilterOptions() {
    try {
      const { ok, data } = await api.get("/datapoint/filters")
      if (!ok) throw new Error("Erreur lors du chargement des options de filtres")
      setFilterOptions(data)
    } catch (error) {
      console.error("Error fetching filter options:", error)
      toast.error(error.message)
    }
  }

  async function fetchChartData() {
    setLoading(true)
    try {
      const body = {
        election_types: filters.selectedElectionTypes.length > 0 ? filters.selectedElectionTypes.map(e => e.value) : undefined,
        tours: filters.selectedTours.length > 0 ? filters.selectedTours.map(t => t.value) : undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        parties: filters.selectedParties.length > 0 ? filters.selectedParties.map(p => p.value) : undefined,
        nuances: filters.selectedNuances.length > 0 ? filters.selectedNuances.map(n => n.value) : undefined,
        candidates: filters.selectedCandidates.length > 0 ? filters.selectedCandidates.map(c => c.value) : undefined,
        level: filters.level || undefined,
        city: filters.city || undefined,
        group_by: filters.groupBy
      }

      const { ok, data } = await api.post("/datapoint/search", body)

      if (!ok) throw new Error("Erreur lors du chargement des données")
      processChartData(data)
    } catch (error) {
      console.error("Error fetching chart data:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  function processChartData(data) {
    const groupedData = {}

    data.forEach(item => {
      let key = filters.groupBy === "nuance" ? item._id.nuance : item._id[filters.groupBy]
      if (Array.isArray(key)) key = key.join(", ")
      // Store raw date string (ISO) for Chart.js time scale parsing
      const date = item._id.date
      const type = item._id.type
      const nuance = item._id.nuance

      if (!groupedData[key]) {
        groupedData[key] = []
      }

      groupedData[key].push({
        x: date,
        y: item.sum_result_pourcentage_exprime,
        type: type,
        nuance: nuance // Store nuance for color fallback
      })
    })

    const datasets = []

    Object.keys(groupedData).forEach(key => {
      // Color logic:
      // 1. If grouped by nuance, use POLITICAL_COLORS directly
      // 2. If grouped by something else, try to find the nuance of the first data point
      // 3. Fallback to grey
      let color = "#808080"
      if (filters.groupBy === "nuance") {
        color = POLITICAL_COLORS[key] || "#808080"
      } else {
        // Find the nuance from the first data point that has a nuance
        const firstPointWithNuance = groupedData[key].find(p => p.nuance)
        if (firstPointWithNuance && POLITICAL_COLORS[firstPointWithNuance.nuance]) {
          color = POLITICAL_COLORS[firstPointWithNuance.nuance]
        }
      }

      // Sort data by date
      const dataPoints = groupedData[key].sort((a, b) => new Date(a.x) - new Date(b.x))

      datasets.push({
        label: key,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color,
        pointBackgroundColor: color,
        pointBorderColor: "#ffffff",
        pointRadius: ctx => {
          const point = ctx.raw
          if (!point) return 0
          return point.type === "result" ? 6 : 0
        },
        pointHoverRadius: ctx => {
          const point = ctx.raw
          if (!point) return 0
          return point.type === "result" ? 8 : 4
        },
        pointBorderWidth: 2,
        tension: 0.3,
        borderWidth: 2,
        spanGaps: true
      })
    })

    setChartData({
      datasets
    })
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 12,
            family: "Inter, system-ui, sans-serif"
          },
          padding: 15,
          boxWidth: 40
        }
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const point = context.raw
            const typeLabel = point.type === "result" ? "Résultat" : "Sondage"
            return `${context.dataset.label} (${typeLabel}): ${context.parsed.y.toFixed(2)}%`
          }
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartData ? Math.ceil(Math.max(...chartData.datasets.flatMap(d => d.data.map(v => v.y))) * 1.1) : 100,
        ticks: {
          callback: function (value) {
            return value + "%"
          },
          font: {
            size: 11
          }
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)"
        }
      },
      x: {
        type: "time",
        time: {
          unit: "month",
          displayFormats: {
            month: "MMM yyyy"
          },
          tooltipFormat: "dd MMMM yyyy"
        },
        adapters: {
          date: {
            locale: fr
          }
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false
    }
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 flex-shrink-0">
          {/* Main Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* First group - Election filters */}
            <div className="w-48">
              <MultiSelect
                id="election-types"
                options={filterOptions.election_types.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))}
                values={filters.selectedElectionTypes}
                onSelectedChange={value => updateFilter("selectedElectionTypes", value)}
                placeholder="Types d'élection"
              />
            </div>

            <div className="w-40">
              <MultiSelect
                id="tours"
                options={[
                  { value: 1, label: "1er tour" },
                  { value: 2, label: "2ème tour" }
                ]}
                values={filters.selectedTours}
                onSelectedChange={value => updateFilter("selectedTours", value)}
                placeholder="Tous les tours"
              />
            </div>

            {/* Spacer */}
            <div className="hidden lg:block flex-1"></div>

            {/* Second group - Display options and actions */}
            <div className="w-44">
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.groupBy}
                onChange={e => updateFilter("groupBy", e.target.value)}
              >
                <option value="nuance">Par nuance</option>
                <option value="party">Par parti</option>
                <option value="candidate_name">Par candidat</option>
              </select>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <HiAdjustmentsHorizontal className="h-5 w-5" />
              Filtres
              {showAdvancedFilters ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
            </button>

            <button
              onClick={fetchChartData}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 font-medium text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap"
            >
              {loading ? "Chargement..." : "Afficher"}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.startDate}
                    onChange={e => updateFilter("startDate", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.endDate}
                    onChange={e => updateFilter("endDate", e.target.value)}
                  />
                </div>

                {filters.groupBy !== "nuance" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nuances</label>
                    <MultiSelect
                      id="nuances"
                      options={filterOptions.nuances.map(nuance => ({ value: nuance, label: nuance }))}
                      values={filters.selectedNuances}
                      onSelectedChange={value => updateFilter("selectedNuances", value)}
                      placeholder="Toutes les nuances"
                    />
                  </div>
                )}

                {filters.groupBy !== "party" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partis</label>
                    <MultiSelect
                      id="parties"
                      options={filterOptions.parties.map(party => ({ value: party, label: party }))}
                      values={filters.selectedParties}
                      onSelectedChange={value => updateFilter("selectedParties", value)}
                      placeholder="Tous les partis"
                    />
                  </div>
                )}

                {filters.groupBy !== "candidate_name" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Candidats</label>
                    <MultiSelect
                      id="candidates"
                      options={filterOptions.candidates.map(candidate => ({ value: candidate, label: candidate }))}
                      values={filters.selectedCandidates}
                      onSelectedChange={value => updateFilter("selectedCandidates", value)}
                      placeholder="Tous les candidats"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Géographie</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.level}
                    onChange={e => updateFilter("level", e.target.value)}
                  >
                    <option value="national">National</option>
                    <option value="municipal">Municipal</option>
                  </select>
                </div>

                {filters.level === "municipal" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.city}
                      onChange={e => updateFilter("city", e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      {filterOptions.cities.map(cityName => (
                        <option key={cityName} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-lg px-6 py-4 mb-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500 border-2 border-white"></div>
              <span className="text-gray-700 font-medium">Sondages</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white"></div>
              <span className="text-gray-700 font-medium">Résultats officiels</span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            {Object.entries(POLITICAL_COLORS).map(([nuance, color]) => (
              <div key={nuance} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                <span className="text-gray-700">{nuance}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        {chartData && (
          <div className="bg-white rounded-xl shadow-lg p-6 flex-1 min-h-0">
            <div className="h-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {!chartData && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center flex-1 flex items-center justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiAdjustmentsHorizontal className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune donnée à afficher</h3>
              <p className="text-gray-600">Sélectionnez des filtres et cliquez sur "Afficher" pour visualiser les tendances</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center flex-1 flex items-center justify-center">
            <div>
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement des données...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
