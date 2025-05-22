const fetch = require('node-fetch');

async function register() {
  const res = await fetch('http://localhost:5000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'sachin',
      email: 'n.sachinf@gmail.com',
      password: 'Navoda@701710010',
      canViewBehavior: true
    })
  });
  const data = await res.json();
  console.log(data);
}

register(); 