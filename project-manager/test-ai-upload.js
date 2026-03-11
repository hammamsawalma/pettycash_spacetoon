const fs = require('fs');
const xlsx = require('xlsx');

// 1. Create a dummy Excel file
const ws = xlsx.utils.json_to_sheet([
  { description: "HP Printer Ink", quantity: 5, notes: "Black" },
  { description: "A4 Paper", quantity: 10, notes: "80gsm" }
]);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
const filePath = __dirname + "/test-upload.xlsx";
xlsx.writeFile(wb, filePath);

console.log("Excel file created at:", filePath);

// 2. Upload it to localhost:3005
async function testUploadLocal() {
  try {
    console.log("Authenticating...");
    const loginRes = await fetch("http://54.93.172.83/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@pocket.com", password: "admin", branch: "QA" })
    });
    
    const cookies = loginRes.headers.get("set-cookie");
    if (!cookies) throw new Error("No cookies returned from login");
    const authCookie = cookies.split(';')[0];
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log("Sending File to /api/parse-purchases...");
    
    // We import node-fetch dynamically to handle stream
    const fetchMod = await import('node-fetch');
    const myFetch = fetchMod.default;

    const res = await myFetch("http://54.93.172.83/api/parse-purchases", {
      method: "POST",
      body: form,
      headers: {
        "Cookie": authCookie,
      }
    });

    const body = await res.text();
    console.log("Status:", res.status);
    console.log("Response Body:", body);
  } catch(e) {
    console.error("Test Error:", e);
  }
}
testUploadLocal();
