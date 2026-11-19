require('dotenv').config();
const app = require('./app');
const { autoSyncShowsIfNeeded } = require('./db/autoSync');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Eventra API Server running on port ${PORT}`);
  try {
    await autoSyncShowsIfNeeded();
  } catch (err) {
    console.warn('Initial auto-sync note:', err.message);
  }
});
