const logger = require("../logger.js");

let init = function(db) {
	db.schema.hasTable("urls").then(exists => {
		if (!exists) {
			db.schema
				.createTable("urls", function(table) {
					table.increments("id").primary();
					table.string("short");
					table.string("url");
					table.string("ip");
					table.timestamp("timestamp").defaultTo(db.fn.now());
				})
				.then(() => {
					logger.log(`urls table ready`, "ready");
				});
		} else {
			return;
		}
	});
	db.schema.hasTable("duplicates").then(exists => {
		if (!exists) {
			db.schema
				.createTable("duplicates", function(table) {
					table.increments("id").primary();
					table.string("short");
					table.string("ip");
					table.timestamp("timestamp").defaultTo(db.fn.now());
				})
				.then(() => {
					logger.log(`duplicates table ready`, "ready");
				});
		} else {
			return;
		}
	});
};

module.exports = init;
