import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Loader2, TrendingUp, Activity, Award, PieChart as PieIcon, Download } from "lucide-react";
import toast from "react-hot-toast";
import {
  reportsService, RevenuePoint, SpecializationPoint, TopDoctor, LabTestStat,
} from "../services/reportsService";
import { extractErrorMessage, statusLabel } from "../lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const downloadCsv = <T extends object>(filename: string, rows: T[]) => {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = (r as Record<string, unknown>)[h];
        const s = v == null ? "" : String(v);
        return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [range, setRange] = useState(30);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [topDoctors, setTopDoctors] = useState<TopDoctor[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationPoint[]>([]);
  const [labStats, setLabStats] = useState<LabTestStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rev, top, specs, labs] = await Promise.all([
        reportsService.revenue(range),
        reportsService.topDoctors(),
        reportsService.specializations(),
        reportsService.labTests(),
      ]);
      setRevenue(rev);
      setTopDoctors(top);
      setSpecializations(specs);
      setLabStats(labs);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalBilled = revenue.reduce((s, r) => s + r.billed, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Insights across hospital operations</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[7, 30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                range === d ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp size={16} /> Revenue Collected
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-gray-500">Last {range} days</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity size={16} /> Total Billed
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ₹{totalBilled.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-gray-500">
            Outstanding: ₹{(totalBilled - totalRevenue).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award size={16} /> Top Doctor (month)
          </div>
          <div className="text-lg font-bold text-gray-900 mt-1 truncate">
            {topDoctors[0] ? `Dr. ${topDoctors[0].name}` : "—"}
          </div>
          <div className="text-xs text-gray-500">
            {topDoctors[0] ? `${topDoctors[0].appointments} appointments · ${topDoctors[0].specialization}` : "No data yet"}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} /> Revenue Trend
          </h3>
          <button
            onClick={() => downloadCsv(`revenue-${range}d.csv`, revenue)}
            disabled={revenue.length === 0}
            className="btn-secondary !py-1.5 !px-3 text-xs"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
        {revenue.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No revenue data in this range.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
              <Legend />
              <Line type="monotone" dataKey="billed" stroke="#8b5cf6" strokeWidth={2} name="Billed" />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Collected" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award size={18} /> Top Doctors (This Month)
            </h3>
            <button
              onClick={() => downloadCsv("top-doctors.csv", topDoctors)}
              disabled={topDoctors.length === 0}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              <Download size={14} /> CSV
            </button>
          </div>
          {topDoctors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No appointments this month.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topDoctors.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="appointments" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PieIcon size={18} /> Specialization Breakdown
            </h3>
            <button
              onClick={() => downloadCsv("specializations.csv", specializations)}
              disabled={specializations.length === 0}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              <Download size={14} /> CSV
            </button>
          </div>
          {specializations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No specialization data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={specializations}
                  dataKey="count"
                  nameKey="specialization"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {specializations.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Lab Tests by Status</h3>
        {labStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No lab tests yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {labStats.map((s, idx) => (
              <div key={s.status} className="p-4 rounded-lg border border-gray-200">
                <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <div className="text-xs text-gray-500 uppercase">{statusLabel(s.status)}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{s.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Doctor Performance Table</h3>
        </div>
        {topDoctors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-2 px-2 font-medium">Rank</th>
                  <th className="py-2 px-2 font-medium">Doctor</th>
                  <th className="py-2 px-2 font-medium">Specialization</th>
                  <th className="py-2 px-2 font-medium text-right">Appointments</th>
                  <th className="py-2 px-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topDoctors.map((d, idx) => (
                  <tr key={d.doctorId} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-gray-500 font-mono">#{idx + 1}</td>
                    <td className="py-2 px-2 font-medium">Dr. {d.name}</td>
                    <td className="py-2 px-2 text-gray-600">{d.specialization}</td>
                    <td className="py-2 px-2 text-right font-medium">{d.appointments}</td>
                    <td className="py-2 px-2 text-right font-medium">₹{d.revenue.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
