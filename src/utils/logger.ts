import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf((info) => {
      return `${info.timestamp} - ${info.service || 'Agent'} - ${info.level.toUpperCase()} - ${info.message}`;
    })
  ),
  defaultMeta: { service: 'Agent' },
  transports: [
    new winston.transports.Console(),
  ],
});

export const createLogger = (service: string) => {
    return logger.child({ service: service });
};

export default logger;
