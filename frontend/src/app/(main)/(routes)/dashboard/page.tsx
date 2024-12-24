"use client";

import { Input } from "@nextui-org/input";
import { useState, useEffect } from "react";
import InputMock from "../../components/text-input-mock";

export default function Dashboard() {
  // State variables
  const [result, setResult] = useState<string>("");
  const [name, setName] = useState<string>("example");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchData(name);
  };

  // TypeScript interfaces
  interface SayHelloResponse {
    data: {
      sayHello: string;
    };
  }

  interface SayHelloVariables {
    name: string;
  }

  // Function to fetch data from the API
  async function fetchSayHello(variables: SayHelloVariables): Promise<string> {
    const query = `query SayHello($name: String) {
      sayHello(name: $name)
    }`;

    const response = await fetch("http://localhost:8686/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as SayHelloResponse;
    return result.data.sayHello;
  }

  // Function to handle data fetching and state updates
  const fetchData = async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const greeting = await fetchSayHello({ name });
      setResult(greeting);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData(name);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
      {/* Form for user input */}
      <form onSubmit={handleSubmit} className="mb-4 w-full max-w-sm">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          fullWidth
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </form>

      {/* Display loading, error, or result */}
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {result && <p className="text-green-500">Result: {result}</p>}

      {/* Additional component */}
      <InputMock />
    </div>
  );
}
