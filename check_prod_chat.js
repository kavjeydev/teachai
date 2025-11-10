// Quick script to check production Convex database
// Run with: node check_prod_chat.js

const chatId = "j57cq1sb5fd3pp8psnvx991e1x7shtvk";
const apiKey = "tk_mhs74nmn_u66fbdutm1";

console.log("Checking chat:", chatId);
console.log("API key:", apiKey);
console.log("\nExpected chat ID from API key (React SDK logic):", apiKey.split("_")[1]);

// Make a request to production Convex
fetch("https://agile-ermine-199.convex.cloud/api/run/chats/getChatByChatIdField", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    args: { chatId: chatId },
    format: "json"
  })
})
.then(res => res.json())
.then(data => {
  console.log("\nProduction Convex response:");
  console.log(JSON.stringify(data, null, 2));

  if (data.value) {
    console.log("\n✅ Chat found!");
    console.log("Chat ID:", data.value.chatId);
    console.log("API Key (first 20 chars):", data.value.apiKey?.substring(0, 20) + "...");
    console.log("API Key matches:", data.value.apiKey === apiKey);
    console.log("Has Published Settings:", !!data.value.publishedSettings);
  } else {
    console.log("\n❌ Chat not found in production database");
  }
})
.catch(err => {
  console.error("Error:", err.message);
});

