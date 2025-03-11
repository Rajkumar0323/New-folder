import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react"; // Use QRCodeSVG
import { QrReader } from "react-qr-reader";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000"); // WebSocket connection

const App = () => {
  const [userName, setUserName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [notification, setNotification] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [showScanner, setShowScanner] = useState(false); // Scanner visibility

  useEffect(() => {
    if (loggedIn) {
      socket.emit("register", userName);

      socket.on("qr-request", ({ scannerName }) => {
        playSound();
        setScannedData(scannerName);
        setNotification(true);
      });

      socket.on("login-status", ({ status }) => {
        setLoginStatus(status);
        setNotification(false);
      });

      return () => {
        socket.off("qr-request");
        socket.off("login-status");
      };
    }
  }, [loggedIn, userName]);

  const playSound = () => {
    const audio = new Audio("/assets/ecord.mp3");
    audio.play().catch((err) => console.error("Error playing sound:", err));
  };

  const handleResponse = (response) => {
    socket.emit("login-response", { scannerName: scannedData, status: response });
    setNotification(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>QR Code Login System</h2>

      {/* Login Form */}
      {!loggedIn ? (
        <div>
          <h3>Enter Your Name</h3>
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={() => setLoggedIn(true)}>Login</button>
        </div>
      ) : (
        <>
          {/* QR Code Display */}
          <div>
            <h3>Your QR Code</h3>
            <QRCodeSVG value={userName} size={200} />
            <p>Share this QR for login</p>
          </div>

          {/* Toggle Scanner */}
          <button onClick={() => setShowScanner(!showScanner)}>
            {showScanner ? "Hide Scanner" : "Scan QR Code"}
          </button>

          {/* QR Scanner (Only Visible When Toggled) */}
          {showScanner && (
            <div>
              <h3>Scan QR Code</h3>
              <QrReader
                delay={500} // Avoid continuous scanning
                style={{ width: "100%" }}
                constraints={{ facingMode: "environment" }} // Use rear camera if possible
                onResult={(result, error) => {
                  if (result) {
                    setShowScanner(false); // Hide scanner after successful scan
                    socket.emit("qr-scanned", { ownerName: result.text, scannerName: userName });
                  }
                  if (error) {
                    console.error("QR Scan Error:", error);
                  }
                }}
              />
            </div>
          )}

          {/* Accept/Decline Notification */}
          {notification && (
            <div style={{ background: "#f8d7da", padding: "10px", marginTop: "20px" }}>
              <h4>Login Request from {scannedData}!</h4>
              <button onClick={() => handleResponse("Accepted")} style={{ marginRight: "10px" }}>
                ✅ Accept
              </button>
              <button onClick={() => handleResponse("Declined")}>❌ Decline</button>
            </div>
          )}

          {/* Login Status */}
          {loginStatus && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                background: loginStatus === "Accepted" ? "#d4edda" : "#f8d7da",
              }}
            >
              <h4>{loginStatus === "Accepted" ? "✅ Login Successful!" : "❌ Access Denied!"}</h4>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
