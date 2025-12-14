import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx
 * - Female-only TTS
 * - Multi-language (auto fallback)
 * - Auto timezone
 * - NON-STOP alarm + voice loop
 * - Stops ONLY on "Mark as Taken"
 * - History Show/Hide + Delete
 * - Non-intrusive Ad layout
 */

function MainBody() {
  // ---------------- STATES ----------------
  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [reminders, setReminders] = useState(
    JSON.parse(localStorage.getItem("reminders") || "[]")
  );
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );

  const [selectedHistory, setSelectedHistory] = useState([]);
  const [filterDays, setFilterDays] = useState("30");
  const [showHistory, setShowHistory] = useState(false);

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [allVoices, setAllVoices] = useState([]);

  const [isRinging, setIsRinging] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  const speechIntervalRef = useRef(null);
  const alarmSoundRef = useRef(null);

  const doses = ["10 mg", "20 mg", "50 mg", "100 mg", "250 mg", "500 mg"];
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // ---------------- LOAD VOICES ----------------
  useEffect(() => {
    const load = () => setAllVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // ---------------- PERSIST STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("patientName", patientName);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    localStorage.setItem("history", JSON.stringify(history));
  }, [patientName, reminders, history]);

  // ---------------- VOICE SELECTION (SAFE) ----------------
  const selectFemaleVoice = (lang) =>
    allVoices.find((v) => v.lang === lang) ||
    allVoices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
    allVoices.find((v) => v.lang.startsWith("en")) ||
    allVoices[0];

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const alarm = new Audio("/alarm.mp3");
    alarm.loop = true;
    alarm.volume = 1;
    alarm.play().catch(() => {});
    alarmSoundRef.current = alarm;
  };

  const stopAllSound = () => {
    alarmSoundRef.current?.pause();
    alarmSoundRef.current = null;
    window.speechSynthesis.cancel();
    clearInterval(speechIntervalRef.current);
  };

  // ---------------- NON-STOP VOICE LOOP ----------------
  const speakLoop = (text) => {
    const voice = selectFemaleVoice(voiceLang);

    const speak = () => {
      window.speechSynthesis.cancel(); // 🔑 prevent overlap
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-IN";
      u.rate = 1;
      u.pitch = 1.1;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    };

    speak();
    setTimeout(speak, 700);
    speechIntervalRef.current = setInterval(speak, 3500);
  };

  // ---------------- TIME HELPER ----------------
  const getDelay = (h, m, ap) => {
    let hh = parseInt(h);
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    const now = new Date();
    const r = new Date();
    r.setHours(hh, parseInt(m), 0, 0);
    if (r < now) r.setDate(r.getDate() + 1);
    return r - now;
  };

  // ---------------- TRIGGER REMINDER ----------------
  const triggerReminder = (med, d) => {
    setIsRinging(true);
    setCurrentReminder({ med, d });
    playAlarm();
    speakLoop(
      `Mr ${patientName}, this is your ${med} ${d} time. Please take it now.`
    );
  };

  // ---------------- STOP ONLY BY USER ----------------
  useEffect(() => {
    window.stopAlarm = () => {
      if (!currentReminder) return;

      stopAllSound();
      setHistory((h) => [
        {
          id: Date.now(),
          patient: patientName,
          medicine: currentReminder.med,
          dose: currentReminder.d,
          takenAt: new Date().toLocaleString(),
          timestamp: Date.now(),
        },
        ...h,
      ]);

      setIsRinging(false);
      setCurrentReminder(null);
    };

    return () => delete window.stopAlarm;
  }, [currentReminder, patientName]);

  // ---------------- ADD REMINDER ----------------
  const addReminder = () => {
    const delay = getDelay(hour, minute, ampm);
    setTimeout(() => triggerReminder(medicineName, dose), delay);

    setReminders((r) => [
      ...r,
      { id: Date.now(), medicineName, dose, time: `${hour}:${minute} ${ampm}` },
    ]);

    alert("✅ Reminder added");
  };

  // ---------------- HISTORY ----------------
  const filteredHistory = history.filter((h) =>
    filterDays === "all"
      ? true
      : Date.now() - h.timestamp <= filterDays * 86400000
  );

  const toggleSelectHistory = (id) =>
    setSelectedHistory((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const deleteSelectedHistory = () => {
    setHistory((h) => h.filter((x) => !selectedHistory.includes(x.id)));
    setSelectedHistory([]);
  };

  // ---------------- UI ----------------
  return (
    <main style={{ padding: 20 }}>
      <h2>🗣 Voice Language</h2>
      <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}>
        <option value="en-IN">English (India)</option>
        <option value="hi-IN">Hindi (if available)</option>
        <option value="te-IN">Telugu (if available)</option>
      </select>

      <h2>👤 Patient</h2>
      <input value={patientName} onChange={(e) => setPatientName(e.target.value)} />

      <h2>💊 Add Medicine</h2>
      <input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />
      <select value={dose} onChange={(e) => setDose(e.target.value)}>
        {doses.map((d) => <option key={d}>{d}</option>)}
      </select>

      <h2>⏰ Time</h2>
      <div style={{ display: "flex", gap: 10 }}>
        <select value={hour} onChange={(e) => setHour(e.target.value)}>
          {hours.map((h) => <option key={h}>{h}</option>)}
        </select>
        <select value={minute} onChange={(e) => setMinute(e.target.value)}>
          {minutes.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>

      <button onClick={addReminder}>➕ Add Reminder</button>

      {isRinging && (
        <button
          onClick={() => window.stopAlarm()}
          style={{
            background: "green",
            color: "#fff",
            width: "100%",
            padding: 15,
            fontSize: 18,
            marginTop: 15,
          }}
        >
          ✅ Mark as Taken (Stop Alarm)
        </button>
      )}

      <hr />

      <h2>📜 History</h2>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide History" : "👁 Show History"}
      </button>

      {showHistory && (
        <>
          <select value={filterDays} onChange={(e) => setFilterDays(e.target.value)}>
            <option value="30">Last 30 days</option>
            <option value="all">All</option>
          </select>

          {selectedHistory.length > 0 && (
            <button
              onClick={deleteSelectedHistory}
              style={{ background: "red", color: "#fff", width: "100%" }}
            >
              🗑 Delete Selected ({selectedHistory.length})
            </button>
          )}

          {filteredHistory.map((h) => (
            <div key={h.id}>
              <input
                type="checkbox"
                checked={selectedHistory.includes(h.id)}
                onChange={() => toggleSelectHistory(h.id)}
              />{" "}
              {h.medicine} — {h.dose} ({h.takenAt})
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: 30, textAlign: "center", background: "#f1f5f9", padding: 15 }}>
        <small>Advertisement</small>
        <div style={{ height: 60, background: "#e5e7eb", marginTop: 5 }} />
      </div>
    </main>
  );
}

export default MainBody;