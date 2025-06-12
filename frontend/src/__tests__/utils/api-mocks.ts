import { http, HttpResponse } from 'msw';
import { createMockData } from './test-utils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const handlers = [
  // Functional Blocks API
  http.get(`${API_BASE_URL}/api/v1/functional-blocks`, () => {
    return HttpResponse.json([
      createMockData.functionalBlock({ id: 1, name: 'Frontend', prefix: 'FE' }),
      createMockData.functionalBlock({ id: 2, name: 'Backend', prefix: 'BE' }),
    ]);
  }),

  http.post(`${API_BASE_URL}/api/v1/functional-blocks`, () => {
    return HttpResponse.json(
      createMockData.functionalBlock({ id: 3 }),
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/api/v1/functional-blocks/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.functionalBlock({ id: Number(id) })
    );
  }),

  http.delete(`${API_BASE_URL}/api/v1/functional-blocks/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Projects API
  http.get(`${API_BASE_URL}/api/v1/projects`, () => {
    return HttpResponse.json([
      createMockData.project({ id: 1, name: 'Test Project 1' }),
      createMockData.project({ id: 2, name: 'Test Project 2' }),
    ]);
  }),

  http.get(`${API_BASE_URL}/api/v1/projects/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.project({ id: Number(id) })
    );
  }),

  http.post(`${API_BASE_URL}/api/v1/projects`, () => {
    return HttpResponse.json(
      createMockData.project({ id: 3 }),
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/api/v1/projects/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.project({ id: Number(id) })
    );
  }),

  http.delete(`${API_BASE_URL}/api/v1/projects/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Tasks API
  http.get(`${API_BASE_URL}/api/v1/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const tasks = [
      createMockData.task({ id: 1, title: 'Task 1', project_id: 1 }),
      createMockData.task({ id: 2, title: 'Task 2', project_id: 1 }),
      createMockData.task({ id: 3, title: 'Task 3', project_id: 2 }),
    ];

    const filteredTasks = projectId 
      ? tasks.filter(task => task.project_id === Number(projectId))
      : tasks;

    return HttpResponse.json(filteredTasks);
  }),

  http.get(`${API_BASE_URL}/api/v1/tasks/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.task({ id: Number(id) })
    );
  }),

  http.post(`${API_BASE_URL}/api/v1/tasks`, () => {
    return HttpResponse.json(
      createMockData.task({ id: 4 }),
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/api/v1/tasks/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.task({ id: Number(id) })
    );
  }),

  http.delete(`${API_BASE_URL}/api/v1/tasks/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Comments API
  http.get(`${API_BASE_URL}/api/v1/comments`, ({ request }) => {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('task_id');
    const comments = [
      createMockData.comment({ id: 1, task_id: 1, content: 'Comment 1' }),
      createMockData.comment({ id: 2, task_id: 1, content: 'Comment 2' }),
      createMockData.comment({ id: 3, task_id: 2, content: 'Comment 3' }),
    ];

    const filteredComments = taskId 
      ? comments.filter(comment => comment.task_id === Number(taskId))
      : comments;

    return HttpResponse.json(filteredComments);
  }),

  http.post(`${API_BASE_URL}/api/v1/comments`, () => {
    return HttpResponse.json(
      createMockData.comment({ id: 4 }),
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/api/v1/comments/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.comment({ id: Number(id) })
    );
  }),

  http.delete(`${API_BASE_URL}/api/v1/comments/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Documents API
  http.get(`${API_BASE_URL}/api/v1/documents`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const documents = [
      createMockData.document({ id: 1, title: 'Document 1', project_id: 1 }),
      createMockData.document({ id: 2, title: 'Document 2', project_id: 1 }),
      createMockData.document({ id: 3, title: 'Document 3', project_id: 2 }),
    ];

    const filteredDocuments = projectId 
      ? documents.filter(doc => doc.project_id === Number(projectId))
      : documents;

    return HttpResponse.json(filteredDocuments);
  }),

  http.post(`${API_BASE_URL}/api/v1/documents`, () => {
    return HttpResponse.json(
      createMockData.document({ id: 4 }),
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/api/v1/documents/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockData.document({ id: Number(id) })
    );
  }),

  http.delete(`${API_BASE_URL}/api/v1/documents/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Operation Logs API
  http.get(`${API_BASE_URL}/api/v1/operation-logs`, () => {
    return HttpResponse.json([
      createMockData.operationLog({ id: 1, operation_type: 'CREATE' }),
      createMockData.operationLog({ id: 2, operation_type: 'UPDATE' }),
      createMockData.operationLog({ id: 3, operation_type: 'DELETE' }),
    ]);
  }),

  // Project Plan API
  http.get(`${API_BASE_URL}/api/v1/projects/:projectId/plan`, ({ params }) => {
    const { projectId } = params;
    return HttpResponse.json({
      project_id: Number(projectId),
      tasks: [
        { task_id: 1, sequence_order: 1, task: createMockData.task({ id: 1 }) },
        { task_id: 2, sequence_order: 2, task: createMockData.task({ id: 2 }) },
      ],
      statistics: {
        total_tasks: 2,
        completed_tasks: 0,
        in_progress_tasks: 1,
        todo_tasks: 1,
      },
    });
  }),

  http.post(`${API_BASE_URL}/api/v1/projects/:projectId/plan/tasks`, () => {
    return HttpResponse.json(
      { message: 'Tasks added to plan' },
      { status: 201 }
    );
  }),

  http.delete(`${API_BASE_URL}/api/v1/projects/:projectId/plan/tasks/:taskId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(`${API_BASE_URL}/api/v1/projects/:projectId/plan/reorder`, () => {
    return HttpResponse.json({ message: 'Plan reordered successfully' });
  }),

  // Error handlers
  http.get(`${API_BASE_URL}/api/v1/error`, () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/api/v1/not-found`, () => {
    return HttpResponse.json(
      { message: 'Resource not found' },
      { status: 404 }
    );
  }),
];

// Утилиты для управления моками в тестах
export const mockApiSuccess = () => {
  // Все handlers уже настроены на успешные ответы
};

export const mockApiError = (endpoint: string, status = 500, message = 'Server error') => {
  return http.get(`${API_BASE_URL}${endpoint}`, () => {
    return HttpResponse.json(
      { message },
      { status }
    );
  });
};

export const mockApiDelay = (endpoint: string, delay = 1000) => {
  return http.get(`${API_BASE_URL}${endpoint}`, async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return HttpResponse.json([]);
  });
}; 