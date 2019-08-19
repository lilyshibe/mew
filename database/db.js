let init = function(db) {
    db.schema.hasTable('urls').then(exists => {
        if (!exists) {
            db.schema.createTable('urls', function (table) {
                table.increments('id').primary();
                table.string('short');
                table.string('url');
            }).then(() => {
                console.log(`urls table ready`);
            });
        }

        else {
            return;
        }
    });
};

module.exports = init;