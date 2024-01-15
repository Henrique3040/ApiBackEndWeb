const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Create a connection
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'star_wars',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});


app.get('/characters', (req, res) => {
  const { limit, offset } = req.query;

  if (limit !== undefined || offset !== undefined) {
    // If limit and/or offset are provided, use them for paginated results
    const query = 'SELECT * FROM characters LIMIT ? OFFSET ?';
    const values = [parseInt(limit) || 10, parseInt(offset) || 0];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error getting paginated characters:', error.sql);
        console.error('Query parameters:', error.sqlMessage);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
      } else {
        res.status(200).json(results);
      }
    });
  } else {

    // If limit and offset are not provided, retrieve all characters
    const query = 'SELECT * FROM characters';

    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error getting characters:', error.sql);
        console.error('Query parameters:', error.sqlMessage);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
      } else {
        res.status(200).json(results);
      }
    });
  }
});


// search by name

app.get('/characters/search', (req, res) => {
  const { name } = req.query;
  const query = 'SELECT * FROM characters WHERE name LIKE ?';
  const values = [`%${name}%`];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error searching characters:', error.sql);
      console.error('Query parameters:', error.sqlMessage);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } else {
      res.status(200).json(results);
    }
  });
});



app.post('/characters', (req, res) => {
  const { name, description, age } = req.body;

  // Basic validation
  if (!name || !description || !age) {
    return res.status(400).json({ error: 'Name, description and age are required fields' });
  }

  if (typeof name !== 'string' || typeof description !== 'string') {
    return res.status(400).json({ error: 'Name and description must be strings' });
  }

  if (typeof age !== 'number') {
    return res.status(400).json({ error: 'Age must be a number' });
  }

  // Additional validation for name (no numbers)
  if (/\d/.test(name)) {
    return res.status(400).json({ error: 'Name cannot contain numbers' });
  }

  const query = 'INSERT INTO characters (name, description, age) VALUES (?, ?, ?)';
  const values = [name, description, age];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error creating character:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({ message: 'Character created successfully', characterId: results.insertId });
    }
  });
});


app.put('/characters/:id', (req, res) => {
  const characterId = req.params.id;
  const { name, description, age } = req.body;

  // Check if the character with the given ID exists
  const checkQuery = 'SELECT * FROM characters WHERE id = ?';
  const checkValues = [characterId];

  connection.query(checkQuery, checkValues, (checkError, checkResults) => {
    if (checkError) {
      console.error('Error checking character existence:', checkError.sql);
      console.error('Query parameters:', checkError.sqlMessage);
      return res.status(500).json({ error: 'Internal Server Error', details: checkError.message });
    }

    if (checkResults.length === 0) {
      // Character with the given ID does not exist
      return res.status(404).json({ error: 'Character not found' });
    }

    // Update character in the database
    const updateQuery = 'UPDATE characters SET name = ?, description = ?, age = ? WHERE id = ?';
    const updateValues = [name, description, age, characterId];

    if (!name || !description || !age) {
      return res.status(400).json({ error: 'Name, description and age are required fields' });
    }
  
    if (typeof name !== 'string' || typeof description !== 'string') {
      return res.status(400).json({ error: 'Name and description must be strings' });
    }
  
    if (typeof age !== 'number') {
      return res.status(400).json({ error: 'Age must be a number' });
    }

    // Additional validation for name (no numbers)
    if (/\d/.test(name)) {
      return res.status(400).json({ error: 'Name cannot contain numbers' });
    }

    connection.query(updateQuery, updateValues, (updateError, updateResults) => {
      if (updateError) {
        console.error('Error updating character:', updateError.sql);
        console.error('Query parameters:', updateError.sqlMessage);
        return res.status(500).json({ error: 'Internal Server Error', details: updateError.message });
      } else {
        return res.status(200).json({ message: 'Character updated successfully', characterId });
      }
    });
  });
});



app.delete('/characters/:id', (req, res) => {
  const characterId = req.params.id;

  // Delete character from the database
  const deleteQuery = 'DELETE FROM characters WHERE id = ?';
  const deleteValues = [characterId];

  connection.query(deleteQuery, deleteValues, (error, results) => {
    if (error) {
      console.error('Error deleting character:', error.sql);
      console.error('Query parameters:', error.sqlMessage);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } else {
      res.status(200).json({ message: 'Character deleted successfully', characterId });
    }
  });
});



// Cruds operations for droids

app.post('/droids', (req, res) => {
  const { name, description, belongs } = req.body;

  // Basic validation
  if (!name || !description || !belongs) {
    return res.status(400).json({ error: 'Name, description, and belongs are required fields' });
  }

  if (typeof name !== 'string' || typeof description !== 'string' || typeof belongs !== 'string') {
    return res.status(400).json({ error: 'Name, description, and belongs must be strings' });
  }

  const query = 'INSERT INTO droids (name, description, belongs) VALUES (?, ?, ?)';
  const values = [name, description, belongs];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error creating droid:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({ message: 'Droid created successfully', droidId: results.insertId });
    }
  });
});

// Return droids with limit and offset
app.get('/droids', (req, res) => {
  const { limit, offset } = req.query;
  const query = 'SELECT * FROM droids LIMIT ? OFFSET ?';
  const values = [parseInt(limit) || 10, parseInt(offset) || 0];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error getting droids:', error.sql);
      console.error('Query parameters:', error.sqlMessage);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } else {
      res.status(200).json(results);
    }
  });
});

// Update droid
app.put('/droids/:id', (req, res) => {
  const droidId = req.params.id;
  const { name, description, belongs } = req.body;

  const checkQuery = 'SELECT * FROM droids WHERE id = ?';
  const checkValues = [droidId];

  connection.query(checkQuery, checkValues, (checkError, checkResults) => {
    if (checkError) {
      console.error('Error checking droid existence:', checkError.sql);
      console.error('Query parameters:', checkError.sqlMessage);
      return res.status(500).json({ error: 'Internal Server Error', details: checkError.message });
    }

    if (checkResults.length === 0) {
      // Droid with the given ID does not exist
      return res.status(404).json({ error: 'Droid not found' });
    }

    // Update droid in the database
    const updateQuery = 'UPDATE droids SET name = ?, description = ?, belongs = ? WHERE id = ?';
    const updateValues = [name, description, belongs, droidId];

    if (!name || !description || !belongs) {
      return res.status(400).json({ error: 'Name, description, and belongs are required fields' });
    }

    if (typeof name !== 'string' || typeof description !== 'string' || typeof belongs !== 'string') {
      return res.status(400).json({ error: 'Name, description, and belongs must be strings' });
    }

    connection.query(updateQuery, updateValues, (updateError, updateResults) => {
      if (updateError) {
        console.error('Error updating droid:', updateError.sql);
        console.error('Query parameters:', updateError.sqlMessage);
        return res.status(500).json({ error: 'Internal Server Error', details: updateError.message });
      } else {
        return res.status(200).json({ message: 'Droid updated successfully', droidId });
      }
    });
  });
});

// Delete droid
app.delete('/droids/:id', (req, res) => {
  const droidId = req.params.id;

  const deleteQuery = 'DELETE FROM droids WHERE id = ?';
  const deleteValues = [droidId];

  connection.query(deleteQuery, deleteValues, (error, results) => {
    if (error) {
      console.error('Error deleting droid:', error.sql);
      console.error('Query parameters:', error.sqlMessage);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } else {
      res.status(200).json({ message: 'Droid deleted successfully', droidId });
    }
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
