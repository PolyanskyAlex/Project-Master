import * as assert from 'assert';
import * as sinon from 'sinon';
import axios from 'axios';
import { ApiService } from '../../../services/ApiService';
import { ConfigurationService } from '../../../services/ConfigurationService';
import { Logger } from '../../../utils/Logger';

suite('ApiService Authentication Tests', () => {
    let apiService: ApiService;
    let configService: ConfigurationService;
    let logger: Logger;
    let axiosStub: sinon.SinonStub;

    setup(() => {
        // Mock ConfigurationService
        configService = {
            getConfig: () => ({
                apiUrl: 'http://localhost:8080',
                apiKey: 'test-api-key-12345',
                webUrl: 'http://localhost:3000',
                autoRefresh: true,
                refreshInterval: 30000,
                defaultProject: '',
                enableNotifications: true,
                logLevel: 'info' as const
            }),
            updateConfiguration: () => {}
        } as ConfigurationService;

        // Mock Logger
        logger = {
            debug: sinon.stub(),
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub()
        } as unknown as Logger;

        // Stub axios.create to return a mock client
        axiosStub = sinon.stub(axios, 'create').returns({
            interceptors: {
                request: { use: sinon.stub() },
                response: { use: sinon.stub() }
            },
            get: sinon.stub(),
            post: sinon.stub(),
            put: sinon.stub(),
            delete: sinon.stub()
        } as any);

        apiService = new ApiService(configService, logger);
    });

    teardown(() => {
        sinon.restore();
    });

    test('should use X-API-Key header instead of Authorization', () => {
        // Verify that axios.create was called with correct headers
        assert.ok(axiosStub.calledOnce, 'axios.create should be called once');
        
        const createCallArgs = axiosStub.getCall(0).args[0];
        const headers = createCallArgs.headers;
        
        // Check that X-API-Key header is used
        assert.strictEqual(headers['X-API-Key'], 'test-api-key-12345', 'Should use X-API-Key header');
        
        // Check that Authorization header is NOT used
        assert.strictEqual(headers['Authorization'], undefined, 'Should not use Authorization header');
        
        // Check other required headers
        assert.strictEqual(headers['Content-Type'], 'application/json', 'Should have Content-Type header');
    });

    test('should not add X-API-Key header when apiKey is empty', () => {
        // Create new config service with empty API key
        const emptyKeyConfigService = {
            getConfig: () => ({
                apiUrl: 'http://localhost:8080',
                apiKey: '',
                webUrl: 'http://localhost:3000',
                autoRefresh: true,
                refreshInterval: 30000,
                defaultProject: '',
                enableNotifications: true,
                logLevel: 'info' as const
            }),
            updateConfiguration: () => {}
        } as ConfigurationService;

        // Reset the stub
        axiosStub.restore();
        axiosStub = sinon.stub(axios, 'create').returns({
            interceptors: {
                request: { use: sinon.stub() },
                response: { use: sinon.stub() }
            },
            get: sinon.stub(),
            post: sinon.stub(),
            put: sinon.stub(),
            delete: sinon.stub()
        } as any);

        // Create new ApiService with empty key
        new ApiService(emptyKeyConfigService, logger);

        const createCallArgs = axiosStub.getCall(0).args[0];
        const headers = createCallArgs.headers;
        
        // Check that X-API-Key header is not present
        assert.strictEqual(headers['X-API-Key'], undefined, 'Should not have X-API-Key header when apiKey is empty');
        
        // Check that Content-Type is still present
        assert.strictEqual(headers['Content-Type'], 'application/json', 'Should still have Content-Type header');
    });

    test('should update configuration and recreate client', () => {
        // Reset the stub to track subsequent calls
        axiosStub.resetHistory();
        
        // Call updateConfiguration
        apiService.updateConfiguration();
        
        // Verify that a new client was created
        assert.ok(axiosStub.calledOnce, 'axios.create should be called again after updateConfiguration');
    });
}); 