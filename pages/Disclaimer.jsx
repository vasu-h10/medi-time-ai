import Link from "next/link";

export default function Disclaimer() {
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

      <h2>⚠️ Disclaimer</h2>

      <p>
        Medi-Time AI is not a medical device.
      </p>

      <p>
        It should not be used as a substitute for professional medical advice.
      </p>

      <p>
        Always consult your doctor for medical decisions.
      </p>

      <p>
        Use of this app is at your own risk.
      </p>
    </div>
  );
}