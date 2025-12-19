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
  const [showHistory, setShowHistory] = useState(false);

  // ---------------- STORAGE ----------------
  const [scheduledReminders, setScheduledReminders] = useState(
    JSON.parse(localStorage.getItem("scheduledReminders") || "[]")
  );
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );

  const timerRef = useRef(null);
  const repeatVoiceRef = useRef(null);
  const audioRef = useRef(null);

  // ---------------- PERSIST ----------------
  useEffect(() => {
    localStorage.setItem("patientName", patientName);
  }, [patientName]);

  useEffect(() => {
    localStorage.setItem("scheduledReminders", JSON.stringify(scheduledReminders));
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
    scheduledReminders.some((r) => Math.abs(r.triggerAt - millis) < 60000);

  const resolveConflictTime = (dt) => {
    let candidate = dt;
    while (isMinuteConflict(candidate.toMillis())) {
      candidate = candidate.plus({ minutes: 1 });
    }
    return candidate;
  };

  // ---------------- VOICE MESSAGE ----------------
  const buildVoiceMessage = (r) => {
    const name = patientName || "Patient";
    const med = r.medicine;
    const d = r.dose ? ` dose ${r.dose}` : "";

    switch (true) {
      case language.startsWith("hi"):
        return `मिस्टर ${name}, यह ${med} लेने का समय है। कृपया तुरंत लें।`;
      case language.startsWith("ta"):
        return `${name}, இது ${med} மருந்து எடுத்துக்கொள்ள நேரம். தயவுசெய்து உடனே எடுத்துக்கொள்ளுங்கள்.`;
      case language.startsWith("te"):
        return `${name}, ఇది ${med} మందు తీసుకునే సమయం. దయచేసి వెంటనే తీసుకోండి.`;
      case language.startsWith("kn"):
        return `${name}, ಇದು ${med} ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ. ದಯವಿಟ್ಟು ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ.`;
      case language.startsWith("ml"):
        return `${name}, ഇത് ${med} മരുന്ന് കഴിക്കുന്ന സമയമാണ്. ദയവായി ഉടൻ കഴിക്കുക.`;
      case language.startsWith("mr"):
        return `${name}, हे ${med} घेण्याची वेळ झाली आहे. कृपया त्वरित घ्या.`;
      case language.startsWith("bn"):
        return `${name}, এটি ${med} নেওয়ার সময়। অনুগ্রহ করে এখনই নিন।`;
      case language.startsWith("gu"):
        return `${name}, આ ${med} લેવાનો સમય છે. કૃપા કરીને તરત લો.`;
      default:
        return `Mister ${name}, this is ${med} taking time${d}. Please take it immediately.`;
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language;
    u.rate = 0.9;
    u.pitch = 1.2;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    audioRef.current = a;
  };

  const stopAll = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    clearInterval(repeatVoiceRef.current);
    window.speechSynthesis.cancel();
  };

  // ---------------- SHOW REMINDER ----------------
  const showReminder = (r) => {
    setActiveReminder(r);
    setIsRinging(true);
    playAlarm();

    const msg = buildVoiceMessage(r);
    speak(msg);

    repeatVoiceRef.current = setInterval(() => {
      speak(msg);
    }, 30000); // repeat every 30 sec
  };

  // ---------------- ADD REMINDER ----------------
  const triggerReminder = () => {
    if (!medicineName) return;

    let target = buildTargetTime();
    const now = Date.now();
const diff = target.toMillis() - now;

// Allow reminders from NEXT MINUTE onwards
if (diff < 60_000) {
  alert("Please select a time at least 1 minute from now");
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
    stopAll();
    setIsRinging(false);

    setHistory((h) => [
      { ...activeReminder, takenAt: new Date().toLocaleString() },
      ...h,
    ]);

    setActiveReminder(null);
  };

  const deleteHistory = (id) =>
    setHistory((h) => h.filter((i) => i.id !== id));

  // ---------------- UI ----------------
  return (
    <main className="app">
      <h2>💊 Medicine Reminder</h2>

      <input placeholder="Patient name" value={patientName}
        onChange={(e) => setPatientName(e.target.value)} />

      <input placeholder="Medicine name" value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)} />

      <select value={dose} onChange={(e) => setDose(e.target.value)}>
        <option>10 mg</option>
        <option>20 mg</option>
        <option>50 mg</option>
        <option>100 mg</option>
      </select>

      <label>⏰ Time</label>
      <div className="time-row">
        <select value={hour} onChange={(e) => setHour(e.target.value)}>
          {[...Array(12)].map((_, i) =>
            <option key={i}>{String(i + 1).padStart(2, "0")}</option>)}
        </select>

        <select value={minute} onChange={(e) => setMinute(e.target.value)}>
          {[...Array(60)].map((_, i) =>
            <option key={i}>{String(i).padStart(2, "0")}</option>)}
        </select>

        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
          <option>AM</option><option>PM</option>
        </select>
      </div>

      <label>🗣 Voice</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en-IN">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="ta-IN">Tamil</option>
        <option value="te-IN">Telugu</option>
        <option value="kn-IN">Kannada</option>
        <option value="ml-IN">Malayalam</option>
        <option value="mr-IN">Marathi</option>
        <option value="bn-IN">Bengali</option>
        <option value="gu-IN">Gujarati</option>
      </select>

      <label>📅 Date</label>
      <input type="date" value={reminderDate}
        onChange={(e) => setReminderDate(e.target.value)} />

      <input type="file" accept="image/*" onChange={onImagePick} />

      <button onClick={triggerReminder} className="primary-btn">
        {addedSuccess ? "✅ Reminder Added" : "➕ Add Reminder"}
      </button>

      {isRinging && activeReminder && (
        <div className="active-reminder">
          {activeReminder.image
            ? <img src={activeReminder.image} className="reminder-image" />
            : <div className="image-placeholder">⬜</div>}
          <p><b>{activeReminder.medicine}</b></p>
          <p>Dose: {activeReminder.dose}</p>
          <button onClick={markAsTaken} className="confirm-btn">
            ✅ Mark as Taken
          </button>
        </div>
      )}

      <hr />
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide History" : "👁 Show History"}
      </button>

      {showHistory && history.map((h) => (
        <div key={h.id} className="history-item">
          {h.image
            ? <img src={h.image} />
            : <div className="image-placeholder small">⬜</div>}
          <div className="history-content">
            <strong>{h.medicine}</strong>
            <div className="taken-time">{h.takenAt}</div>
          </div>
          <button className="delete-btn" onClick={() => deleteHistory(h.id)}>❌</button>
        </div>
      ))}

      {!isRinging && <div className="ad-box"><small>Advertisement</small></div>}
    </main>
  );
}

export default MainBody;
