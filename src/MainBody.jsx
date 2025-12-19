import React, { useEffect, useState, useRef } from "react";
import { DateTime } from "luxon";
import "./styles/mainbody.css";

/*
  APP BEHAVIOR SUMMARY
  --------------------
  ✔ Works only when app is ACTIVE or BACKGROUND
  ❌ Does NOT work if app is killed (Play Store safe)
  ✔ Female voice
  ✔ Multi-language support
  ✔ Minute-by-minute reminders
  ✔ Enforces 1-minute gap between reminders
  ✔ Ads must be hidden when isRinging === true
*/

function MainBody() {
  // ---------------- BASIC STATES ----------------
  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");
  const [medicineImage, setMedicineImage] = useState(null);

  // ---------------- TIME STATES ----------------
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");
  const [reminderDate, setReminderDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ---------------- UI STATES ----------------
  const [language, setLanguage] = useState("en-IN");
  const [isRinging, setIsRinging] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ---------------- SCHEDULE STORAGE ----------------
  const [scheduledReminders, setScheduledReminders] = useState(
    JSON.parse(localStorage.getItem("scheduledReminders") || "[]")
  );

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // ---------------- PERSIST STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("patientName", patientName);
  }, [patientName]);

  useEffect(() => {
    localStorage.setItem(
      "scheduledReminders",
      JSON.stringify(scheduledReminders)
    );
  }, [scheduledReminders]);

  // ---------------- IMAGE PICK ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setMedicineImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- BUILD TARGET TIME ----------------
  const buildTargetTime = () => {
    let hh = parseInt(hour, 10);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    const iso = `${reminderDate}T${String(hh).padStart(2, "0")}:${minute}`;
    return DateTime.fromISO(iso, { zone: "local" });
  };

  // ---------------- CONFLICT CHECK (1 MIN RULE) ----------------
  const isMinuteConflict = (millis) => {
    return scheduledReminders.some(
      (r) => Math.abs(r.triggerAt - millis) < 60_000
    );
  };

  const resolveConflictTime = (dateTime) => {
    let candidate = dateTime;
    while (isMinuteConflict(candidate.toMillis())) {
      candidate = candidate.plus({ minutes: 1 });
    }
    return candidate;
  };

  // ---------------- VOICE (FEMALE) ----------------
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    utter.rate = 0.9;
    utter.pitch = 1.2;

    const voices = window.speechSynthesis.getVoices();
    const female =
      voices.find(
        (v) =>
          v.lang.startsWith(language.split("-")[0]) &&
          /female|woman/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith(language.split("-")[0]));

    if (female) utter.voice = female;

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

    const text =
      language.startsWith("ta")
        ? "மருந்து எடுத்துக் கொள்ள நேரம் வந்துவிட்டது"
        : language.startsWith("hi")
        ? "दवा लेने का समय हो गया है"
        : `Time to take ${reminder.medicine}, dose ${reminder.dose}`;

    speak(text);

    if (document.visibilityState !== "visible" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Medicine Reminder", {
          body: `${reminder.medicine} – ${reminder.dose}`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  };

  // ---------------- ADD REMINDER ----------------
  const triggerReminder = () => {
    if (!medicineName) return;

    let target = buildTargetTime();

    if (target.toMillis() <= Date.now()) {
      alert("Please select a future time");
      return;
    }

    // ✅ Resolve 1-minute conflicts
    target = resolveConflictTime(target);

    const reminder = {
      id: Date.now(),
      medicine: medicineName,
      dose,
      image: medicineImage,
      triggerAt: target.toMillis(),
    };

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      showReminder(reminder);
    }, reminder.triggerAt - Date.now());

    setScheduledReminders((prev) => [...prev, reminder]);

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  // ---------------- MARK AS TAKEN ----------------
  const markAsTaken = () => {
    stopAlarm();
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
      <div className="time-row">
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

      <label>🗣 Voice language</label>
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

      {/* 🔔 ACTIVE REMINDER (ADS MUST NOT SHOW HERE) */}
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

          <p><b>{activeReminder.medicine}</b></p>
          <p>Dose: {activeReminder.dose}</p>

          <button onClick={markAsTaken} className="confirm-btn">
            ✅ Mark as Taken
          </button>
        </div>
      )}
    </main>
  );
}

export default MainBody;
