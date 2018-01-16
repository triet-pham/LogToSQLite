'use strict';
const sqlite3 = require('sqlite3').verbose();
const dbFile = 'data.db';
const dataFile = 'data.json';
const logTable = 'LOG';
const tableColumns = [
  'MESSAGE',
  'LOG_TIME',
  'MESSAGE_TIME',
  'USER'
];
let insertScript = "INSERT INTO " + logTable + " VALUES (";
tableColumns.forEach(_ => insertScript += '?, ');
insertScript = insertScript.substr(0, insertScript.length - 2) + ')';

/** (re)init the database and remove all current data (if any)
* @param cbFunc(err)
*/
function nukeDB (cbFunc) {
  if (!cbFunc) cbFunc = function(){};
  const db = new sqlite3.Database(dbFile);
  db.serialize(function() {
    db.run('DROP TABLE IF EXISTS ' + logTable, function(err) {
    	if (err) {
    		cbFunc('Fail to init database. ' + err);
    		throw err;
    	}
    });

    let createScript = 'CREATE TABLE ' + logTable + ' (';
    tableColumns.forEach( col => {
      createScript += col + ' TEXT, ' ;
    });
    createScript = createScript.substr(0, createScript.length - 2) + ')';

    db.run(createScript, function(err) {
    	if (err) {
    		cbFunc('Fail to init database. ' + err);
    		throw err;
    	}
    });
	});
	db.close(function(err) {
		cbFunc(err);
	});
}

function addRowsToDB(rows, cbFunc) {
  if (!cbFunc) cbFunc = function(){};
  const db = new sqlite3.Database(dbFile);
  db.serialize(function() {
    rows.forEach(row => db.run(insertScript, row));
  });
  db.close(err => cbFunc(err));
}

function parseData(json) {
  let row = null;
  if (json['_source']) {
    let source = json['_source'];
    if (source['message'] && source['@timestamp']) {
      row = [];
      let t = source['message'].match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
      if (t) t = t[0].replace(' ', 'T') + '.000Z';

      let user = source['message'].match(/[a-zA-Z0-9-_.]+@[a-zA-Z0-9-_.]+/);
      if (user) user = user[0];

      tableColumns.forEach(col => {
        switch (col) {
          case 'MESSAGE': row.push(source['message']); break;
          case 'LOG_TIME': row.push(source['@timestamp']); break;
          case 'MESSAGE_TIME': row.push(t); break;
          case 'USER': row.push(user); break;
        }
      });
    }
  }
  return row;
}

function updateDB(cbFunc) {
  if (!cbFunc) cbFunc = function(){};
  const readline = require('readline');
  const fs = require('fs');
  const rl = readline.createInterface({
    input: fs.createReadStream(dataFile)
  });

  var rows = [];
  rl.on('line', function (line) {
    let row = parseData(JSON.parse(line));
    if (row) {
      rows.push(row);
    }
  })
  .on('error', err => {
    cbFunc(err);
  })
  .on('close', () => {
    addRowsToDB(rows, err => {
      if (err) cbFunc(err);
      else console.log('All done!');
    });
  });
}

/** nuke database and init it with data in dataFile
* @param cbFunc(err)
*/
function initDB(cbFunc) {
  nukeDB(err => {
    if (err) cbFunc(err);
    else updateDB(cbFunc);
  });
}

if (process.argv.length === 3) {
  let arg = process.argv[2].toLowerCase();
  if (arg === 'initdb') {
    initDB(err => console.log(err || ''));
  }
  else if (arg === 'updatedb') {
    updateDB(err => console.log(err || ''));
  }
}
