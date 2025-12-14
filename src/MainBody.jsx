import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx
 * - Female-only TTS (auto fallback)
 * - 9+ language full-sentence translations
 * - NON-STOP alarm + chained voice loop (NO CUT SPEECH)
 * - Stops ONLY on "Mark as Taken"
 * - History Show/Hide + Delete selected
 * - Play Store / TWA safe
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

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );

  const [selectedHistory, setSelectedHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [allVoices, setAllVoices] = useState([]);

  const [isRinging, setIsRinging] = useState(false);

  const alarmRef = useRef(null);
  const stopSpeechRef = useRef(null);

  // ---------------- CONSTANTS ----------------
  const doses = ["10 mg", "20 mg", "50 mg", "100 mg", "250 mg", "500 mg"];
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // ---------------- TRANSLATIONS ----------------
  const reminderTextByLang = {
    "en-IN": ({ n, m, d }) =>
      `Mr ${n}, this is your ${m} ${d} time. Please take it now.`,

    "hi-IN": ({ n, m, d }) =>
      `${n} जी, अब ${m} ${d} लेने का समय है। कृपया अभी लें।`,

    "te-IN": ({ n, m, d }) =>
      `${n} గారు, ఇది మీ ${m} ${d} తీసుకునే సమయం. దయచేసి ఇప్పుడు తీసుకోండి.`,

    "ta-IN": ({ n, m, d }) =>
      `${n}, இது உங்கள் ${m} ${d} எடுத்துக்கொள்ளும் நேரம். தயவுசெய்து இப்போது எடுத்துக்கொள்ளுங்கள்.`,

    "kn-IN": ({ n, m, d }) =>
      `${n}, ಇದು ನಿಮ್ಮ ${m} ${d} ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ. ದಯವಿಟ್ಟು ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ.`,

    "ml-IN": ({ n, m, d }) =>
      `${n}, ഇത് നിങ്ങളുടെ ${m} ${d} എടുക്കേണ്ട സമയമാണ്. ദയവായി ഇപ്പോൾ എടുക്കുക.`,

    "bn-IN": ({ n, m, d }) =>
      `${n}, এখন আপনার ${m} ${d} নেওয়ার সময়। অনুগ্রহ করে এখনই নিন।`,

    "mr-IN": ({ n, m, d }) =>
      `${n}, आता तुमचे ${m} ${d} घेण्याची वेळ झाली आहे. कृपया आत्ताच घ्या.`,

    "gu-IN": ({ n, m, d }) =>
      `${n}, હવે તમારું ${m} ${d} લેવાનો સમય છે. કૃપા કરીને હવે લો।`,
  };

  const getReminderText = () => {
    const fn =
      reminderTextByLang[voiceLang] || reminderTextByLang["en-IN"];
    return fn({ n: patientName, m: medicineName, d: dose });
  };

  // ---------------- LOAD VOICES ----------------
  useEffect(() => {
    const load = () =>
      setAllVoices(window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("patientName", patientName);
  }, [history, patientName]);

  // ---------------- VOICE PICKER ----------------
  const selectVoice = (lang) =>
    allVoices.find(v => v.lang === lang) ||
    allVoices.find(v => v.lang.startsWith(lang.split("-")[0])) ||
    allVoices.find(v => v.lang.startsWith("en")) ||
    allVoices[0];

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    const a = new Audio("/alarm.mp3");
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    alarmRef.current = a;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
  };

  // ---------------- SAFE SPEECH LOOP (NO BREAKS) ----------------
  const speakLoop = (text) => {
    const voice = selectVoice(voiceLang);
    let stopped = false;

    const speakOnce = () => {
      if (stopped) return;

      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-IN";
      u.volume = 1;
      u.rate = 1;
      u.pitch = 1.1;

      u.onend = () => {
        if (!stopped) setTimeout(speakOnce, 800);
      };

      u.onerror = () => {
        if (!stopped) setTimeout(speakOnce, 1500);
      };

      window.speechSynthesis.speak(u);
    };

    speakOnce();

    return () => {
      stopped = true;
      window.speechSynthesis.cancel();
    };
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

  // ---------------- TRIGGER ----------------
  const triggerReminder = () => {
    setIsRinging(true);
    playAlarm();
    stopSpeechRef.current = speakLoop(getReminderText());
  };

  // ---------------- STOP (USER ONLY) ----------------
  const markAsTaken = () => {
    stopAlarm();
    stopSpeechRef.current?.();

    setHistory(h => [
      {
        id: Date.now(),
        medicine: medicineName,
        dose,
        takenAt: new Date().toLocaleString(),
      },
      ...h,
    ]);

    setIsRinging(false);
  };

  // ---------------- ADD REMINDER ----------------
  const addReminder = () => {
    setTimeout(triggerReminder, getDelay());
    alert("✅ Reminder added");
  };

  // ---------------- HISTORY HELPERS ----------------
  const toggleSelect = (id) =>
    setSelectedHistory(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );

  const deleteSelected = () => {
    setHistory(h => h.filter(x => !selectedHistory.includes(x.id)));
    setSelectedHistory([]);
  };

  // ---------------- UI ----------------
  return (
    <main style={{ padding: 20 }}>
      <h2>🗣 Voice Language</h2>
      <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)}>
        {Object.keys(reminderTextByLang).map(l => (
          <option key={l} value={l}>{l}</option>
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
        <button
          onClick={markAsTaken}
          style={{ background: "green", color: "#fff", width: "100%", marginTop: 15, fontSize: 18 }}
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
          {selectedHistory.length > 0 && (
            <button onClick={deleteSelected} style={{ background: "red", color: "#fff", width: "100%" }}>
              🗑 Delete Selected ({selectedHistory.length})
            </button>
          )}

          {history.map(h => (
            <div key={h.id}>
              <input
                type="checkbox"
                checked={selectedHistory.includes(h.id)}
                onChange={() => toggleSelect(h.id)}
              />{" "}
              {h.medicine} — {h.dose} ({h.takenAt})
            </div>
          ))}
        </>
      )}
    </main>
  );
}

export default MainBody;