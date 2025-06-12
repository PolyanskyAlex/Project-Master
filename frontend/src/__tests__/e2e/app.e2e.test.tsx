import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import App from '../../App';
import { server } from '../utils/msw-setup';

describe('App E2E Tests', () => {
  it('completes full functional block management workflow', async () => {
    render(<App />);

    // 1. Проверяем загрузку приложения
    expect(screen.getByText('Система Управления Проектами')).toBeInTheDocument();

    // 2. Переходим к функциональным блокам
    const functionalBlocksLink = screen.getByText('Функциональные блоки');
    fireEvent.click(functionalBlocksLink);

    // 3. Ждем загрузки данных
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 4. Создаем новый функциональный блок
    const addButton = screen.getByText('Добавить блок') || screen.getByLabelText('add');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Создать функциональный блок')).toBeInTheDocument();
    });

    // Заполняем форму
    const nameInput = screen.getByLabelText(/название/i);
    const prefixInput = screen.getByLabelText(/префикс/i);
    const descriptionInput = screen.getByLabelText(/описание/i);

    fireEvent.change(nameInput, { target: { value: 'E2E Test Block' } });
    fireEvent.change(prefixInput, { target: { value: 'E2E' } });
    fireEvent.change(descriptionInput, { target: { value: 'E2E test description' } });

    const createButton = screen.getByText('Создать');
    fireEvent.click(createButton);

    // 5. Проверяем, что блок создался
    await waitFor(() => {
      expect(screen.queryByText('Создать функциональный блок')).not.toBeInTheDocument();
    });

    expect(screen.getByText('E2E Test Block')).toBeInTheDocument();

    // 6. Редактируем созданный блок
    const editButtons = screen.getAllByLabelText('edit');
    const lastEditButton = editButtons[editButtons.length - 1];
    fireEvent.click(lastEditButton);

    await waitFor(() => {
      expect(screen.getByText('Редактировать функциональный блок')).toBeInTheDocument();
    });

    const editNameInput = screen.getByLabelText(/название/i);
    fireEvent.change(editNameInput, { target: { value: 'Updated E2E Test Block' } });

    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);

    // 7. Проверяем обновление
    await waitFor(() => {
      expect(screen.queryByText('Редактировать функциональный блок')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Updated E2E Test Block')).toBeInTheDocument();
  });

  it('completes project management workflow', async () => {
    render(<App />);

    // 1. Переходим к проектам
    const projectsLink = screen.getByText('Проекты');
    fireEvent.click(projectsLink);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 2. Создаем новый проект
    const addButton = screen.getByText('Добавить проект') || screen.getByLabelText('add');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Создать проект')).toBeInTheDocument();
    });

    // Заполняем форму проекта
    const nameInput = screen.getByLabelText(/название/i);
    const descriptionInput = screen.getByLabelText(/описание/i);

    fireEvent.change(nameInput, { target: { value: 'E2E Test Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'E2E test project description' } });

    // Выбираем функциональный блок
    const functionalBlockSelect = screen.getByLabelText(/функциональный блок/i);
    fireEvent.mouseDown(functionalBlockSelect);

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Frontend'));

    const createButton = screen.getByText('Создать');
    fireEvent.click(createButton);

    // 3. Проверяем создание проекта
    await waitFor(() => {
      expect(screen.queryByText('Создать проект')).not.toBeInTheDocument();
    });

    expect(screen.getByText('E2E Test Project')).toBeInTheDocument();
  });

  it('completes task management workflow', async () => {
    render(<App />);

    // 1. Переходим к задачам
    const tasksLink = screen.getByText('Задачи');
    fireEvent.click(tasksLink);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 2. Создаем новую задачу
    const addButton = screen.getByText('Добавить задачу') || screen.getByLabelText('add');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Создать задачу')).toBeInTheDocument();
    });

    // Заполняем форму задачи
    const titleInput = screen.getByLabelText(/заголовок/i);
    const descriptionInput = screen.getByLabelText(/описание/i);

    fireEvent.change(titleInput, { target: { value: 'E2E Test Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'E2E test task description' } });

    // Выбираем проект
    const projectSelect = screen.getByLabelText(/проект/i);
    fireEvent.mouseDown(projectSelect);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Project 1'));

    const createButton = screen.getByText('Создать');
    fireEvent.click(createButton);

    // 3. Проверяем создание задачи
    await waitFor(() => {
      expect(screen.queryByText('Создать задачу')).not.toBeInTheDocument();
    });

    expect(screen.getByText('E2E Test Task')).toBeInTheDocument();

    // 4. Добавляем комментарий к задаче
    const viewButtons = screen.getAllByLabelText('view');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Детали задачи')).toBeInTheDocument();
    });

    // Добавляем комментарий
    const commentInput = screen.getByPlaceholderText(/добавить комментарий/i);
    fireEvent.change(commentInput, { target: { value: 'E2E test comment' } });

    const addCommentButton = screen.getByText('Добавить комментарий');
    fireEvent.click(addCommentButton);

    // Проверяем добавление комментария
    await waitFor(() => {
      expect(screen.getByText('E2E test comment')).toBeInTheDocument();
    });
  });

  it('navigates between different sections correctly', async () => {
    render(<App />);

    // Проверяем навигацию по всем разделам
    const sections = [
      'Функциональные блоки',
      'Проекты', 
      'Задачи',
      'Документы',
      'План разработки',
      'Логи операций'
    ];

    for (const section of sections) {
      const link = screen.getByText(section);
      fireEvent.click(link);

      await waitFor(() => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });

      // Ждем загрузки данных
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  it('handles responsive navigation correctly', async () => {
    // Симулируем мобильное устройство
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(<App />);

    // На мобильных устройствах навигация может быть скрыта
    // Проверяем наличие кнопки меню
    const menuButton = screen.queryByLabelText('menu') || screen.queryByLabelText('open drawer');
    
    if (menuButton) {
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Функциональные блоки')).toBeInTheDocument();
      });
    }
  });

  it('displays error states correctly across the app', async () => {
    // Симулируем сетевую ошибку для всех запросов
    server.use(
      ...[
        '/api/v1/functional-blocks',
        '/api/v1/projects',
        '/api/v1/tasks',
        '/api/v1/documents',
        '/api/v1/operation-logs'
      ].map(endpoint => 
        require('../utils/api-mocks').mockApiError(endpoint, 500, 'Network error')
      )
    );

    render(<App />);

    // Проверяем обработку ошибок в разных разделах
    const sections = ['Функциональные блоки', 'Проекты', 'Задачи'];

    for (const section of sections) {
      const link = screen.getByText(section);
      fireEvent.click(link);

      await waitFor(() => {
        expect(screen.getByText(/ошибка/i)).toBeInTheDocument();
      });
    }
  });
}); 