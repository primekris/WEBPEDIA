const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_ONTODAY = 'https://byabbe.se/on-this-day/';
const PORT = process.env.PORT || 8080;

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });

    try {
        // First try direct summary
        const response = await axios.get(`${WIKI_API}/page/summary/${encodeURIComponent(query)}`);
        res.json(response.data);
    } catch {
        try {
            // Fallback to Wikipedia search API
            const searchResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
                params: {
                    action: 'query',
                    list: 'search',
                    srsearch: query,
                    format: 'json',
                    origin: '*'
                }
            });

            if (searchResponse.data.query.search.length > 0) {
                const firstResult = searchResponse.data.query.search[0].title;
                const summaryResponse = await axios.get(`${WIKI_API}/page/summary/${encodeURIComponent(firstResult)}`);
                res.json(summaryResponse.data);
            } else {
                res.status(404).json({ error: 'No results found' });
            }
        } catch {
            res.status(500).json({ error: 'Wikipedia search failed' });
        }
    }
});


app.get('/api/random', async (req, res) => {
    try {
        const response = await axios.get(`${WIKI_API}/page/random/summary`);
        res.json(response.data);
    } catch {
        res.status(500).json({ error: 'Failed to fetch random article.' });
    }
});

app.get('/api/on-this-day', async (req, res) => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    try {
        const response = await axios.get(`${WIKI_ONTODAY}/${month}/${day}/events.json`);
        res.json(response.data);
    } catch {
        res.status(500).json({ error: 'Failed to fetch on-this-day data.' });
    }
});

app.get('/api/daily-fact', async (req, res) => {
    try {
        const response = await axios.get(`${WIKI_API}/page/random/summary`);
        res.json({
            title: response.data.title,
            extract: response.data.extract
        });
    } catch {
        res.status(500).json({ error: 'Failed to fetch daily fact.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.listen(PORT, () => console.log(`WikiGenie backend running on port ${PORT}`));
