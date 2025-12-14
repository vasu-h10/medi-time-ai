export default function Disclaimer() {
  return (
    <div style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        style={{
          marginBottom: 16,
          padding: "10px 14px",
          background: "#f1f5f9",
          border: "1px solid #ccc",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h2>⚠️ Disclaimer</h2>

      <p>
        Medi-Time AI is intended for reminder purposes only.
      </p>

      <p>
        This application is <b>not a medical device</b> and should not be used as
        a substitute for professional medical advice, diagnosis, or treatment.
      </p>

      <p>
        Always consult a qualified healthcare provider regarding any medical
        condition or medication schedule.
      </p>

      <p>
        The developers make no guarantees regarding accuracy, reliability, or
        completeness of reminders.
      </p>

      <p>
        Use of this app is entirely at your own risk.
      </p>
    </div>
  );
}