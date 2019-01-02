const parseString = require("xml2js").parseString;
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("cache/localdb.sqlite");

