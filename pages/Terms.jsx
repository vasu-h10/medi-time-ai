export default function Terms() {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={goBack} style={{
        marginBottom: 16,
        padding: "10px 14px",
        borderRadius: 6,
        border: "1px solid #ccc",
        background: "#f1f5f9",
        cursor: "pointer"
      }}>
        ← Back
      </button>

      <h2>📜 Terms & Conditions</h2>
      <p>Medi-Time terms & conditions.</p>
    </div>
  );
}