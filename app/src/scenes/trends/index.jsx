import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js"
import toast from "react-hot-toast"
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
  const [filterOptions, setFilterOptions] = useState({
    parties: [],
    nuances: [],
    candidates: [],
    cities: [],
    election_types: []
  })

  // Filters state
  const [selectedElectionTypes, setSelectedElectionTypes] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedParties, setSelectedParties] = useState([])
  const [selectedNuances, setSelectedNuances] = useState([])
  const [selectedCandidates, setSelectedCandidates] = useState([])
  const [level, setLevel] = useState("national")
  const [city, setCity] = useState("")
  const [groupBy, setGroupBy] = useState("nuance")

  const [chartData, setChartData] = useState(null)

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions()
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
        election_types: selectedElectionTypes.length > 0 ? selectedElectionTypes.map(e => e.value) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        parties: selectedParties.length > 0 ? selectedParties.map(p => p.value) : undefined,
        nuances: selectedNuances.length > 0 ? selectedNuances.map(n => n.value) : undefined,
        candidates: selectedCandidates.length > 0 ? selectedCandidates.map(c => c.value) : undefined,
        level: level || undefined,
        city: city || undefined,
        group_by: groupBy
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
      const key = item._id[groupBy]
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
        groupedData[key].polls.push({ date, value: item.avg_value })
      } else {
        groupedData[key].results.push({ date, value: item.avg_value })
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
      const color = groupBy === "nuance" ? POLITICAL_COLORS[key] || "#808080" : POLITICAL_COLORS[groupedData[key].nuance] || "#808080"

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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tendances Politiques</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtres</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Election Types */}
          <div>
            <label className="block text-sm font-medium mb-2">Types d'élection</label>
            <MultiSelect
              id="election-types"
              options={filterOptions.election_types.map(type => ({ value: type, label: type }))}
              values={selectedElectionTypes}
              onSelectedChange={setSelectedElectionTypes}
              placeholder="Tous les types"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Date de début</label>
            <input type="date" className="w-full border rounded-md p-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <label className="block text-sm font-medium mb-2 mt-2">Date de fin</label>
            <input type="date" className="w-full border rounded-md p-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          {/* Group By */}
          <div>
            <label className="block text-sm font-medium mb-2">Grouper par</label>
            <select className="w-full border rounded-md p-2" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="nuance">Nuance</option>
              <option value="party">Parti</option>
              <option value="candidate_name">Candidat</option>
            </select>
          </div>

          {/* Nuances */}
          {groupBy === "nuance" && (
            <div>
              <label className="block text-sm font-medium mb-2">Nuances</label>
              <MultiSelect
                id="nuances"
                options={filterOptions.nuances.map(nuance => ({ value: nuance, label: nuance }))}
                values={selectedNuances}
                onSelectedChange={setSelectedNuances}
                placeholder="Toutes les nuances"
              />
            </div>
          )}

          {/* Parties */}
          {groupBy === "party" && (
            <div>
              <label className="block text-sm font-medium mb-2">Partis</label>
              <MultiSelect
                id="parties"
                options={filterOptions.parties.map(party => ({ value: party, label: party }))}
                values={selectedParties}
                onSelectedChange={setSelectedParties}
                placeholder="Tous les partis"
              />
            </div>
          )}

          {/* Candidates */}
          {groupBy === "candidate_name" && (
            <div>
              <label className="block text-sm font-medium mb-2">Candidats</label>
              <MultiSelect
                id="candidates"
                options={filterOptions.candidates.map(candidate => ({ value: candidate, label: candidate }))}
                values={selectedCandidates}
                onSelectedChange={setSelectedCandidates}
                placeholder="Tous les candidats"
              />
            </div>
          )}

          {/* Location Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Niveau géographique</label>
            <select className="w-full border rounded-md p-2" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="national">National</option>
              <option value="municipal">Municipal</option>
            </select>
          </div>

          {/* City */}
          {level === "municipal" && (
            <div>
              <label className="block text-sm font-medium mb-2">Ville</label>
              <select className="w-full border rounded-md p-2" value={city} onChange={e => setCity(e.target.value)}>
                <option value="">-- Sélectionner une ville --</option>
                {filterOptions.cities.map(cityName => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button onClick={fetchChartData} disabled={loading} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? "Chargement..." : "Afficher le graphique"}
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Petits points = Sondages</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span>Gros points = Résultats officiels</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm mt-2">
          {Object.entries(POLITICAL_COLORS).map(([nuance, color]) => (
            <div key={nuance} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
              <span>{nuance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {!chartData && !loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Sélectionnez des filtres et cliquez sur "Afficher le graphique" pour voir les tendances</div>
      )}
    </div>
  )
}
