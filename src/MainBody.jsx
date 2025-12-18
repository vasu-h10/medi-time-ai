import { useEffect, useState, useRef } from "react";
import React from "react";
import "./styles/global.css";

function MainBody() {
  // ---------------- STATES ----------------
  const [activeReminder, setActiveReminder] = useState(null);

  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");
  const [medicineImage, setMedicineImage] = useState(null);

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );
  const [showHistory, setShowHistory] = useState(false);

  const [isRinging, setIsRinging] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ---------------- REFS ----------------
  const alarmRef = useRef(null);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("patientName", patientName);
  }, [history, patientName]);

  // ---------------- SYSTEM NOTIFICATION ----------------
  const showSystemNotification = (reminder) => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification("🔔 Medicine Reminder", {
        body: `${reminder.medicine} - ${reminder.dose}`,
        icon: "/icons/icon-192.png",
        image: reminder.image || undefined,
        badge: "/icons/icon-192.png",
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: "/" },
      });
    });
  };

  // ---------------- ALARM (APP OPEN ONLY) ----------------
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

  // ---------------- IMAGE PICK ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setMedicineImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- REMINDER ----------------
  const triggerReminder = () => {
    if (!medicineName) return;

    const reminder = {
      medicine: medicineName,
      dose,
      image: medicineImage,
    };

    // 🔔 System notification (closed / locked / background)
    showSystemNotification(reminder);

    // 📱 In-app UI + alarm (only if app is open)
    setActiveReminder(reminder);
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

      <select value={dose} onChange={(e) => setDose(e.target.value)}>
        <option>10 mg</option>
        <option>20 mg</option>
        <option>50 mg</option>
        <option>100 mg</option>
      </select>

      <input type="file" accept="image/*" onChange={onImagePick} />

      <button
        onClick={() => {
          setAddedSuccess(true);
          setTimeout(() => setAddedSuccess(false), 2000);
          triggerReminder();
        }}
        className="primary-btn"
      >
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
            {h.image && <img src={h.image} alt="Medicine" />}
            {h.takenAt && (
              <div className="taken-time">✅ Taken: {h.takenAt}</div>
            )}
          </div>
        ))}
    </main>
  );
}

export default MainBody;
