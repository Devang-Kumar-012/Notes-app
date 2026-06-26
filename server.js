const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname);

app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Notes app server running at http://localhost:${port}`);
});
