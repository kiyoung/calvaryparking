var mysql = require("mysql");
const db = require("express").Router();

const pool = mysql.createPool({
    host: "db.calvary.gabia.io",
    user: "calvary",
    password: "rkfqhflryghl1!", //갈보리교회1!
    database: "dbcalvary",
    timezone: "Asia/Seoul",
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

db.connection = {
    query: function () {
        const queryArgs = arguments;
        return new Promise((resolve, reject) => {
            pool.getConnection(function (err, connection) {
                if (err) {
                    return reject(err);
                }

                connection.query(...queryArgs, (error, rows) => {
                    connection.release();
                    if (error) {
                        return reject(error);
                    }
                    resolve(rows);
                });
            });
        });
    }
};

// Pool 에러 핸들링
pool.on('error', function (err) {
    console.log('DB Pool 에러:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Lost connection to database. Reconnecting...');
    }
});

module.exports = db;