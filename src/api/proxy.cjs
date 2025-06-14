const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing url');
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        res.set('Content-Type', contentType);
        response.body.pipe(res);
    } catch (err) {
        res.status(500).send('Error fetching image');
    }
});

app.listen(4000, () => console.log('Proxy listening on port 4000'));