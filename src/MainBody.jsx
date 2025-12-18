import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import "./styles/mainbody.css";

/* MainBody */
function MainBody() {
  // ---------------- STATES ----------------
  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");
  const [medicineImage, setMedicineImage] = useState(null);

  // ⏰ Scheduling
  const [reminderType, setReminderType] = useState("once");

  // 🕒 12-hour time
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [reminderDate, setReminderDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );
  const [showHistory, setShowHistory] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("patientName", patientName);
  }, [history, patientName]);

  // ---------------- IMAGE PICK ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setMedicineImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- TIME → UTC ----------------
  const buildTriggerAt = () => {
    let hh = parseInt(hour, 10);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    const iso = `${reminderDate}T${String(hh).padStart(2, "0")}:${minute}`;

    return DateTime.fromISO(iso, { zone: "local" })
      .toUTC()
      .toMillis();
  };

  // ---------------- ADD REMINDER ----------------
  const triggerReminder = async () => {
    if (!medicineName) return;

    const triggerAt = buildTriggerAt();

    const reminder = {
      medicine: medicineName,
      dose,
      image: medicineImage,
      triggerAt,
      repeat: reminderType,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // ⛔ NO local timers here
    // ✅ This object must be saved to Firestore (next step)

    console.log("Reminder ready for server:", reminder);

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
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

      <select value={dose} onChange={(e) => setDose(e.target.value)}>
        <option>10 mg</option>
        <option>20 mg</option>
        <option>50 mg</option>
        <option>100 mg</option>
      </select>

      <label>⏰ Reminder time</label>
      <div style={{ display: "flex", gap: "8px" }}>
        <select value={hour} onChange={(e) => setHour(e.target.value)}>
          {[...Array(12)].map((_, i) => {
            const h = String(i + 1).padStart(2, "0");
            return <option key={h}>{h}</option>;
          })}
        </select>

        <select value={minute} onChange={(e) => setMinute(e.target.value)}>
          {[...Array(60)].map((_, i) => {
            const m = String(i).padStart(2, "0");
            return <option key={m}>{m}</option>;
          })}
        </select>

        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>

      <label>🔁 Reminder type</label>
      <select
        value={reminderType}
        onChange={(e) => setReminderType(e.target.value)}
      >
        <option value="once">Once</option>
        <option value="everyday">Every day</option>
        <option value="specific">Specific date</option>
      </select>

      {reminderType === "specific" && (
        <>
          <label>📅 Select date</label>
          <input
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
          />
        </>
      )}

      <input type="file" accept="image/*" onChange={onImagePick} />

      <button onClick={triggerReminder} className="primary-btn">
        {addedSuccess ? "✅ Reminder Added" : "➕ Add Reminder"}
      </button>

      <hr />

      <h2>📜 History</h2>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide" : "👁 Show"}
      </button>

      {showHistory &&
        history.map((h) => (
          <div key={h.id} className="history-item">
            <strong>{h.medicine}</strong> — {h.dose}
            {h.image && <img src={h.image} alt="Medicine" />}
            <div className="taken-time">✅ Taken: {h.takenAt}</div>
          </div>
        ))}
    </main>
  );
}

export default MainBody;