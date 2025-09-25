// Example: Super Simple Chat App with Trainly SDK
// This shows how easy it is to build a complete RAG app

import React from "react";
import {
  TrainlyProvider,
  TrainlyChat,
  TrainlyUpload,
  TrainlyStatus,
} from "@trainly/react";

// 1. Wrap your app with TrainlyProvider
function App() {
  return (
    <TrainlyProvider appSecret="as_demo_secret_123">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">My Document Assistant</h1>
            <TrainlyStatus />
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-6">
          {/* File upload area */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
            <TrainlyUpload
              onUpload={(files) => {
                console.log(
                  "Uploaded:",
                  files.map((f) => f.name),
                );
                alert(`Uploaded ${files.length} file(s) successfully!`);
              }}
              onError={(error) => {
                console.error("Upload error:", error);
                alert(`Upload failed: ${error}`);
              }}
            />
          </div>

          {/* Chat interface */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                Chat with Your Documents
              </h2>
            </div>
            <TrainlyChat
              height="500px"
              placeholder="Ask anything about your documents..."
              showCitations={true}
              enableFileUpload={true}
              onMessage={(message) => {
                console.log("New message:", message);
              }}
              onError={(error) => {
                console.error("Chat error:", error);
              }}
            />
          </div>
        </main>
      </div>
    </TrainlyProvider>
  );
}

export default App;
