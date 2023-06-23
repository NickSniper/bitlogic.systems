const express = require('express');
const compression = require('compression');
const path = require('path');


const app = express();
const port = 3457;

// Add gzip compression middleware
app.use(compression());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'dist')));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
