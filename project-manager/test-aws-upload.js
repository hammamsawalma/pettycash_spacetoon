const fs = require('fs');

async function test() {
  console.log("Authenticating...");
  const loginRes = await fetch('http://54.93.172.83:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'root@pocket.com', password: '123456', branch: 'QA' })
  });
  const cookies = loginRes.headers.get("set-cookie");
  if (!cookies) return console.log("Login failed: " + loginRes.status);
  const authCookie = cookies.split(';')[0];
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(__dirname + '/test-upload.xlsx'));

  console.log("Uploading test-upload.xlsx...");
  const fetchMod = await import('node-fetch');
  const myFetch = fetchMod.default;

  const res = await myFetch("http://54.93.172.83:3000/api/parse-purchases", {
    method: "POST",
    body: form,
    headers: { "Cookie": authCookie }
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
test();
