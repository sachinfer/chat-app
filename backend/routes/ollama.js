const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  try {
    const ollamaRes = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/generate',
      data: { model: 'llama3.2:1b', prompt },
      responseType: 'stream'
    });

    let fullResponse = '';
    ollamaRes.data.on('data', chunk => {
      // Each chunk is a JSON line
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) fullResponse += parsed.response;
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    ollamaRes.data.on('end', () => {
      res.json({ response: fullResponse.trim() });
    });

    ollamaRes.data.on('error', err => {
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error || err.message });
  }
});

module.exports = router; 