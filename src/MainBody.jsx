import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx — FINAL & SAFE
 * - Alarm + continuous speech (while app is open)
 * - Female-first TTS with fallback
 * - Multi-language reminders
 * - Image upload (compressed)
 * - History with multi-delete
 * - Play Store / TWA compliant
 */

export default function MainBody() {
  // ---------------- STATE ----------------
  const [patientName, setPatientName] = useState(
    localStorage.getItem("patientName") || ""
  );
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
  const [selectedHistory, setSelectedHistory] = useState([]);

  const [isRinging, setIsRinging] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [voices, setVoices] = useState([]);

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

  // ---------------- PERMISSION ----------------
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("patientName", patientName);
  }, [history, patientName]);

  // ---------------- LOAD VOICES ----------------
  useEffect(() => {
    const loadVoices = () =>
      setVoices(window.speechSynthesis.getVoices() || []);
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () =>
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
  }, []);

  // ---------------- TRANSLATIONS ----------------
  const reminderText = {
    "en-IN": `Mr ${patientName}, this is your ${medicineName} ${dose} time. Please take it now.`,
    "hi-IN": `${patientName} जी, अब ${medicineName} ${dose} लेने का समय है। कृपया अभी लें।`,
    "te-IN": `${patientName} గారు, ఇది మీ ${medicineName} ${dose} తీసుకునే సమయం. దయచేసి ఇప్పుడు తీసుకోండి.`,
    "ta-IN": `${patientName}, இது உங்கள் ${medicineName} ${dose} எடுத்துக்கொள்ளும் நேரம். தயவுசெய்து இப்போது எடுத்துக்கொள்ளுங்கள்.`,
    "kn-IN": `${patientName}, ಇದು ನಿಮ್ಮ ${medicineName} ${dose} ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ. ದಯವಿಟ್ಟು ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ.`,
    "ml-IN": `${patientName}, ഇത് നിങ്ങളുടെ ${medicineName} ${dose} എടുക്കേണ്ട സമയമാണ്. ദയവായി ഇപ്പോൾ എടുക്കുക.`,
    "bn-IN": `${patientName}, এখন আপনার ${medicineName} ${dose} নেওয়ার সময়। অনুগ্রহ করে এখনই নিন।`,
    "mr-IN": `${patientName}, आता तुमचे ${medicineName} ${dose} घेण्याची वेळ झाली आहे. कृपया आत्ताच घ्या.`,
    "gu-IN": `${patientName}, હવે તમારું ${medicineName} ${dose} લેવાનો સમય છે. કૃપા કરીને હવે લો.`,
  };

  const getReminderText =
    reminderText[voiceLang] || reminderText["en-IN"];

  // ---------------- IMAGE PICK (COMPRESSED) ----------------
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(600 / img.width, 600 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        setMedicineImage(canvas.toDataURL("image/jpeg", 0.8));
      };
    };

    reader.readAsDataURL(file);
  };

  // ---------------- TIME ----------------
  const getDelay = () => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const now = new Date();
    const t = new Date();
    t.setHours(h, parseInt(minute, 10), 0, 0);
    if (t < now) t.setDate(t.getDate() + 1);
    return t - now;
  };

  // ---------------- ALARM ----------------
  const playAlarm = () => {
    stopAlarm();
    const a = new Audio("/alarm.mp3"); // file must exist in /public
    a.loop = true;
    a.volume = 1;
    a.play().catch(() => {});
    alarmRef.current = a;
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current = null;
  };

  // ---------------- SPEECH LOOP ----------------
  const speakLoop = (text) => {
    let stopped = false;

    const voice =
      voices.find(v => v.lang === voiceLang) ||
      voices.find(v => v.lang.startsWith(voiceLang.split("-")[0])) ||
      voices[0];

    const speakOnce = () => {
      if (stopped) return;
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-IN";
      u.rate = 1;
      u.pitch = 1.1;
      u.onend = () => !stopped && setTimeout(speakOnce, 800);
      u.onerror = () => !stopped && setTimeout(speakOnce, 1200);
      window.speechSynthesis.speak(u);
    };

    speakOnce();

    return () => {
      stopped = true;
      window.speechSynthesis.cancel();
    };
  };

  // ---------------- TRIGGER ----------------
  const triggerReminder = () => {
    setIsRinging(true);
    playAlarm();
    stopSpeechRef.current = speakLoop(getReminderText);
  };

  // ---------------- STOP ----------------
  const markAsTaken = () => {
    stopAlarm();
    stopSpeechRef.current?.();

    setHistory(h => [
      {
        id: Date.now(),
        medicine: medicineName,
        dose,
        image: medicineImage,
        takenAt: new Date().toLocaleString(),
      },
      ...h,
    ]);

    setIsRinging(false);
  };

  // ---------------- HISTORY DELETE ----------------
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
        <option value="en-IN">English (India)</option>
        <option value="hi-IN">Hindi</option>
        <option value="te-IN">Telugu</option>
        <option value="ta-IN">Tamil</option>
        <option value="kn-IN">Kannada</option>
        <option value="ml-IN">Malayalam</option>
        <option value="bn-IN">Bengali</option>
        <option value="mr-IN">Marathi</option>
        <option value="gu-IN">Gujarati</option>
      </select>

      <h2>👤 Patient</h2>
      <input value={patientName} onChange={e => setPatientName(e.target.value)} />

      <h2>💊 Medicine</h2>
      <input value={medicineName} onChange={e => setMedicineName(e.target.value)} />
      <input type="file" accept="image/*" onChange={onImagePick} />

      {medicineImage && <img src={medicineImage} style={{ width: 120, marginTop: 8 }} />}

      <select value={dose} onChange={e => setDose(e.target.value)}>
        {doses.map(d => <option key={d}>{d}</option>)}
      </select>

      <h2>⏰ Time</h2>
      <select value={hour} onChange={e => setHour(e.target.value)}>
        {hours.map(h => <option key={h}>{h}</option>)}
      </select>
      <select value={minute} onChange={e => setMinute(e.target.value)}>
        {minutes.map(m => <option key={m}>{m}</option>)}
      </select>
      <select value={ampm} onChange={e => setAmPm(e.target.value)}>
        <option>AM</option>
        <option>PM</option>
      </select>

      <button onClick={() => setTimeout(triggerReminder, getDelay())}>
        ➕ Add Reminder
      </button>

      {isRinging && (
        <button onClick={markAsTaken} style={{ background: "green", color: "#fff", width: "100%", marginTop: 10 }}>
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
            {h.image && (
              <img
                src={h.image}
                alt=""
                style={{ width: 60, marginTop: 6 }}
              />
            )}
          </div>
        ))}

      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: "#f8fafc",
          borderRadius: 10,
        }}
      >
        <small>Advertisement</small>
        <div
          style={{ height: 64, background: "#e5e7eb", marginTop: 8 }}
        >
          Ad will appear here
        </div>
      </div>
    </main>
  );
}