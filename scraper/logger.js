// Logging function
module.exports.log = function(type, source, msg) {
    if (type == TYPE.SEVERE_PROBLEM) msg = msg.toUpperCase();
    if (type == TYPE.DEGUB && process.env.DEBUG != 'TRUE') return;
    console.log(`[${type}] ${source}: ${msg}`);
}

// Types of logs
const TYPE = {
    INFO: '+',
    ERROR: '-',
    SEVERE_PROBLEM: '!',
    DEGUB: 'DEBUG',
};
module.exports.TYPE = TYPE;

// Source of the log
const SOURCE = {
    API: 'API',
    DB: 'DB',
    SYSTEM: 'SYSTEM',
};
module.exports.SOURCE = SOURCE;