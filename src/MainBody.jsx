import { useEffect, useState, useRef } from "react";
import "./styles/main.css";

function MainBody() {
  // ---------------- STATES ----------------
  const [activeReminder, setActiveReminder] = useState(null);

  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");
  const [medicineImage, setMedicineImage] = useState(null);

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [voices, setVoices] = useState([]);

  const [isRinging, setIsRinging] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ---------------- REFS ----------------
  const alarmRef = useRef(null);
  const stopSpeechRef = useRef(null);
  const reminderTimerRef = useRef(null);

  // ---------------- CONSTANTS ----------------
  const doses = ["10 mg", "20 mg", "50 mg", "100 mg", "250 mg", "500 mg"];
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // ---------------- HELPERS ----------------
  const formatDateTime = (ts) =>
    new Date(ts).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    alarmRef.current = a;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
  };

  // ---------------- REMINDER ----------------
  const triggerReminder = () => {
    setActiveReminder({
      medicine: medicineName,
      dose,
      image: medicineImage,
    });
    setIsRinging(true);
    playAlarm();
  };

  const markAsTaken = () => {
    stopAlarm();
    setHistory((h) => [
      {
        id: Date.now(),
        medicine: activeReminder.medicine,
        dose: activeReminder.dose,
        image: activeReminder.image,
        takenAt: new Date().toLocaleString(),
      },
      ...h,
    ]);
    setIsRinging(false);
    setActiveReminder(null);
  };

  // ---------------- UI ----------------
  return (
    <main className="app">
      <h2>💊 Medicine Reminder</h2>

      <input
        placeholder="Patient name"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
      />

      <input
        placeholder="Medicine name"
        value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)}
      />

      <input type="file" accept="image/*" />

      <button onClick={triggerReminder} className="primary-btn">
        {addedSuccess ? "✅ Reminder Added" : "➕ Add Reminder"}
      </button>

      {isRinging && activeReminder && (
        <div className="active-reminder">
          <h3>🔔 Medicine Reminder</h3>

          {activeReminder.image && (
            <img
              src={activeReminder.image}
              alt="Medicine"
              className="reminder-image"
            />
          )}

          <p>
            💊 <b>{activeReminder.medicine}</b>
          </p>
          <p>Dose: {activeReminder.dose}</p>

          <button onClick={markAsTaken} className="confirm-btn">
            ✅ Mark as Taken
          </button>
        </div>
      )}

      <hr />

      <h2>📜 History</h2>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide" : "👁 Show"}
      </button>

      {showHistory &&
        history.map((h) => (
          <div key={h.id} className="history-item">
            <strong>{h.medicine}</strong> — {h.dose}
            {h.image && <img src={h.image} />}
            {h.takenAt && (
              <div className="taken-time">✅ Taken: {h.takenAt}</div>
            )}
          </div>
        ))}
    </main>
  );
}

export default MainBody;