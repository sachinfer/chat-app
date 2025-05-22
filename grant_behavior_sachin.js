const fetch = require('node-fetch');

async function grantBehavior() {
  const res = await fetch('http://localhost:5000/api/users/admin/grant-behavior', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'n.sachinf@gmail.com'
    })
  });
  const data = await res.json();
  console.log(data);
}

grantBehavior(); 