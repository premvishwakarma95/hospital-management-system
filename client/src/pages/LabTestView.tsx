import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, FlaskConical, Calendar, User as UserIcon, Receipt, Download } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, LabTest, LabTestStatus, Patient } from "../types";
import { labTestService } from "../services/labTestService";
import { extractErrorMessage, formatDate, statusColor, statusLabel } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const nextActions: { status: LabTestStatus; label: string; color: string }[] = [
  { status: "sample_collected", label: "Mark Sample Collected", color: "bg-blue-600 hover:bg-blue-700" },
  { status: "in_progress", label: "Mark In Progress", color: "bg-amber-600 hover:bg-amber-700" },
  { status: "completed", label: "Mark Completed", color: "bg-green-600 hover:bg-green-700" },
  { status: "cancelled", label: "Cancel", color: "bg-red-600 hover:bg-red-700" },
];

const LabTestView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [t, setT] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultText, setResultText] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await labTestService.get(id);
      setT(data);
      setResultText(data.resultText || "");
      setResultUrl(data.resultUrl || "");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const canUpdate = user && ["admin", "lab_tech", "doctor"].includes(user.role);

  const updateStatus = async (status: LabTestStatus) => {
    if (!id) return;
    try {
      await labTestService.update(id, { status });
      toast.success(`Marked as ${status.replace("_", " ")}`);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const saveResults = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await labTestService.update(id, {
        resultText,
        resultUrl,
        status: "completed",
      });
      toast.success("Results saved");
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }
  if (!t) {
    return <div className="text-center py-12 text-gray-500">Lab test not found.</div>;
  }

  const patient = t.patient as Patient;
  const doctor = t.orderedBy as Doctor;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.testName}</h2>
            <p className="text-gray-600">Ordered on {formatDate(t.createdAt)}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(t.status)}`}>
          {statusLabel(t.status)}
        </span>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Test Info</div>
              <div className="font-semibold">{t.testCategory}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Cost: </span><span className="font-medium">₹{t.cost}</span></div>
            <div><span className="text-gray-500">Priority: </span><span className={`font-medium ${t.priority === "urgent" ? "text-red-600" : ""}`}>{t.priority}</span></div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
              <UserIcon size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Patient & Doctor</div>
              <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            Ordered by Dr. {doctor.firstName} {doctor.lastName}
          </div>
          <Link to={`/patients/${patient._id}`} className="text-sm text-primary-600 hover:underline mt-1 inline-block">
            View patient →
          </Link>
        </div>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Ordered</div>
            <div>{formatDate(t.createdAt)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Sample Collected</div>
            <div>{t.sampleCollectedAt ? formatDate(t.sampleCollectedAt) : "—"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Receipt size={20} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Completed</div>
            <div>{t.completedAt ? formatDate(t.completedAt) : "—"}</div>
          </div>
        </div>
      </div>

      {t.notes && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-2">Order Notes</h4>
          <p className="text-sm text-gray-700">{t.notes}</p>
        </div>
      )}

      {canUpdate && t.status !== "completed" && t.status !== "cancelled" && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
          <div className="flex flex-wrap gap-2">
            {nextActions
              .filter((a) => a.status !== t.status)
              .map((a) => (
                <button
                  key={a.status}
                  onClick={() => updateStatus(a.status)}
                  className={`btn text-white ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {canUpdate && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-3">Test Results</h4>
          <div className="space-y-3">
            <div>
              <label className="label">Result / Findings</label>
              <textarea
                rows={6}
                className="input font-mono"
                placeholder="Enter the test results / readings..."
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Result File URL (optional)</label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com/report.pdf"
                value={resultUrl}
                onChange={(e) => setResultUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload the report file to a service like Google Drive / Dropbox and paste the shareable link here.
              </p>
            </div>
            <button onClick={saveResults} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save & Mark Completed
            </button>
          </div>
        </div>
      )}

      {!canUpdate && t.resultText && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-2">Results</h4>
          <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
            {t.resultText}
          </pre>
          {t.resultUrl && (
            <a
              href={t.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:underline text-sm"
            >
              <Download size={14} /> View report file
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default LabTestView;
