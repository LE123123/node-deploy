const { createLogger, format, transports } = require("winston");

/**
 * createLogger메서드로 logger를 만듭니다. 인수로 logger에 대한 설정을 넣는다.
 * 1. level은 로그의 심각도를 의미합니다
 * 2. format은 로그의 형식입니다
 * 3. transports는 로그 저장 방식을 의미합니다
 */
const logger = createLogger({
  level: "info",
  format: format.json(),
  transports: [
    new transports.File({ filename: "combined.log" }),
    new transports.File({ filename: "error.log", level: "error" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({ format: format.simple() }));
}

module.exports = logger;
