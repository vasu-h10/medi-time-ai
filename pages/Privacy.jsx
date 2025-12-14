import Link from "next/link";

export default function Privacy() {
  return (
    <div style={{ padding: 20 }}>
      {/* BACK BUTTON */}
      <Link href="/">
        <button style={{
          marginBottom: 16,
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f1f5f9",
          cursor: "pointer"
        }}>
          ← Back
        </button>
      </Link>

      <h2>🔒 Privacy Policy</h2>
      <p>All data is stored locally in your browser.</p>
    </div>
  );
}