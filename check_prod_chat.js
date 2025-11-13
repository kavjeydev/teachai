// Quick script to check production Convex database
// Run with: node check_prod_chat.js

const chatId = "j57cq1sb5fd3pp8psnvx991e1x7shtvk";
const apiKey = "tk_mhs74nmn_u66fbdutm1";

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

})
.catch(err => {
});

