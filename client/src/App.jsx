import React from "react";
import Balloons from "./components/Balloons";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-200 via-blue-100 to-pink-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4 drop-shadow">
        🎈 Baby Bounce
      </h1>
      <p className="text-gray-600 mb-6">
        Speak into your mic — louder voice makes balloons jump higher!
      </p>
      <Balloons />
    </div>
  );
}
