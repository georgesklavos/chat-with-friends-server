const { server } = require("./app");
const port = process.env.PORT;
const logger = require("./src/middleware/logger");

server.listen(port, () => {
  logger.info(`Server is up on port ${port}`);
});
