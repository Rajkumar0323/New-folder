import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrReader } from "react-qr-reader";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000"); // WebSocket server URL

const App = () => {
  const [userName, setUserName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [notification, setNotification] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);

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

  // Play ring sound when a QR scan request is received
  const playSound = () => {
    const audio = new Audio("/ring.mp3");
    audio.play().catch((err) => console.error("Error playing sound:", err));
  };

  const handleResponse = (response) => {
    socket.emit("login-response", { scannerName: scannedData, status: response });
    setNotification(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>QR Code Login System</h2>

      {!loggedIn ? (
        <div>
          <h3>Enter Your Name</h3>
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button
            onClick={() => {
              if (userName.trim() !== "") {
                setLoggedIn(true);
              } else {
                alert("Please enter a valid name!");
              }
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <>
          <div>
            <h3>Your QR Code</h3>
            <QRCodeSVG value={userName} size={200} />
            <p>Share this QR for login</p>
          </div>

          <div>
            <h3>Scan QR Code</h3>
            <QrReader
              constraints={{ video: true }} // Ensures camera access
              delay={300}
              style={{ width: "100%" }}
              onResult={(result, error) => {
                if (result) {
                  socket.emit("qr-scanned", { ownerName: result.text, scannerName: userName });
                }
                if (error) {
                  console.error("QR Scan Error:", error);
                }
              }}
            />
          </div>

          {notification && (
            <div style={{ background: "#f8d7da", padding: "10px", marginTop: "20px" }}>
              <h4>Login Request from {scannedData}!</h4>
              <button onClick={() => handleResponse("Accepted")} style={{ marginRight: "10px" }}>
                ✅ Accept
              </button>
              <button onClick={() => handleResponse("Declined")}>❌ Decline</button>
            </div>
          )}

          {loginStatus && (
            <div style={{ marginTop: "20px", padding: "10px", background: loginStatus === "Accepted" ? "#d4edda" : "#f8d7da" }}>
              <h4>{loginStatus === "Accepted" ? "✅ Login Successful!" : "❌ Access Denied!"}</h4>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
