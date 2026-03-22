import React, { useEffect, useState, useRef } from "react";
import { DateTime } from "luxon";
import "./styles/mainbody.css";

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
  const [language, setLanguage] = useState("te-IN"); // Telugu default 😉
  const [isRinging, setIsRinging] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ---------------- STORAGE ----------------
  const [scheduledReminders, setScheduledReminders] = useState(
    JSON.parse(localStorage.getItem("scheduledReminders") || "[]")
  );
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );

  const audioRef = useRef(null);
  const speakingRef = useRef(false);

  // ---------------- PERSIST ----------------
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

  // ---------------- RESTORE ----------------
  useEffect(() => {
    scheduledReminders.forEach((r) => {
      const delay = r.triggerAt - Date.now();
      if (delay > 0) {
        setTimeout(() => showReminder(r), delay);
      }
    });
  }, []);

  // ---------------- IMAGE ----------------
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
    return DateTime.fromISO(iso);
  };

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
  const buildVoiceMessage = (r) => {
    const name = patientName || "Patient";
    return `${name}, ${r.medicine} ${r.dose} తీసుకునే సమయం వచ్చింది. వెంటనే తీసుకోండి.`;
  };

  const speakContinuously = (text) => {
    if (!window.speechSynthesis) return;

    speakingRef.current = true;

    const speakOnce = () => {
      if (!speakingRef.current) return;

      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;

      u.onend = () => {
        if (speakingRef.current) setTimeout(speakOnce, 200);
      };

      window.speechSynthesis.speak(u);
    };

    window.speechSynthesis.cancel();
    speakOnce();
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.play().catch(() => {});
    audioRef.current = a;
  };

  const stopAll = () => {
    speakingRef.current = false;
    audioRef.current?.pause();
    window.speechSynthesis.cancel();
  };

  // ---------------- SHOW ----------------
  const showReminder = (r) => {
    setActiveReminder(r);
    setIsRinging(true);
    playAlarm();
    speakContinuously(buildVoiceMessage(r));
  };

  // ---------------- ADD ----------------
  const triggerReminder = () => {
    if (!medicineName) return;

    let target = buildTargetTime();
    const now = DateTime.local();

    if (target <= now) {
      target = now.plus({ minutes: 1 }).startOf("minute");
    }

    target = resolveConflictTime(target);

    const reminder = {
      id: Date.now(),
      medicine: medicineName,
      dose,
      image: medicineImage,
      triggerAt: target.toMillis(),
    };

    setTimeout(() => showReminder(reminder), reminder.triggerAt - Date.now());
    setScheduledReminders((p) => [...p, reminder]);

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  // ---------------- TAKEN ----------------
  const markAsTaken = () => {
    stopAll();
    setIsRinging(false);

    setHistory((h) => [
      { ...activeReminder, takenAt: new Date().toLocaleString() },
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

      {/* HEADER */}
      <h1 className="title">💊 MediTime</h1>

      {/* PATIENT */}
      <input
        className="input"
        placeholder="👤 Patient Name"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
      />

      {/* MEDICINE */}
      <input
        className="input"
        placeholder="💊 Medicine Name"
        value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)}
      />

      <select className="input" value={dose} onChange={(e) => setDose(e.target.value)}>
        <option>10 mg</option>
        <option>20 mg</option>
        <option>50 mg</option>
        <option>100 mg</option>
      </select>

      {/* TIME */}
      <div className="card">
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
      </div>

      {/* DATE */}
      <input
        className="input"
        type="date"
        value={reminderDate}
        onChange={(e) => setReminderDate(e.target.value)}
      />

      {/* IMAGE */}
      <input type="file" accept="image/*" onChange={onImagePick} />

      {/* ADD BUTTON */}
      <button onClick={triggerReminder} className="primary-btn">
        {addedSuccess ? "✅ Added!" : "➕ Add Reminder"}
      </button>

      {/* ACTIVE REMINDER */}
      {isRinging && activeReminder && (
        <div className="alarm-screen">
          <h2>🔔 Time to take medicine!</h2>
          <p>{activeReminder.medicine}</p>
          <p>{activeReminder.dose}</p>

          <button onClick={markAsTaken} className="confirm-btn">
            ✅ Taken
          </button>
        </div>
      )}

      {/* HISTORY */}
      <button onClick={() => setShowHistory(!showHistory)} className="secondary-btn">
        📜 History
      </button>

      {showHistory &&
        history.map((h) => (
          <div key={h.id} className="history-item">
            <strong>{h.medicine}</strong>
            <div>{h.takenAt}</div>
            <button onClick={() => deleteHistory(h.id)}>❌</button>
          </div>
        ))}

    </main>
  );
}

export default MainBody;