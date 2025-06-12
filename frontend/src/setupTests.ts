// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Полифиллы для тестовой среды
const { TextEncoder, TextDecoder } = require('util');

// Проверяем, что TextEncoder не определен глобально
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Настройка MSW для тестов (только если нужно)
// import './__tests__/utils/msw-setup';
