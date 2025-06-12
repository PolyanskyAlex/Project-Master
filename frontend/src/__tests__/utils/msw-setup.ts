import { setupServer } from 'msw/node';
import { handlers } from './api-mocks';

// Настройка MSW сервера для тестов
export const server = setupServer(...handlers);

// Настройка для Jest
beforeAll(() => {
  // Запускаем сервер перед всеми тестами
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Сбрасываем handlers после каждого теста
  server.resetHandlers();
});

afterAll(() => {
  // Закрываем сервер после всех тестов
  server.close();
}); 