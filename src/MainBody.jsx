import { useEffect, useState, useRef } from "react";

export default function MainBody() {
  const [patientName, setPatientName] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [isRinging, setIsRinging] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const alarmRef = useRef(null);

  const doses = ["5 mg","10 mg","20 mg","50 mg","100 mg"];
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const getReminderTimestamp = () => {
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const t = new Date();
    t.setHours(h, parseInt(minute), 0, 0);
    if (t < new Date()) t.setDate(t.getDate() + 1);
    return t.getTime();
  };

  const playAlarm = () => {
    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.play().catch(() => {});
    alarmRef.current = a;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
  };

  const triggerReminder = () => {
    setIsRinging(true);
    playAlarm();
  };

  const markAsTaken = () => {
    stopAlarm();
    setIsRinging(false);
  };

  const addReminder = () => {
    const time = getReminderTimestamp();

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);

    setTimeout(triggerReminder, time - Date.now());

    setHistory(h => [
      { id: Date.now(), medicine: medicineName, dose, time },
      ...h,
    ]);
  };

  // ✅ SINGLE RETURN — THIS IS CRITICAL
  return (
    <main style={{ padding: 20 }}>

      <h2>👤 Patient</h2>
      <input value={patientName} onChange={e => setPatientName(e.target.value)} />

      <h2>💊 Medicine</h2>
      <input value={medicineName} onChange={e => setMedicineName(e.target.value)} />

      <select value={dose} onChange={e => setDose(e.target.value)}>
        {doses.map(d => <option key={d}>{d}</option>)}
      </select>

      <h2>⏰ Time</h2>
      <select value={hour} onChange={e => setHour(e.target.value)}>
        {hours.map(h => <option key={h}>{h}</option>)}
      </select>

      <select value={minute} onChange={e => setMinute(e.target.value)}>
        {minutes.map(m => <option key={m}>{m}</option>)}
      </select>

      <select value={ampm} onChange={e => setAmPm(e.target.value)}>
        <option>AM</option>
        <option>PM</option>
      </select>

      <button onClick={addReminder}>
        {addedSuccess ? "☑ Reminder Added" : "➕ Add Reminder"}
      </button>

      {isRinging && (
        <button
          onClick={markAsTaken}
          style={{ marginTop: 20, background: "green", color: "#fff", padding: 14 }}
        >
          ✅ Mark as Taken
        </button>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h2>📜 History</h2>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide History" : "👁 Show History"}
      </button>

      {showHistory && history.map(h => (
        <div key={h.id} style={{ padding: 8 }}>
          💊 {h.medicine} — {h.dose}
          <br />
          ⏰ {new Date(h.time).toLocaleString()}
        </div>
      ))}

      <div style={{ marginTop: 32, background: "#f1f5f9", padding: 16 }}>
        <small>Advertisement</small>
        <div style={{ height: 60, background: "#e5e7eb", marginTop: 8 }}>
          Ad will appear here
        </div>
      </div>

    </main>
  );
}