import { useEffect, useState, useRef } from "react";

export default function MainBody() {
  // ---------------- STATE ----------------
  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [isRinging, setIsRinging] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ✅ MISSING STATES (CAUSE OF BLANK SCREEN)
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );
  const [showHistory, setShowHistory] = useState(false);

  const alarmRef = useRef(null);

  // ---------------- CONSTANTS ----------------
  const doses = ["5 mg","10 mg","20 mg","50 mg","100 mg","250 mg","500 mg"];
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // ---------------- PERMISSION ----------------
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("patientName", patientName);
  }, [history, patientName]);

  // ---------------- TIME ----------------
  const getReminderTimestamp = () => {
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const t = new Date();
    t.setHours(h, parseInt(minute), 0, 0);
    if (t < new Date()) t.setDate(t.getDate() + 1);
    return t.getTime();
  };

  // ---------------- NOTIFICATION ----------------
  const schedulePreNotification = (time) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const delay = time - Date.now() - 5 * 60 * 1000;
    if (delay <= 0) return;

    setTimeout(() => {
      new Notification("🔔 Reminder Alert", {
        body: "5 minutes remaining",
        icon: "/icons/icon-192.png",
      });
    }, delay);
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const audio = new Audio("/alarm.mp3");
    audio.loop = true;
    audio.play().catch(() => {});
    alarmRef.current = audio;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
  };

  const triggerReminder = () => {
    setIsRinging(true);
    playAlarm();

    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(
        `Hello ${patientName}. It is time to take your medicine.`
      );
      window.speechSynthesis.speak(u);
    }
  };

  const markAsTaken = () => {
    stopAlarm();
    window.speechSynthesis?.cancel();

    if (Notification.permission === "granted") {
      new Notification("🔔 Alert Confirmed", {
        body: "Yes, I’m alert!",
        icon: "/icons/icon-192.png",
      });
    }

    setIsRinging(false);
  };

  // ---------------- ADD REMINDER ----------------
  const addReminder = () => {
    const time = getReminderTimestamp();

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);

    schedulePreNotification(time);

    setTimeout(triggerReminder, time - Date.now());

    // ✅ SAVE TO HISTORY
    setHistory(h => [
      {
        id: Date.now(),
        medicine: medicineName,
        dose,
        time,
      },
      ...h,
    ]);
  };

  // ---------------- UI ----------------
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
          style={{
            marginTop: 20,
            width: "100%",
            background: "green",
            color: "#fff",
            padding: 14,
          }}
        >
          ✅ Mark as Taken
        </button>
      )}
return (
  <main style={{ padding: 20 }}>

    {/* ---------- HISTORY ---------- */}
    <hr style={{ margin: "24px 0" }} />

    <h2>📜 History</h2>

    <button onClick={() => setShowHistory(!showHistory)}>
      {showHistory ? "🙈 Hide History" : "👁 Show History"}
    </button>

    {showHistory && (
      <div style={{ marginTop: 12 }}>
        {history.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No reminders yet</p>
        ) : (
          history.map(h => (
            <div
              key={h.id}
              style={{
                padding: 10,
                marginBottom: 8,
                borderRadius: 6,
                background: "#f8fafc",
                fontSize: 14,
              }}
            >
              💊 <strong>{h.medicine}</strong> — {h.dose}
              <br />
              ⏰ {h.time ? new Date(h.time).toLocaleString() : "—"}
            </div>
          ))
        )}
      </div>
    )}

    {/* ---------- ADVERTISEMENT ---------- */}
    <div
      style={{
        marginTop: 32,
        padding: 16,
        background: "#f1f5f9",
        textAlign: "center",
        borderRadius: 8,
      }}
    >
      <small style={{ opacity: 0.7 }}>Advertisement</small>

      <div
        style={{
          height: 60,
          marginTop: 8,
          background: "#e5e7eb",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: "#555",
        }}
      >
        Ad will appear here
      </div>
    </div>

  </main>
);
