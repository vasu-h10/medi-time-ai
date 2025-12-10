export default function Footer() {
  return (
    <footer style={{
      background: "#333",
      color: "#fff",
      padding: "15px 20px",
      textAlign: "center",
      marginTop: "20px"
    }}>
      <p style={{ margin: 0 }}>© 2025 Medi-Time AI • All rights reserved</p>

      <div style={{
        marginTop: "10px",
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        fontSize: "14px"
      }}>
        <a href="/privacy" style={{ color: "#90caf9", textDecoration: "none" }}>Privacy Policy</a>
        <a href="/terms" style={{ color: "#90caf9", textDecoration: "none" }}>Terms & Conditions</a>
        <a href="/disclaimer" style={{ color: "#90caf9", textDecoration: "none" }}>Disclaimer</a>
      </div>
    </footer>
  );
}
