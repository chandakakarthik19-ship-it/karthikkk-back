const express = require('express');
const app = express();

// Basic route
app.get('/', (req, res) => {
  res.send('🚀 Express server is running successfully!');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
