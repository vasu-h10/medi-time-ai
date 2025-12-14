import Link from "next/link";

export default function Terms() {
  return (
    <div style={{ padding: 20 }}>
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

      <h2>📜 Terms & Conditions</h2>
      <p>Medi-Time terms & conditions.</p>
    </div>
  );
}