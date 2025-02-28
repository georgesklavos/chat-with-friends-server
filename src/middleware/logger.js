const winston = require("winston");

// const logger = winston.createLogger({
//   format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
//   transports: [
//     new winston.transports.Console({
//       level: 'info'
//     }),
//     new winston.transports.File({
//       filename: './logs/error.log',
//       level: 'error'
//     }),
//     new winston.transports.File({
//       filename: './logs/combined.log'
//     })
//   ]
// });

const options = {
  file: {
    level: "info",
    filename: `./logs/combined.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true
  },
  errorFile: {
    level: "error",
    filename: `./logs/error.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  }
};

// instantiate a new Winston Logger with the settings defined above
const logger = new winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
    new winston.transports.File(options.errorFile)
  ],
  exitOnError: false // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  }
};

module.exports = logger;
