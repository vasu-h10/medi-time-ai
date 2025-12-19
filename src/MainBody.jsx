import React, { useEffect, useState, useRef } from "react";
import { DateTime } from "luxon";
import "./styles/mainbody.css";

/*
  SAFE APP MODE
  - Works only when app is active / background
  - No killed-app notifications
  - Ads hidden during ringing
*/

function MainBody() {
  // ---------------- BASIC ----------------
  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");
  const [medicineImage, setMedicineImage] = useState(null);

  // ---------------- TIME ----------------
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");
  const [reminderDate, setReminderDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ---------------- UI ----------------
  const [language, setLanguage] = useState("en-IN");
  const [isRinging, setIsRinging] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ---------------- STORAGE ----------------
  const [scheduledReminders, setScheduledReminders] = useState(
    JSON.parse(localStorage.getItem("scheduledReminders") || "[]")
  );

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("patientName", patientName);
  }, [patientName]);

  useEffect(() => {
    localStorage.setItem(
      "scheduledReminders",
      JSON.stringify(scheduledReminders)
    );
    localStorage.setItem("history", JSON.stringify(history));
  }, [scheduledReminders, history]);

  // ---------------- IMAGE PICK ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMedicineImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- TIME BUILD ----------------
  const buildTargetTime = () => {
    let hh = parseInt(hour, 10);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    const iso = `${reminderDate}T${String(hh).padStart(2, "0")}:${minute}`;
    return DateTime.fromISO(iso, { zone: "local" });
  };

  // ---------------- CONFLICT (1 MIN GAP) ----------------
  const isMinuteConflict = (millis) =>
    scheduledReminders.some(
      (r) => Math.abs(r.triggerAt - millis) < 60000
    );

  const resolveConflictTime = (dt) => {
    let candidate = dt;
    while (isMinuteConflict(candidate.toMillis())) {
      candidate = candidate.plus({ minutes: 1 });
    }
    return candidate;
  };

  // ---------------- VOICE ----------------
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    utter.rate = 0.9;
    utter.pitch = 1.2;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    audioRef.current = a;
  };

  const stopAlarm = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis.cancel();
  };

  // ---------------- SHOW REMINDER ----------------
  const showReminder = (reminder) => {
    setActiveReminder(reminder);
    setIsRinging(true);
    playAlarm();

    const msg =
      language.startsWith("hi")
        ? "दवा लेने का समय हो गया है"
        : language.startsWith("ta")
        ? "மருந்து எடுத்துக்கொள்ள நேரம்"
        : `Time to take ${reminder.medicine}`;

    speak(msg);
  };

  // ---------------- ADD REMINDER ----------------
  const triggerReminder = () => {
    if (!medicineName) return;

    let target = buildTargetTime();
    if (target.toMillis() <= Date.now()) {
      alert("Select a future time");
      return;
    }

    target = resolveConflictTime(target);

    const reminder = {
      id: Date.now(),
      medicine: medicineName,
      dose,
      image: medicineImage,
      triggerAt: target.toMillis(),
    };

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => showReminder(reminder),
      reminder.triggerAt - Date.now()
    );

    setScheduledReminders((p) => [...p, reminder]);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  // ---------------- MARK AS TAKEN ----------------
  const markAsTaken = () => {
    stopAlarm();
    setIsRinging(false);

    setHistory((h) => [
      {
        ...activeReminder,
        takenAt: new Date().toLocaleString(),
      },
      ...h,
    ]);

    setActiveReminder(null);
  };

  const deleteHistory = (id) => {
    setHistory((h) => h.filter((i) => i.id !== id));
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

      <label>⏰ Time</label>
      <div className="time-row">
        <select value={hour} onChange={(e) => setHour(e.target.value)}>
          {[...Array(12)].map((_, i) => (
            <option key={i}>{String(i + 1).padStart(2, "0")}</option>
          ))}
        </select>

        <select value={minute} onChange={(e) => setMinute(e.target.value)}>
          {[...Array(60)].map((_, i) => (
            <option key={i}>{String(i).padStart(2, "0")}</option>
          ))}
        </select>

        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>

      <label>🗣 Voice</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en-IN">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="ta-IN">Tamil</option>
        <option value="te-IN">Telugu</option>
      </select>

      <label>📅 Date</label>
      <input
        type="date"
        value={reminderDate}
        onChange={(e) => setReminderDate(e.target.value)}
      />

      <input type="file" accept="image/*" onChange={onImagePick} />

      <button onClick={triggerReminder} className="primary-btn">
        {addedSuccess ? "✅ Reminder Added" : "➕ Add Reminder"}
      </button>

      {/* 🔔 ACTIVE REMINDER */}
      {isRinging && activeReminder && (
        <div className="active-reminder">
          <div className="image-box">
            {activeReminder.image ? (
              <img
                src={activeReminder.image}
                alt="Medicine"
                className="reminder-image"
              />
            ) : (
              <div className="image-placeholder">⬜</div>
            )}
          </div>

          <p><b>{activeReminder.medicine}</b></p>
          <p>Dose: {activeReminder.dose}</p>

          <button onClick={markAsTaken} className="confirm-btn">
            ✅ Mark as Taken
          </button>
        </div>
      )}

      {/* 📜 HISTORY */}
      <h3>📜 History</h3>
      {history.map((h) => (
        <div key={h.id} className="history-item">
          <div className="history-row">
            {h.image ? (
              <img src={h.image} alt="Medicine" />
            ) : (
              <div className="image-placeholder small">⬜</div>
            )}
            <div>
              <strong>{h.medicine}</strong>
              <div className="taken-time">{h.takenAt}</div>
            </div>
            <button onClick={() => deleteHistory(h.id)}>❌</button>
          </div>
        </div>
      ))}

      {/* 📢 AD (HIDDEN WHILE RINGING) */}
      {!isRinging && (
        <div className="ad-box">
          {/* Ad network placeholder */}
          <small>Advertisement</small>
        </div>
      )}
    </main>
  );
}

export default MainBody;
