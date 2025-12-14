export default function Privacy() {
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

      <h2>🔒 Privacy Policy</h2>

      <p>
        Medi-Time AI respects your privacy. This application does not collect,
        store, or transmit any personal data to external servers.
      </p>

      <p>
        All reminder information, medicine details, and history are stored
        locally on your device only.
      </p>

      <p>
        No data is shared with third parties. If you uninstall the app, all
        locally stored data is permanently removed.
      </p>

      <p>
        This app is a reminder tool only and does not provide medical advice.
      </p>

      <p>
        Contact: <b>medi.time.app@gmail.com</b>
      </p>
    </div>
  );
}