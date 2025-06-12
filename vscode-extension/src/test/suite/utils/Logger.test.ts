import * as assert from 'assert';
import { Logger } from '../../../utils/Logger';

describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger();
    });

    it('should create logger instance', () => {
        assert.ok(logger);
        assert.strictEqual(typeof logger.debug, 'function');
        assert.strictEqual(typeof logger.info, 'function');
        assert.strictEqual(typeof logger.warn, 'function');
        assert.strictEqual(typeof logger.error, 'function');
    });

    it('should log debug messages', () => {
        // Test that debug method exists and can be called
        assert.doesNotThrow(() => {
            logger.debug('Test debug message');
        });
    });

    it('should log info messages', () => {
        // Test that info method exists and can be called
        assert.doesNotThrow(() => {
            logger.info('Test info message');
        });
    });

    it('should log warning messages', () => {
        // Test that warn method exists and can be called
        assert.doesNotThrow(() => {
            logger.warn('Test warning message');
        });
    });

    it('should log error messages', () => {
        // Test that error method exists and can be called
        assert.doesNotThrow(() => {
            logger.error('Test error message');
        });
    });

    it('should handle error objects', () => {
        const error = new Error('Test error');
        
        assert.doesNotThrow(() => {
            logger.error('Error occurred:', error);
        });
    });

    it('should handle string messages', () => {
        assert.doesNotThrow(() => {
            logger.info('Simple string message');
        });
    });
}); 