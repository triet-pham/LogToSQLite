/*This is a nodejs script*/
"use strict";
var alias = null;
var HTMLTemplate = null;
const sqlite3 = require('sqlite3').verbose();
const maxRowCount = 2000;
const dbFile = 'data.db';

// var q = process.argv[2]; // call this script from command line like this `node this_script_filename "select * limit 10"`
// handleQueryFromSlack(q || "select * from issue limit 10", "@triet");

/** run the query q and call callbackFunc with resultant rows
* callbackFunc(err, rows)
*/
var queryData = function(q, callbackFunc, unlimitted) {
	if (typeof callbackFunc != 'function') throw 'Invalid params! Callback function is ' + callbackFunc;
	if (!q || typeof q != 'string') {
		callbackFunc('Invalid query', null);
		return;
	}

	var myq = q.trim();
  var lowerQ = myq.toLowerCase();
  if (unlimitted !== true && (
      lowerQ.startsWith('drop') ||
      lowerQ.startsWith('truncate') ||
      lowerQ.startsWith('delete') ||
      lowerQ.startsWith('insert') ||
      lowerQ.startsWith('update'))
     )
  {
    callbackFunc('Only support SELECT query', null);
  } else {
    if (unlimitted !== true && !lowerQ.match(/limit\s+[0-9]+/)) {
      if (myq.endsWith(';')) myq = myq.substr(0, myq.length - 1);
			myq += ' LIMIT ' + maxRowCount;
		}
		const db = new sqlite3.Database(dbFile);
		db.all(myq,
			function cbQuery(err, rows) {
				if (err) {
					let msg = err;
				  if (myq != q) {
				    msg = 'Your query has been translated to ' + myq + '\n' + msg;
				  }
				  callbackFunc(msg, rows);
				}
				else callbackFunc(null, rows);
			}
		);
		db.close();
	}
}

/** query and return resultant data
* @param {string} query
* @param cbFunc(err, data)
* data is a 2D array, each element is a row, first row is the data header
*/
function querySQLite (query, cbFunc) {
	if (!cbFunc) return;
	queryData(query, function cbQuerySQLite(err, rows) {
		if (err || !rows) {
			cbFunc(err, null);
		}
		else {
			let header = [];
			for (var key in rows[0]) {
				header.push(key);
			}

			let data = [];
			data.push(header);
			rows.forEach(row => {
				let item = [];
				header.forEach(col => {
					item.push(row[col]);
				});
				data.push(item);
			});

			cbFunc(null, data);
		}
	}, true);
}
module.exports.querySQLite = querySQLite;
