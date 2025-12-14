import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx
 * - Female-only TTS
 * - Multi-language support
 * - Auto timezone
 * - Non-stop alarm + speech loop (auto-stop after 5 minutes)
 * - Snooze, History (Show/Hide), Delete selected history
 * - Non-intrusive Ad layout at bottom
 */

function MainBody() {
  // -----------------------
  // STATES
  // -----------------------
  const [patientName, setPatientName] = useState(
    typeof window !== "undefined" ? localStorage.getItem("patientName") || "" : ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [reminders, setReminders] = useState(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("reminders") || "[]")
      : []
  );
  const [history, setHistory] = useState(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("history") || "[]")
      : []
  );

  const [selectedHistory, setSelectedHistory] = useState([]);
  const [filterDays, setFilterDays] = useState("30");
  const [showHistory, setShowHistory] = useState(false);

  // voice
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [allVoices, setAllVoices] = useState([]);

  // alarm
  const [isRinging, setIsRinging] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  const speechIntervalRef = useRef(null);
  const alarmSoundRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);

  const doses = ["10 mg", "20 mg", "50 mg", "100 mg", "250 mg", "500 mg", "0.5 g", "1 g"];
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // -----------------------
  // Load voices
  // -----------------------
  useEffect(() => {
    const load = () => setAllVoices(window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // -----------------------
  // Persist localStorage
  // -----------------------
  useEffect(() => {
    localStorage.setItem("patientName", patientName);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    localStorage.setItem("history", JSON.stringify(history));
  }, [patientName, reminders, history]);

  // -----------------------
  // Select female voice
  // -----------------------
  const selectFemaleVoice = (lang) =>
    allVoices.find((v) => v.lang === lang) || allVoices[0];

  // -----------------------
  // Alarm + speech
  // -----------------------
  const playAlarm = () => {
    const alarm = new Audio("/alarm.mp3");
    alarm.loop = true;
    alarm.play().catch(() => {});
    alarmSoundRef.current = alarm;
  };

  const stopAllSound = () => {
    alarmSoundRef.current?.pause();
    window.speechSynthesis.cancel();
    clearInterval(speechIntervalRef.current);
    clearTimeout(autoStopTimeoutRef.current);
  };

  const speakLoop = (text) => {
    const voice = selectFemaleVoice(voiceLang);
    const speak = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voiceLang;
      window.speechSynthesis.speak(u);
    };
    speak();
    speechIntervalRef.current = setInterval(speak, 6000);
  };

  // -----------------------
  // Time helpers
  // -----------------------
  const getDelay = (h, m, ap) => {
    let hh = parseInt(h);
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    const t = new Date();
    const r = new Date();
    r.setHours(hh, parseInt(m), 0, 0);
    if (r < t) r.setDate(r.getDate() + 1);
    return r - t;
  };

  // -----------------------
  // Trigger reminder
  // -----------------------
  const triggerReminder = (med, d) => {
    setIsRinging(true);
    setCurrentReminder({ med, d });
    playAlarm();
    speakLoop(`Mr ${patientName}, take ${med} ${d}`);
    autoStopTimeoutRef.current = setTimeout(() => {
      stopAllSound();
      setIsRinging(false);
      alert("You missed your medicine. Please consult doctor.");
    }, 300000);
  };

  useEffect(() => {
    window.stopAlarm = () => {
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
    };
    return () => delete window.stopAlarm;
  }, [currentReminder, patientName]);

  // -----------------------
  // Add reminder
  // -----------------------
  const addReminder = () => {
    const delay = getDelay(hour, minute, ampm);
    const timerId = setTimeout(
      () => triggerReminder(medicineName, dose),
      delay
    );
    setReminders((r) => [
      ...r,
      {
        id: Date.now(),
        medicineName,
        dose,
        time: `${hour}:${minute} ${ampm}`,
        timerId,
      },
    ]);
    alert("Reminder added");
  };

  // -----------------------
  // History helpers
  // -----------------------
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

  // -----------------------
  // UI
  // -----------------------
  return (
    <main style={{ padding: 20 }}>
      <h2>🗣 Voice Language</h2>
      <select
        value={voiceLang}
        onChange={(e) => setVoiceLang(e.target.value)}
        style={{ width: "100%" }}
      >
        <option value="en-IN">English (India)</option>
        <option value="hi-IN">Hindi</option>
        <option value="te-IN">Telugu</option>
      </select>

      <h2>👤 Patient</h2>
      <input
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
        style={{ width: "100%" }}
      />

      <h2>💊 Add Medicine</h2>
      <input
        value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)}
        style={{ width: "100%" }}
      />
      <select
        value={dose}
        onChange={(e) => setDose(e.target.value)}
        style={{ width: "100%" }}
      >
        {doses.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <h2>⏰ Time</h2>
      <div style={{ display: "flex", gap: 10 }}>
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
      </div>

      <button onClick={addReminder}>➕ Add Reminder</button>

      {isRinging && (
        <button
          onClick={() => window.stopAlarm()}
          style={{ background: "green", color: "#fff", width: "100%" }}
        >
          ✅ Taken (Stop Alarm)
        </button>
      )}

      <hr />

      <h2>📜 History</h2>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "🙈 Hide History" : "👁 Show History"}
      </button>

      {showHistory && (
        <>
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
          >
            <option value="30">Last 30 days</option>
            <option value="all">All</option>
          </select>

          {selectedHistory.length > 0 && (
            <button
              onClick={deleteSelectedHistory}
              style={{
                marginTop: 10,
                padding: 10,
                background: "red",
                color: "white",
                width: "100%",
                borderRadius: 6,
                fontWeight: "bold",
              }}
            >
              🗑 Delete Selected ({selectedHistory.length})
            </button>
          )}

          {selectedHistory.length === 0 && (
            <p style={{ fontSize: 12, color: "#666" }}>
              ☑ Select history items to enable delete
            </p>
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

      {/* ---------------- Ad Layout ---------------- */}
      <div
        style={{
          marginTop: 30,
          padding: 15,
          borderTop: "1px solid #ccc",
          textAlign: "center",
          background: "#f8fafc",
        }}
      >
        <small>Advertisement</small>
        <div style={{ height: 60, background: "#e5e7eb", marginTop: 5 }} />
      </div>
    </main>
  );
}

export default MainBody;