/* This is a nodejs script */
'use strict';
const queryToArray = require('./query.js').querySQLite;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Port = 9090;

//start express server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('static'));
const server = app.listen(Port, () => { console.log('Server is on http://localhost:%d/query.html in %s mode', server.address().port, app.settings.env);});

app.get('/', (req, res) => {
    res.json({"Hello": "world"});
});

app.post('/query', (req, res) => {
	let q = req.body.query; // the query
	if (!q) {
		res.send('Cannot parse this query');
	}
	else {
		queryToArray(q, function(err, rows) {
			if (err) {
				res.send(JSON.stringify({'error': err}));
			} else {
				res.send(JSON.stringify(rows));
			}
		});
	}
});
