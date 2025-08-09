require('dotenv').config();

const express = require('express');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function testDbConnection() {
  try {
    await db.sequelize.authenticate();
    console.log('Connection to the database has been established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await testDbConnection();
});
