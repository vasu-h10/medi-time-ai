export default function Terms() {
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

      <h2>📜 Terms & Conditions</h2>

      <p>
        Medi-Time AI is a personal medication reminder application. By using this
        app, you agree to these Terms and Conditions.
      </p>

      <p>
        This app does not provide medical advice, diagnosis, or treatment. It
        only reminds users to take medicines as prescribed by a qualified
        healthcare professional.
      </p>

      <p>
        You are solely responsible for verifying medication details, dosage, and
        timing with your doctor or pharmacist.
      </p>

      <p>
        The developers are not responsible for any health issues, missed doses,
        incorrect usage, or consequences resulting from reliance on this app.
      </p>

      <p>
        Continued use of this app indicates your acceptance of these terms.
      </p>
    </div>
  );
}