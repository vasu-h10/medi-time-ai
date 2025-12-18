import React, { useEffect, useState, useRef } from "react";
import "./styles/mainbody.css";

/* MainBody */
function MainBody() {
  // ---------------- STATES ----------------
  const [activeReminder, setActiveReminder] = useState(null);

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

  const [isRinging, setIsRinging] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // ---------------- REFS ----------------
  const alarmRef = useRef(null);
  const timerRef = useRef(null);

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
        badge: "/icons/icon-192.png",
        requireInteraction: true,
        vibrate: [300, 150, 300],
        silent: false,
        data: { url: "/" },
      });
    });
  };

  // ---------------- AUDIO UNLOCK (MANDATORY) ----------------
  const enableAudio = () => {
    if (audioEnabled) return;

    const a = new Audio("/alarm.mp3");
    a.volume = 0;
    a.play()
      .then(() => {
        a.pause();
        setAudioEnabled(true);
      })
      .catch(() => {});
  };

  // ---------------- VOICE ----------------
  const speakReminder = (text) => {
    if (!("speechSynthesis" in window)) return;

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-IN";
    msg.rate = 0.9;
    msg.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    if (!audioEnabled) return;

    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    alarmRef.current = a;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
    window.speechSynthesis?.cancel();
  };

  // ---------------- IMAGE PICK ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setMedicineImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- SCHEDULING ----------------
  const scheduleReminder = (reminder) => {
    let hh = parseInt(hour);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    let target = new Date();

    if (reminderType === "specific") {
      target = new Date(`${reminderDate}T${hh.toString().padStart(2, "0")}:${minute}`);
    } else {
      target.setHours(hh, parseInt(minute), 0, 0);
      if (target < new Date()) target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - Date.now();
    if (delay < 0) return;

    timerRef.current = setTimeout(() => {
      showSystemNotification(reminder);
      setActiveReminder(reminder);
      setIsRinging(true);
      playAlarm();
      speakReminder(`Time to take ${reminder.medicine}, dose ${reminder.dose}`);

      if (reminderType === "everyday") {
        setInterval(() => showSystemNotification(reminder), 86400000);
      }
    }, delay);
  };

  // ---------------- ADD REMINDER ----------------
  const triggerReminder = () => {
    if (!medicineName) return;

    enableAudio(); // 🔓 unlock audio on user tap

    const reminder = {
      medicine: medicineName,
      dose,
      image: medicineImage,
      time: `${hour}:${minute} ${ampm}`,
      type: reminderType,
      date: reminderDate,
    };

    scheduleReminder(reminder);

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const markAsTaken = () => {
    stopAlarm();
    clearTimeout(timerRef.current);

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

      <label>⏰ Reminder time</label>
      <div style={{ display: "flex", gap: "8px" }}>
        <select value={hour} onChange={(e) => setHour(e.target.value)}>
          {[...Array(12)].map((_, i) => {
            const h = String(i + 1).padStart(2, "0");
            return <option key={h}>{h}</option>;
          })}
        </select>

        <select value={minute} onChange={(e) => setMinute(e.target.value)}>
          {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>

      <label>🔁 Reminder type</label>
      <select value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
        <option value="once">Once</option>
        <option value="everyday">Every day</option>
        <option value="specific">Specific date</option>
      </select>

      {reminderType === "specific" && (
        <>
          <label>📅 Select date</label>
          <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
        </>
      )}

      <input type="file" accept="image/*" onChange={onImagePick} />

      <button onClick={triggerReminder} className="primary-btn">
        {addedSuccess ? "✅ Reminder Added" : "➕ Add Reminder"}
      </button>

      {isRinging && activeReminder && (
        <div className="active-reminder">
          <h3>🔔 Medicine Reminder</h3>
          {activeReminder.image && (
            <img src={activeReminder.image} alt="Medicine" className="reminder-image" />
          )}
          <p><b>{activeReminder.medicine}</b></p>
          <p>Dose: {activeReminder.dose}</p>
          <button onClick={markAsTaken} className="confirm-btn">✅ Mark as Taken</button>
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
            <div className="taken-time">✅ Taken: {h.takenAt}</div>
          </div>
        ))}
    </main>
  );
}

export default MainBody;