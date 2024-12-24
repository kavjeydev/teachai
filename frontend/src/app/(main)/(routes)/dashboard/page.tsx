// pages/dashboard.tsx

"use client";

import { useState } from "react";
import InputMock from "../../components/text-input-mock";

export default function Dashboard() {
  // State variables

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-end p-4">
      {/* Form for user input */}
      <form className="mb-6 w-full max-w-fit">
        <InputMock
          placeholder="How can teachAI help you today?"
          // label="Search"
        />
      </form>
    </div>
  );
}
