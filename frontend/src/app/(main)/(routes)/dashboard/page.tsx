"use client";

import { Input, Textarea } from "@nextui-org/input";
import { useState } from "react";
import InputMock, { SearchIcon } from "../../components/text-input-mock";

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  };
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {/* <Textarea className="w-80" placeholder="enter questions here" /> */}
      <InputMock />
    </div>
  );
}
