// Find which chat has this API key in production
const apiKey = "tk_mhs74nmn_u66fbdutm1";

console.log("Searching for chat with API key:", apiKey);
console.log("Expected chat ID (from API key format):", apiKey.split("_")[1]);

// We need to query Convex directly to find the chat
// Since we don't have a direct query for this, let's check the expected chat ID
const expectedChatId = apiKey.split("_")[1]; // "mhs74nmn"

fetch("https://agile-ermine-199.convex.cloud/api/run/chats/getChatByChatIdField", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    args: { chatId: expectedChatId },
    format: "json"
  })
})
.then(res => res.json())
.then(data => {
  console.log("\nChecking chat ID:", expectedChatId);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (data.value) {
    console.log("\n✅ Found chat!");
    console.log("Chat ID:", data.value.chatId);
    console.log("Title:", data.value.title);
    console.log("API Key matches:", data.value.apiKey === apiKey);
    console.log("Has Published Settings:", !!data.value.publishedSettings);

    if (data.value.apiKey !== apiKey) {
      console.log("\n⚠️  API key mismatch!");
      console.log("Expected:", apiKey);
      console.log("Actual:", data.value.apiKey);
    }
  } else {
    console.log("\n❌ No chat found with that ID either");
    console.log("\n💡 The API key format doesn't match a chat in your database.");
    console.log("You need to:");
    console.log("1. Go to your web interface");
    console.log("2. Open a chat");
    console.log("3. Generate an API key");
    console.log("4. Copy BOTH the chat ID and API key from the UI");
    console.log("5. Use those matching values in your Python code");
  }
})
.catch(err => {
  console.error("Error:", err.message);
});

