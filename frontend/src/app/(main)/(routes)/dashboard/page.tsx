"use client";

import { Input, Textarea } from "@nextui-org/input";
import { useState } from "react";
import InputMock, { SearchIcon } from "../../components/text-input-mock";

export default async function Dashboard() {
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  };

  const query = `
  query {
    classifyText(text: "Your text here", threshold: 0.5)
  }
`;

  const response = await fetch("https://<your-project>.hypermode.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {/* <Textarea className="w-80" placeholder="enter questions here" /> */}
      <InputMock />
    </div>
  );
}
