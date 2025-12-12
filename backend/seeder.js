const bcrypt = require('bcrypt');
const db = require('./db'); // your existing db connection

async function seedUsers() {
  const users = [
    {
      full_name: 'Emmanuel Gamba',
      username: 'Emmanuel',
      phone: '09565001128',
      address: 'Manila, Philippines',
      gender: 'Male',
      dob: '2005-03-17',
      email: 'owner@fitstore.com',
      password: 'owner',
      user_type: 'owner'
    },
    {
      full_name: 'Noel Ando',
      username: 'noeladmin',
      phone: '09987654321',
      address: 'Manila, Philippines',
      gender: 'Male',
      dob: '1985-05-05',
      email: 'customer@fitstore.com',
      password: 'customer',
      user_type: 'customer'
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const query = `
      INSERT INTO users (full_name, username, phone, address, gender, dob, email, password, user_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      user.full_name,
      user.username,
      user.phone,
      user.address,
      user.gender,
      user.dob,
      user.email,
      hashedPassword,
      user.user_type
    ];

    db.query(query, params, (err) => {
      if (err) {
        console.log(`Error inserting ${user.user_type}:`, err.message);
      } else {
        console.log(`${user.user_type} created: ${user.email}`);
      }
    });
  }
}


seedUsers().then(() => {
  console.log('Seeding finished');
  process.exit();
});
