import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx (FINAL – Play Store Safe)
 * - Continuous loud voice until Taken
 * - Auto fallback to English if language not installed
 * - Disabled unavailable languages
 * - Clear UX (no confusion)
 */

export default function MainBody() {
  // ---------------- STATES ----------------
  const [patientName, setPatientName] = useState(
    typeof window !== "undefined" ? localStorage.getItem("patientName") || "" : ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [voices, setVoices] = useState([]);

  const [isRinging, setIsRinging] = useState(false);

  const speechIntervalRef = useRef(null);
  const alarmRef = useRef(null);

  const doses = ["10 mg", "20 mg", "50 mg", "100 mg"];
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  // ---------------- LOAD VOICES ----------------
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // ---------------- HELPERS ----------------
  const hasVoice = (lang) => voices.some(v => v.lang === lang);

  const getVoice = () => {
    return (
      voices.find(v => v.lang === voiceLang) ||
      voices.find(v => v.lang === "en-IN") ||
      voices[0]
    );
  };

  // ---------------- ALARM + SPEECH ----------------
  const startAlarm = (text) => {
    setIsRinging(true);

    alarmRef.current = new Audio("/alarm.mp3");
    alarmRef.current.loop = true;
    alarmRef.current.volume = 1;
    alarmRef.current.play().catch(() => {});

    const speak = () => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = getVoice();
      if (voice) u.voice = voice;
      u.rate = 1;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    };

    speak();
    speechIntervalRef.current = setInterval(speak, 4000); // 🔊 continuous
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    window.speechSynthesis.cancel();
    clearInterval(speechIntervalRef.current);
    setIsRinging(false);
  };

  // ---------------- TIME ----------------
  const getDelay = () => {
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const now = new Date();
    const t = new Date();
    t.setHours(h, parseInt(minute), 0, 0);
    if (t < now) t.setDate(t.getDate() + 1);
    return t - now;
  };

  // ---------------- ADD REMINDER ----------------
  const addReminder = () => {
    if (!patientName || !medicineName) {
      alert("Enter patient and medicine");
      return;
    }

    setTimeout(() => {
      startAlarm(`Mr ${patientName}, please take ${medicineName} ${dose}`);
    }, getDelay());

    alert("Reminder scheduled");
  };

  // ---------------- UI ----------------
  return (
    <main style={{ padding: 20 }}>
      <h2>🗣 Voice Language</h2>
      <select
        value={voiceLang}
        onChange={(e) => setVoiceLang(e.target.value)}
        style={{ width: "100%" }}
      >
        <option value="en-IN">English (Installed)</option>
        <option value="hi-IN" disabled={!hasVoice("hi-IN")}>
          Hindi {!hasVoice("hi-IN") && "(Install in phone settings)"}
        </option>
        <option value="te-IN" disabled={!hasVoice("te-IN")}>
          Telugu {!hasVoice("te-IN") && "(Install in phone settings)"}
        </option>
      </select>

      <h2>👤 Patient</h2>
      <input value={patientName} onChange={(e) => setPatientName(e.target.value)} style={{ width: "100%" }} />

      <h2>💊 Medicine</h2>
      <input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} style={{ width: "100%" }} />
      <select value={dose} onChange={(e) => setDose(e.target.value)} style={{ width: "100%" }}>
        {doses.map(d => <option key={d}>{d}</option>)}
      </select>

      <h2>⏰ Time</h2>
      <div style={{ display: "flex", gap: 10 }}>
        <select value={hour} onChange={(e) => setHour(e.target.value)}>{hours.map(h => <option key={h}>{h}</option>)}</select>
        <select value={minute} onChange={(e) => setMinute(e.target.value)}>{minutes.map(m => <option key={m}>{m}</option>)}</select>
        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}><option>AM</option><option>PM</option></select>
      </div>

      <button onClick={addReminder} style={{ marginTop: 15 }}>➕ Add Reminder</button>

      {isRinging && (
        <button onClick={stopAlarm} style={{ marginTop: 20, background: "green", color: "#fff", width: "100%", padding: 12 }}>
          ✅ Taken (Stop Alarm)
        </button>
      )}
    </main>
  );
}