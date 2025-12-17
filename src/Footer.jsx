// src/Footer.jsx
import "./styles/footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <p className="footer-text">
        © 2025 Medi-Time AI • All rights reserved
      </p>

      <div className="footer-links">
        <a
          href="/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>

        <a
          href="/terms.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms & Conditions
        </a>

        <a
          href="/disclaimer.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Disclaimer
        </a>
      </div>
    </footer>
  );
}
