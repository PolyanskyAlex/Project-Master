# Тестирование Frontend

Этот проект использует комплексную систему тестирования, включающую unit, integration и E2E тесты.

## Структура тестов

```
src/__tests__/
├── components/          # Unit тесты компонентов
├── hooks/              # Unit тесты хуков
├── services/           # Unit тесты сервисов
├── pages/              # Unit тесты страниц
├── utils/              # Тестовые утилиты и моки
├── integration/        # Integration тесты
├── e2e/               # End-to-End тесты
└── README.md          # Эта документация
```

## Технологии

- **Jest** - Тестовый фреймворк
- **React Testing Library** - Тестирование React компонентов
- **MSW (Mock Service Worker)** - Мокирование API запросов
- **Testing Library User Event** - Симуляция пользовательских действий

## Типы тестов

### Unit тесты
Тестируют отдельные компоненты, хуки и сервисы в изоляции.

**Примеры:**
- `components/LoadingSpinner.test.tsx` - тестирование компонента загрузки
- `hooks/useFunctionalBlocks.test.tsx` - тестирование хука управления данными
- `services/functionalBlockService.test.ts` - тестирование API сервиса

### Integration тесты
Тестируют взаимодействие между компонентами и реальными API.

**Примеры:**
- `integration/FunctionalBlocks.integration.test.tsx` - полный workflow страницы

### E2E тесты
Тестируют пользовательские сценарии от начала до конца.

**Примеры:**
- `e2e/app.e2e.test.tsx` - полные пользовательские workflow

## Запуск тестов

### Все тесты
```bash
npm test
```

### Тесты с покрытием
```bash
npm run test:coverage
```

### Только unit тесты
```bash
npm run test:unit
```

### Только integration тесты
```bash
npm run test:integration
```

### Только E2E тесты
```bash
npm run test:e2e
```

### CI режим
```bash
npm run test:ci
```

## Утилиты для тестирования

### test-utils.tsx
Содержит кастомную функцию `render` с провайдерами и утилиты для создания тестовых данных.

```typescript
import { render, screen } from '../utils/test-utils';

// Автоматически оборачивает компонент в необходимые провайдеры
render(<MyComponent />);
```

### api-mocks.ts
Содержит MSW handlers для мокирования API запросов.

```typescript
import { server } from '../utils/msw-setup';
import { mockApiError } from '../utils/api-mocks';

// Мокирование ошибки API
server.use(mockApiError('/api/v1/endpoint', 500, 'Server error'));
```

### Создание тестовых данных
```typescript
import { createMockData } from '../utils/test-utils';

const mockBlock = createMockData.functionalBlock({
  name: 'Custom Name',
  prefix: 'CN'
});
```

## Лучшие практики

### 1. Тестирование поведения, а не реализации
```typescript
// ✅ Хорошо - тестируем поведение
expect(screen.getByText('Загрузка...')).toBeInTheDocument();

// ❌ Плохо - тестируем реализацию
expect(component.state.loading).toBe(true);
```

### 2. Использование семантических запросов
```typescript
// ✅ Хорошо
screen.getByRole('button', { name: 'Сохранить' });
screen.getByLabelText('Название');

// ❌ Плохо
screen.getByTestId('save-button');
```

### 3. Асинхронное тестирование
```typescript
// ✅ Хорошо
await waitFor(() => {
  expect(screen.getByText('Данные загружены')).toBeInTheDocument();
});

// ❌ Плохо
setTimeout(() => {
  expect(screen.getByText('Данные загружены')).toBeInTheDocument();
}, 1000);
```

### 4. Мокирование внешних зависимостей
```typescript
// Мокирование API
server.use(mockApiError('/api/endpoint', 500, 'Error'));

// Мокирование localStorage
const mockStorage = mockLocalStorage();
Object.defineProperty(window, 'localStorage', { value: mockStorage });
```

## Покрытие кода

Цель - достижение 80% покрытия по всем метрикам:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Отчеты о покрытии

После запуска `npm run test:coverage` отчет будет доступен в:
- Консоль - краткий отчет
- `coverage/lcov-report/index.html` - детальный HTML отчет

## Отладка тестов

### Просмотр DOM в тестах
```typescript
import { screen } from '@testing-library/react';

// Вывод текущего DOM
screen.debug();

// Вывод конкретного элемента
screen.debug(screen.getByRole('button'));
```

### Логирование в тестах
```typescript
console.log('Current state:', result.current);
```

### Пошаговая отладка
Используйте `debugger;` в тестах и запускайте с флагом `--no-cache`.

## Continuous Integration

Тесты автоматически запускаются в CI/CD pipeline:

```yaml
- name: Run tests
  run: npm run test:ci
  
- name: Upload coverage
  uses: codecov/codecov-action@v1
```

## Troubleshooting

### Проблемы с MSW
Если MSW не работает, проверьте:
1. Правильность настройки в `setupTests.ts`
2. Корректность handlers в `api-mocks.ts`
3. Версию MSW (используется v2)

### Проблемы с async/await
Всегда используйте `waitFor` для асинхронных операций:

```typescript
await waitFor(() => {
  expect(screen.getByText('Результат')).toBeInTheDocument();
});
```

### Проблемы с провайдерами
Убедитесь, что все необходимые провайдеры добавлены в `test-utils.tsx`.

## Дополнительные ресурсы

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 