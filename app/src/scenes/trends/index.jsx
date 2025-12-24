import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js"
import toast from "react-hot-toast"
import { HiChevronDown, HiChevronUp } from "react-icons/hi2"
import api from "@/services/api"
import MultiSelect from "@/components/MultiSelect"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// Political colors mapping
const POLITICAL_COLORS = {
  "Extreme gauche": "#8B0000", // Dark red
  Gauche: "#FF6B6B", // Light red
  Centre: "#FFD700", // Yellow
  Droite: "#87CEEB", // Light blue
  "Extreme droite": "#00008B", // Dark blue
  Autre: "#808080" // Gray
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

  // Single filters state object
  const [filters, setFilters] = useState({
    selectedElectionTypes: [],
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

  // Helper function to update filters
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Fetch filter options on mount
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
    // Group data by the selected groupBy field
    const groupedData = {}

    data.forEach(item => {
      const key = filters.groupBy === "nuance" ? item._id.nuance : item._id[filters.groupBy]
      const date = new Date(item._id.date).toLocaleDateString("fr-FR")
      const type = item._id.type
      const nuance = item._id.nuance

      if (!groupedData[key]) {
        groupedData[key] = {
          polls: [],
          results: [],
          nuance: nuance
        }
      }

      if (type === "poll") {
        groupedData[key].polls.push({ date, value: item.sum_value })
      } else {
        groupedData[key].results.push({ date, value: item.sum_value })
      }
    })

    // Get all unique dates and sort them
    const allDates = new Set()
    Object.values(groupedData).forEach(group => {
      group.polls.forEach(p => allDates.add(p.date))
      group.results.forEach(r => allDates.add(r.date))
    })
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a.split("/").reverse().join("-")) - new Date(b.split("/").reverse().join("-")))

    // Find max value for Y axis
    let maxValue = 0
    Object.values(groupedData).forEach(group => {
      group.polls.forEach(p => {
        if (p.value > maxValue) maxValue = p.value
      })
      group.results.forEach(r => {
        if (r.value > maxValue) maxValue = r.value
      })
    })

    // Create datasets
    const datasets = []

    Object.keys(groupedData).forEach(key => {
      const color = filters.groupBy === "nuance" ? POLITICAL_COLORS[key] || "#808080" : POLITICAL_COLORS[groupedData[key].nuance] || "#808080"

      // Combine polls and results in one continuous line
      const combinedData = sortedDates.map(date => {
        const poll = groupedData[key].polls.find(p => p.date === date)
        const result = groupedData[key].results.find(r => r.date === date)
        return result ? result.value : poll ? poll.value : null
      })

      // Identify which points are results (for bigger markers)
      const pointRadius = sortedDates.map(date => {
        const result = groupedData[key].results.find(r => r.date === date)
        return result ? 8 : 3
      })

      const pointBorderWidth = sortedDates.map(date => {
        const result = groupedData[key].results.find(r => r.date === date)
        return result ? 3 : 1
      })

      datasets.push({
        label: key,
        data: combinedData,
        borderColor: color,
        backgroundColor: color,
        pointBackgroundColor: color,
        pointBorderColor: "#ffffff",
        pointRadius: pointRadius,
        pointBorderWidth: pointBorderWidth,
        tension: 0.3,
        borderWidth: 2
      })
    })

    setChartData({
      labels: sortedDates,
      datasets
    })
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top"
      },
      title: {
        display: true,
        text: "Tendances Politiques - Sondages et Résultats",
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartData ? Math.ceil(Math.max(...chartData.datasets.flatMap(d => d.data.filter(v => v !== null))) * 1.1) : 100,
        ticks: {
          callback: function (value) {
            return value + "%"
          }
        }
      }
    },
    interaction: {
      mode: "index",
      intersect: false
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Filters on the right */}
      <div className="flex items-center justify-end gap-3 mb-4">
        {/* Main Filters */}
        <div className="w-56">
          <MultiSelect
            id="election-types"
            options={filterOptions.election_types.map(type => ({ value: type, label: type }))}
            values={filters.selectedElectionTypes}
            onSelectedChange={value => updateFilter("selectedElectionTypes", value)}
            placeholder="Types d'élection"
          />
        </div>

        <div className="w-44">
          <select className="w-full border rounded-md p-2 text-sm" value={filters.groupBy} onChange={e => updateFilter("groupBy", e.target.value)}>
            <option value="nuance">Par nuance</option>
            <option value="party">Par parti</option>
            <option value="candidate_name">Par candidat</option>
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-md hover:bg-blue-50 whitespace-nowrap"
        >
          {showAdvancedFilters ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          Filtres
        </button>

        {/* Apply button */}
        <button
          onClick={fetchChartData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm whitespace-nowrap"
        >
          {loading ? "..." : "Afficher"}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium mb-1">Date début</label>
              <input type="date" className="w-full border rounded-md p-1.5 text-xs" value={filters.startDate} onChange={e => updateFilter("startDate", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Date fin</label>
              <input type="date" className="w-full border rounded-md p-1.5 text-xs" value={filters.endDate} onChange={e => updateFilter("endDate", e.target.value)} />
            </div>

            {/* Nuances */}
            {filters.groupBy === "nuance" && (
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Nuances</label>
                <MultiSelect
                  id="nuances"
                  options={filterOptions.nuances.map(nuance => ({ value: nuance, label: nuance }))}
                  values={filters.selectedNuances}
                  onSelectedChange={value => updateFilter("selectedNuances", value)}
                  placeholder="Toutes"
                />
              </div>
            )}

            {/* Parties */}
            {filters.groupBy === "party" && (
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Partis</label>
                <MultiSelect
                  id="parties"
                  options={filterOptions.parties.map(party => ({ value: party, label: party }))}
                  values={filters.selectedParties}
                  onSelectedChange={value => updateFilter("selectedParties", value)}
                  placeholder="Tous"
                />
              </div>
            )}

            {/* Candidates */}
            {filters.groupBy === "candidate_name" && (
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Candidats</label>
                <MultiSelect
                  id="candidates"
                  options={filterOptions.candidates.map(candidate => ({ value: candidate, label: candidate }))}
                  values={filters.selectedCandidates}
                  onSelectedChange={value => updateFilter("selectedCandidates", value)}
                  placeholder="Tous"
                />
              </div>
            )}

            {/* Location Level */}
            <div>
              <label className="block text-xs font-medium mb-1">Géographie</label>
              <select className="w-full border rounded-md p-1.5 text-xs" value={filters.level} onChange={e => updateFilter("level", e.target.value)}>
                <option value="national">National</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>

            {/* City */}
            {filters.level === "municipal" && (
              <div>
                <label className="block text-xs font-medium mb-1">Ville</label>
                <select className="w-full border rounded-md p-1.5 text-xs" value={filters.city} onChange={e => updateFilter("city", e.target.value)}>
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

      {/* Legend - compact inline */}
      <div className="bg-white rounded-lg shadow px-4 py-2 mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>Sondages</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Résultats officiels</span>
          </div>
          {Object.entries(POLITICAL_COLORS).map(([nuance, color]) => (
            <div key={nuance} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
              <span>{nuance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart - takes remaining space */}
      {chartData && (
        <div className="bg-white rounded-lg shadow p-6 flex-1 min-h-0">
          <div className="h-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {!chartData && !loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 flex-1">Sélectionnez des filtres et cliquez sur "Afficher" pour voir les tendances</div>
      )}
    </div>
  )
}
