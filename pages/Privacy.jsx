import Link from "next/link";

export default function Privacy() {
  return (
    <div style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      {/* Back Button */}
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

      <h2>🔒 Privacy Policy</h2>

      <p>
        Medi-Time AI does not collect, store, or transmit personal data to any
        server.
      </p>

      <p>
        All reminder data is stored locally on your device using browser storage.
      </p>

      <p>
        No data is shared with third parties.
      </p>

      <p>
        Removing the app will permanently delete all stored data.
      </p>
    </div>
  );
}