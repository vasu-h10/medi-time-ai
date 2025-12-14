import Link from "next/link";

export default function Terms() {
  return (
    <div style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <Link href="/">
        <button
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "#f1f5f9",
            border: "1px solid #ccc",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ← Back to App
        </button>
      </Link>

      <h2>📜 Terms & Conditions</h2>

      <p>
        Medi-Time AI is a medication reminder application only.
      </p>

      <p>
        This app does not provide medical advice or diagnosis.
      </p>

      <p>
        Users are responsible for verifying all medication details with a
        qualified healthcare professional.
      </p>

      <p>
        The developers are not responsible for misuse or missed reminders.
      </p>
    </div>
  );
}