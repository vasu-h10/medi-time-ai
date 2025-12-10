import { useEffect, useState, useRef } from "react";

/**
 * MainBody.jsx
 * - Female-only TTS
 * - Multi-language support
 * - Auto timezone (device local time)
 * - Non-stop alarm + speech loop (stops after 5 minutes automatically OR when user presses Taken)
 * - Snooze, History, Delete selected history
 */

function MainBody() {
  // STATES
  const [patientName, setPatientName] = useState(
    typeof window !== "undefined" ? localStorage.getItem("patientName") || "" : ""
  );
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("20 mg");

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  const [reminders, setReminders] = useState(
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("reminders") || "[]") : []
  );
  const [history, setHistory] = useState(
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("history") || "[]") : []
  );

  const [selectedHistory, setSelectedHistory] = useState([]);
  const [filterDays, setFilterDays] = useState("30");

  // female-only voice: no gender selector shown to user (keeps consistent)
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [allVoices, setAllVoices] = useState([]);

  // alarm state
  const [isRinging, setIsRinging] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  // refs for intervals/timeouts so we can clear reliably
  const speechIntervalRef = useRef(null);
  const alarmSoundRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);

  const doses = ["10 mg", "20 mg", "50 mg", "100 mg", "250 mg", "500 mg", "0.5 g", "1 g"];
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  // -----------------------
  // Load voices reliably (poll + voiceschanged)
  // -----------------------
  useEffect(() => {
    let tries = 0;
    const maxTries = 30; // ~3 seconds
    const tryLoad = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length > 0) {
        setAllVoices(voices);
      } else if (tries < maxTries) {
        tries++;
        setTimeout(tryLoad, 100);
      } else {
        setAllVoices([]); // give up
      }
    };

    tryLoad();
    const onVoicesChanged = () => {
      setAllVoices(window.speechSynthesis?.getVoices() || []);
    };
    window.speechSynthesis?.addEventListener?.("voiceschanged", onVoicesChanged);

    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", onVoicesChanged);
    };
  }, []);

  // -----------------------
  // Persist to localStorage
  // -----------------------
  useEffect(() => {
    try {
      localStorage.setItem("patientName", patientName);
      localStorage.setItem("reminders", JSON.stringify(reminders));
      localStorage.setItem("history", JSON.stringify(history));
    } catch (e) {
      // ignore localStorage errors
    }
  }, [patientName, reminders, history]);

  // -----------------------
  // Utilities: select best female voice by language then fallback
  // -----------------------
  const selectFemaleVoice = (desiredLang) => {
    if (!allVoices || allVoices.length === 0) return null;

    // prefer exact lang-region match
    const exact = allVoices.find((v) => (v.lang || "").toLowerCase() === (desiredLang || "").toLowerCase());
    if (exact) return exact;

    // prefer same language prefix
    const prefix = (desiredLang || "").split("-")[0].toLowerCase();
    const prefixMatch = allVoices.find((v) => (v.lang || "").toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    // find likely female by name (heuristic)
    const femaleRegex = /female|woman|zira|hazel|ivy|samantha|lara|amanda|anna|kanya|arya|nikita|sonu/i;
    const femaleByName = allVoices.find((v) => femaleRegex.test(v.name || v.voiceURI || ""));
    if (femaleByName) return femaleByName;

    // fallback: first available voice
    return allVoices[0] || null;
  };

  // -----------------------
  // Alarm audio
  // -----------------------
  const playAlarm = () => {
    try {
      const alarm = new Audio("/alarm.mp3");
      alarm.loop = true;
      // try play (may be blocked until user gesture)
      alarm.play().catch(() => {
        // play may be blocked; don't crash
      });
      alarmSoundRef.current = alarm;
      return alarm;
    } catch (e) {
      return null;
    }
  };

  const stopAlarmSound = () => {
    try {
      if (alarmSoundRef.current) {
        alarmSoundRef.current.pause();
        alarmSoundRef.current.currentTime = 0;
        alarmSoundRef.current = null;
      }
    } catch (e) {}
  };

  // -----------------------
  // Speech loop (female voice only)
  // -----------------------
  const speakLoop = (text) => {
    // clear prior interval
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }

    // get selected female voice for the language
    const voice = selectFemaleVoice(voiceLang);

    const speakOnce = () => {
      if (!("speechSynthesis" in window)) return;
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = voiceLang || (voice?.lang || "en-IN");
        if (voice) utter.voice = voice;
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        // ignore speak errors
      }
    };

    // speak immediately and then every 6 seconds
    speakOnce();
    speechIntervalRef.current = setInterval(speakOnce, 6000);
  };

  const stopSpeaking = () => {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
  };

  // -----------------------
  // Helper: compute ms delay using device local time (auto timezone)
  // -----------------------
  const getDelay = (h, m, ap) => {
    let hour24 = parseInt(h, 10);
    if (ap === "PM" && hour24 !== 12) hour24 += 12;
    if (ap === "AM" && hour24 === 12) hour24 = 0;

    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hour24, parseInt(m, 10), 0, 0);

    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    return reminderTime.getTime() - now.getTime();
  };

  // -----------------------
  // Trigger reminder: start alarm + speech loop + auto-stop after 5 minutes
  // -----------------------
  const triggerReminder = (medicineNameParam, doseParam) => {
    setIsRinging(true);
    setCurrentReminder({ medicineName: medicineNameParam, dose: doseParam });

    // start alarm sound (if possible)
    const alarmSound = playAlarm();

    // speak text repeatedly (female voice selected inside speakLoop)
    const text = `Mr. ${patientName}, this is your ${medicineNameParam} ${doseParam} time. Please take it.`;
    speakLoop(text);

    // set auto-stop after 5 minutes (300000ms)
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    autoStopTimeoutRef.current = setTimeout(() => {
      // stop alarm and speech
      stopAlarmSound();
      stopSpeaking();
      setIsRinging(false);
      setCurrentReminder(null);
      // show hint/warning
      try {
        alert("You forgot taking medicine at the scheduled time. Please consult your doctor.");
      } catch (e) {}
    }, 300000); // 5 minutes
  };

  // global function to stop this alarm from UI (Taken)
  // store on window so button can call it (keeps simple)
  useEffect(() => {
    window.stopAlarm = () => {
      // stop sounds and speech, clear auto-stop timeout
      stopAlarmSound();
      stopSpeaking();
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }

      // add to history safely using currentReminder snapshot
      if (currentReminder) {
        const newHistory = {
          id: Date.now(),
          patient: patientName,
          medicine: currentReminder.medicineName,
          dose: currentReminder.dose,
          timestamp: Date.now(),
          takenAt: new Date().toLocaleString(),
        };
        setHistory((prev) => [newHistory, ...prev]);
      }

      setIsRinging(false);
      setCurrentReminder(null);
    };

    return () => {
      // cleanup on unmount
      delete window.stopAlarm;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientName, currentReminder]);

  // -----------------------
  // Add reminder (schedules timeout based on local time)
  // -----------------------
  const addReminder = () => {
    if (!patientName || !medicineName) {
      alert("Enter patient & medicine");
      return;
    }
    const delay = getDelay(hour, minute, ampm);
    const timerId = setTimeout(() => {
      triggerReminder(medicineName, dose);
    }, delay);

    const newReminder = {
      id: Date.now(),
      medicineName,
      dose,
      time: `${hour}:${minute} ${ampm}`,
      timerId,
    };
    setReminders((prev) => [...prev, newReminder]);
    alert("✅ Reminder Added");
  };

  // -----------------------
  // delete reminder
  // -----------------------
  const deleteReminder = (id, timerId) => {
    try {
      clearTimeout(timerId);
    } catch (e) {}
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // -----------------------
  // snooze: schedule trigger after minutes
  // -----------------------
  const snoozeReminder = (medicineNameParam, doseParam, minutes) => {
    setTimeout(() => {
      triggerReminder(medicineNameParam, doseParam);
    }, minutes * 60 * 1000);
    alert(`⏳ Snoozed for ${minutes} minutes`);
  };

  // -----------------------
  // History helpers
  // -----------------------
  const filteredHistory = history.filter((h) => {
    if (filterDays === "all") return true;
    return Date.now() - h.timestamp <= filterDays * 24 * 60 * 60 * 1000;
  });

  const toggleSelectHistory = (id) => {
    setSelectedHistory((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const deleteSelectedHistory = () => {
    if (!selectedHistory.length) {
      alert("No items selected");
      return;
    }
    setHistory((prev) => prev.filter((h) => !selectedHistory.includes(h.id)));
    setSelectedHistory([]);
    alert("Selected history deleted");
  };

  // -----------------------
  // cleanup sound/intervals on unmount
  // -----------------------
  useEffect(() => {
    return () => {
      stopAlarmSound();
      stopSpeaking();
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
      }
    };
  }, []);

  // -----------------------
  // UI
  // -----------------------
  return (
    <main style={{ padding: 20 }}>
      {/* Voice Language */}
      <h2>🗣 Voice Language</h2>
      <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} style={{ padding: 10, width: "100%", marginBottom: 15 }}>
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

      {/* Patient */}
      <h2>👤 Patient</h2>
      <input placeholder="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} style={{ padding: 10, width: "100%", marginBottom: 10 }} />

      {/* Medicine */}
      <h2>💊 Add Medicine</h2>
      <input placeholder="Medicine Name" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} style={{ padding: 10, width: "100%", marginBottom: 10 }} />

      <select value={dose} onChange={(e) => setDose(e.target.value)} style={{ padding: 10, width: "100%", marginBottom: 10 }}>
        {doses.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      {/* Time */}
      <h2>⏰ Time</h2>
      <div style={{ display: "flex", gap: 10 }}>
        <select value={hour} onChange={(e) => setHour(e.target.value)}>{hours.map((h) => <option key={h}>{h}</option>)}</select>
        <select value={minute} onChange={(e) => setMinute(e.target.value)}>{minutes.map((m) => <option key={m}>{m}</option>)}</select>
        <select value={ampm} onChange={(e) => setAmPm(e.target.value)}><option>AM</option><option>PM</option></select>
      </div>

      <button onClick={addReminder} style={{ marginTop: 20 }}>➕ Add Reminder</button>

      {/* Stop Alarm UI */}
      {isRinging && currentReminder && (
        <div style={{ marginTop: 20 }}>
          <p><strong>Ringing for: {currentReminder.medicineName} - {currentReminder.dose}</strong></p>
          <button style={{ padding: 12, background: "green", color: "white", width: "100%" }} onClick={() => window.stopAlarm()}>
            ✅ Taken (Stop Alarm)
          </button>
        </div>
      )}

      <hr />

      {/* Active Reminders */}
      <h2>📋 Active Reminders</h2>
      {reminders.map((r) => (
        <div key={r.id} style={{ border: "1px solid #aaa", padding: 10, marginBottom: 10 }}>
          <b>{r.medicineName}</b> — {r.dose}
          <br />
          ⏰ {r.time}
          <br /><br />
          <button onClick={() => snoozeReminder(r.medicineName, r.dose, 5)}>Snooze 5 min</button>{" "}
          <button onClick={() => snoozeReminder(r.medicineName, r.dose, 10)}>Snooze 10 min</button>{" "}
          <button onClick={() => snoozeReminder(r.medicineName, r.dose, 30)}>Snooze 30 min</button>
          <br /><br />
          <button onClick={() => deleteReminder(r.id, r.timerId)}>❌ Delete</button>
        </div>
      ))}

      <hr />

      {/* History Filter */}
      <h2>📜 History Filter</h2>
      <select value={filterDays} onChange={(e) => setFilterDays(e.target.value)}>
        <option value="30">Last 30 Days</option>
        <option value="60">Last 60 Days</option>
        <option value="365">Last 1 Year</option>
        <option value="all">All History</option>
      </select>

      <h2 style={{ marginTop: 10 }}>🗂 History (Select to Delete)</h2>

      <button onClick={deleteSelectedHistory} style={{ marginBottom: 10, padding: 10, background: "red", color: "white", width: "100%", borderRadius: 5 }}>
        🗑 Delete Selected History
      </button>

      {filteredHistory.map((h) => (
        <div key={h.id} style={{ border: "1px solid green", padding: 10, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={selectedHistory.includes(h.id)} onChange={() => toggleSelectHistory(h.id)} />
          <div>
            ✅ {h.medicine} — {h.dose}
            <br />👤 {h.patient}
            <br />🕒 {h.takenAt}
          </div>
        </div>
      ))}
    </main>
  );
}

export default MainBody;
