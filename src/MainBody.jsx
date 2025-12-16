import { useEffect, useState, useRef } from "react";

export default function MainBody() {
  // ---------------- STATE ----------------
  const [patientName, setPatientName] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");
  const [medicineImage, setMedicineImage] = useState(null);

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("history")) || [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  const [isRinging, setIsRinging] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const alarmRef = useRef(null);

  // ---------------- CONSTANTS ----------------
  const doses = ["5 mg", "10 mg", "20 mg", "50 mg", "100 mg"];
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
  }, [history]);

  // ---------------- IMAGE PICK ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setMedicineImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- TIME ----------------
  const getReminderTimestamp = () => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const t = new Date();
    t.setHours(h, parseInt(minute, 10), 0, 0);
    if (t < new Date()) t.setDate(t.getDate() + 1);
    return t.getTime();
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    stopAlarm();
    const a = new Audio("/alarm.mp3"); // must exist in /public
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    alarmRef.current = a;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
  };

  // ---------------- REMINDER CORE ----------------
  const triggerReminder = () => {
    setIsRinging(true);
    playAlarm();

    if ("speechSynthesis" in window && document.visibilityState === "visible") {
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(
        `Hello ${patientName || "there"}. It is time to take your medicine.`
      );
      u.lang = "en-IN";
      u.rate = 0.95;
      u.pitch = 1;

      window.speechSynthesis.speak(u);
    }
  };

  const markAsTaken = () => {
    stopAlarm();
    window.speechSynthesis?.cancel();
    setIsRinging(false);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 Alert Confirmed", {
        body: "Yes, I’m alert!",
        icon: "/icons/icon-192.png",
      });
    }
  };

  // ---------------- NOTIFICATION ----------------
  const scheduleNotification = (time) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const delay = time - Date.now();
    if (delay <= 0) return;

    setTimeout(() => {
      new Notification("🔔 Medicine Reminder", {
        body: "Tap to open the reminder",
        icon: "/icons/icon-192.png",
      });

      // Upgrade to alarm + voice ONLY if app is open
      if (document.visibilityState === "visible") {
        triggerReminder();
      }
    }, delay);
  };

  // ---------------- ADD REMINDER ----------------
  const addReminder = () => {
    const time = getReminderTimestamp();

    // unlock audio (browser rule)
    try {
      new Audio().play().catch(() => {});
      window.speechSynthesis?.cancel();
    } catch {}

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);

    scheduleNotification(time);

    setHistory((h) => [
      {
        id: Date.now(),
        medicine: medicineName,
        dose,
        time,
        image: medicineImage,
      },
      ...h,
    ]);

    setMedicineImage(null);
  };

  // ---------------- UI ----------------
  return (
    <main style={{ padding: 20 }}>
      <h2>👤 Patient</h2>
      <input value={patientName} onChange={(e) => setPatientName(e.target.value)} />

      <h2>💊 Medicine</h2>
      <input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />

      <select value={dose} onChange={(e) => setDose(e.target.value)}>
        {doses.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <input type="file" accept="image/*" onChange={onImagePick} />

      {medicineImage && (
        <img src={medicineImage} alt="Medicine" style={{ width: 120, marginTop: 8 }} />
      )}

      <h2>⏰ Time</h2>
      <select value={hour} onChange={(e) => setHour(e.target.value)}>
        {hours.map((h) => (
          <option key={h}>{h}</option>
        ))}
      </select>

      <select value={minute} onChange={(e) => setMinute(e.target.value)}>
        {minutes.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
        <option>AM</option>
        <option>PM</option>
      </select>

      <button onClick={addReminder}>
        {addedSuccess ? "☑ Reminder Added" : "➕ Add Reminder"}
      </button>

      {isRinging && (
        <button
          onClick={markAsTaken}
          style={{ marginTop: 20, width: "100%", background: "green", color: "#fff", padding: 14 }}
        >
          ✅ Mark as Taken
        </button>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h2>📜 History</h2>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide History" : "👁 Show History"}
      </button>

      {showHistory &&
        history.map((h) => (
          <div key={h.id} style={{ padding: 8 }}>
            💊 <strong>{h.medicine}</strong> — {h.dose}
            <br />
            ⏰ {new Date(h.time).toLocaleString()}
            {h.image && <img src={h.image} style={{ width: 60, marginTop: 6 }} />}
          </div>
        ))}

      <div style={{ marginTop: 32, padding: 16, background: "#f8fafc", borderRadius: 10 }}>
        <small>Advertisement</small>
        <div style={{ height: 64, background: "#e5e7eb", marginTop: 8 }}>
          Ad will appear here
        </div>
      </div>
    </main>
  );
}