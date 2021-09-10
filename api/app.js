const db = require('./database')

const express    = require('express');
const app = express();
const port = process.env.PORT;


//app.use(express.urlencoded());

app.get('/top/:ticker', async (req, res) => {
    res.send(await db.top(req.params.ticker));
});

app.listen(port, () => {
    console.log('API running on port ' + port);
});