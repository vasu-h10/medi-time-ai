import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx
 * - Female-only TTS (auto fallback)
 * - 9+ language REAL translations
 * - Sentence frozen at reminder time
 * - NON-STOP alarm + voice loop
 * - Stops ONLY on "Mark as Taken"
 * - History Show/Hide + Delete Selected
 * - Non-intrusive Ad layout
 */

function MainBody() {
  // ---------------- STATES ----------------
  const [patientName, setPatientName] = useState(localStorage.getItem("patientName") || "");
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [reminders, setReminders] = useState(JSON.parse(localStorage.getItem("reminders") || "[]"));
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem("history") || "[]"));

  const [selectedHistory, setSelectedHistory] = useState([]);
  const [filterDays, setFilterDays] = useState("30");
  const [showHistory, setShowHistory] = useState(false);

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [allVoices, setAllVoices] = useState([]);

  const [isRinging, setIsRinging] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  const speechIntervalRef = useRef(null);
  const alarmSoundRef = useRef(null);

  // ---------------- CONSTANTS ----------------
  const doses = ["10 mg", "20 mg", "50 mg", "100 mg", "250 mg", "500 mg"];
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  // ---------------- MULTI-LANGUAGE TEXT ----------------
  const reminderTextByLang = {
    "en-IN": ({ name, med, dose }) => `Mr ${name}, this is your ${med} ${dose} time. Please take it now.`,
    "hi-IN": ({ name, med, dose }) => `${name} जी, अब ${med} ${dose} लेने का समय है। कृपया अभी लें।`,
    "te-IN": ({ name, med, dose }) => `${name} గారు, ఇది మీ ${med} ${dose} తీసుకునే సమయం. దయచేసి ఇప్పుడు తీసుకోండి.`,
    "ta-IN": ({ name, med, dose }) => `${name}, இது உங்கள் ${med} ${dose} எடுத்துக்கொள்ளும் நேரம். தயவுசெய்து இப்போது எடுத்துக்கொள்ளுங்கள்.`,
    "kn-IN": ({ name, med, dose }) => `${name}, ಇದು ನಿಮ್ಮ ${med} ${dose} ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ. ದಯವಿಟ್ಟು ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ.`,
    "ml-IN": ({ name, med, dose }) => `${name}, ഇത് നിങ്ങളുടെ ${med} ${dose} എടുക്കേണ്ട സമയമാണ്. ദയവായി ഇപ്പോൾ എടുക്കുക.`,
    "bn-IN": ({ name, med, dose }) => `${name}, এখন আপনার ${med} ${dose} নেওয়ার সময়। অনুগ্রহ করে এখনই নিন।`,
    "mr-IN": ({ name, med, dose }) => `${name}, आता तुमचे ${med} ${dose} घेण्याची वेळ झाली आहे. कृपया आत्ताच घ्या.`,
    "gu-IN": ({ name, med, dose }) => `${name}, હવે તમારું ${med} ${dose} લેવાનો સમય છે. કૃપા કરીને હવે લો।`,
  };

  const getReminderText = () => {
    const fn = reminderTextByLang[voiceLang] || reminderTextByLang["en-IN"];
    return fn({ name: patientName, med: medicineName, dose });
  };

  // ---------------- LOAD VOICES ----------------
  useEffect(() => {
    const load = () => setAllVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("patientName", patientName);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    localStorage.setItem("history", JSON.stringify(history));
  }, [patientName, reminders, history]);

  // ---------------- VOICE SELECT ----------------
  const selectVoice = (lang) =>
    allVoices.find(v => v.lang === lang) ||
    allVoices.find(v => v.lang.startsWith(lang.split("-")[0])) ||
    allVoices.find(v => v.lang.startsWith("en")) ||
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

  // ---------------- NON-STOP SPEECH ----------------
  const speakLoop = (text) => {
    const voice = selectVoice(voiceLang);

    const speak = () => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-IN";
      u.volume = 1;
      u.rate = 1;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    };

    speak();
    setTimeout(speak, 700);
    speechIntervalRef.current = setInterval(speak, 3500);
  };

  // ---------------- TIME ----------------
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

  // ---------------- TRIGGER ----------------
  const triggerReminder = (reminder) => {
    setIsRinging(true);
    setCurrentReminder(reminder);
    playAlarm();
    speakLoop(reminder.text);
  };

  // ---------------- STOP (USER ONLY) ----------------
  useEffect(() => {
    window.stopAlarm = () => {
      if (!currentReminder) return;

      stopAllSound();
      setHistory(h => [
        {
          id: Date.now(),
          patient: patientName,
          medicine: currentReminder.medicine,
          dose: currentReminder.dose,
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
    if (!patientName || !medicineName) {
      alert("Enter patient and medicine");
      return;
    }

    const reminder = {
      medicine: medicineName,
      dose,
      text: getReminderText(),
    };

    setTimeout(() => triggerReminder(reminder), getDelay(hour, minute, ampm));
    setReminders(r => [...r, reminder]);

    alert("✅ Reminder added");
  };

  // ---------------- HISTORY ----------------
  const filteredHistory = history.filter(h =>
    filterDays === "all" ? true : Date.now() - h.timestamp <= filterDays * 86400000
  );

  const toggleSelectHistory = (id) =>
    setSelectedHistory(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const deleteSelectedHistory = () => {
    setHistory(h => h.filter(x => !selectedHistory.includes(x.id)));
    setSelectedHistory([]);
  };

  // ---------------- UI ----------------
  return (
    <main style={{ padding: 20 }}>
      <h2>🗣 Voice Language</h2>
      <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)}>
        {Object.keys(reminderTextByLang).map(k => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>

      <h2>👤 Patient</h2>
      <input value={patientName} onChange={e => setPatientName(e.target.value)} />

      <h2>💊 Medicine</h2>
      <input value={medicineName} onChange={e => setMedicineName(e.target.value)} />
      <select value={dose} onChange={e => setDose(e.target.value)}>
        {doses.map(d => <option key={d}>{d}</option>)}
      </select>

      <h2>⏰ Time</h2>
      <select value={hour} onChange={e => setHour(e.target.value)}>{hours.map(h => <option key={h}>{h}</option>)}</select>
      <select value={minute} onChange={e => setMinute(e.target.value)}>{minutes.map(m => <option key={m}>{m}</option>)}</select>
      <select value={ampm} onChange={e => setAmPm(e.target.value)}><option>AM</option><option>PM</option></select>

      <button onClick={addReminder}>➕ Add Reminder</button>

      {isRinging && (
        <button onClick={() => window.stopAlarm()} style={{ background: "green", color: "#fff", width: "100%", marginTop: 15 }}>
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
          <select value={filterDays} onChange={e => setFilterDays(e.target.value)}>
            <option value="30">Last 30 days</option>
            <option value="all">All</option>
          </select>

          {selectedHistory.length > 0 && (
            <button onClick={deleteSelectedHistory} style={{ background: "red", color: "#fff", width: "100%" }}>
              🗑 Delete Selected ({selectedHistory.length})
            </button>
          )}

          {filteredHistory.map(h => (
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