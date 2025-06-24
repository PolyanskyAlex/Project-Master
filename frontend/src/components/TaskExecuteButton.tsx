import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Spin, notification, Modal, Progress } from 'antd';
import { PlayCircleOutlined, LoadingOutlined, BugOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { Task } from '../types/Task';
import { taskExecutionApi } from '../services/taskExecutionApi';

interface TaskExecuteButtonProps {
  task: Task;
  onExecutionStart?: (executionId: string) => void;
  onExecutionComplete?: (result: any) => void;
  onExecutionError?: (error: string) => void;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  showProgress?: boolean;
}

interface ExecutionStatus {
  id: string;
  status: string;
  progress: number;
  message: string;
  taskTitle: string;
  strategy: string;
  error?: string;
  logs: string[];
  steps: Array<{
    id: string;
    name: string;
    status: string;
    error?: string;
  }>;
}

const TaskExecuteButton: React.FC<TaskExecuteButtonProps> = ({
  task,
  onExecutionStart,
  onExecutionComplete,
  onExecutionError,
  size = 'middle',
  disabled = false,
  showProgress = true
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Опрос статуса выполнения
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (executionId && isExecuting) {
      intervalId = setInterval(async () => {
        try {
          const status = await taskExecutionApi.getExecutionStatus(executionId);
          setExecutionStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            setIsExecuting(false);
            setExecutionId(null);
            
            if (status.status === 'completed') {
              notification.success({
                message: 'Задача выполнена',
                description: `Задача "${status.taskTitle}" успешно выполнена`,
                duration: 5,
              });
              onExecutionComplete?.(status);
            } else if (status.status === 'failed') {
              notification.error({
                message: 'Ошибка выполнения',
                description: status.error || 'Неизвестная ошибка',
                duration: 8,
              });
              onExecutionError?.(status.error || 'Unknown error');
            } else if (status.status === 'cancelled') {
              notification.info({
                message: 'Выполнение отменено',
                description: `Выполнение задачи "${status.taskTitle}" было отменено`,
                duration: 3,
              });
            }
          }
        } catch (error) {
          console.error('Failed to get execution status:', error);
          setIsExecuting(false);
          setExecutionId(null);
        }
      }, 2000); // Опрос каждые 2 секунды
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [executionId, isExecuting, onExecutionComplete, onExecutionError]);

  const handleExecute = async () => {
    try {
      setIsExecuting(true);
      
      const command = `Выполнить задачу ${task.id}`;
      const response = await taskExecutionApi.executeTask({
        command,
        source: 'web',
        user_id: 'current_user', // В реальном приложении получать из контекста
        project_id: task.project_id
      });

      setExecutionId(response.execution_id);
      onExecutionStart?.(response.execution_id);
      
      if (showProgress) {
        setShowProgressModal(true);
      }
      
      notification.info({
        message: 'Выполнение начато',
        description: `Начато выполнение задачи "${task.title}"`,
        duration: 3,
      });
      
    } catch (error: any) {
      setIsExecuting(false);
      const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка';
      
      notification.error({
        message: 'Ошибка запуска',
        description: `Не удалось запустить выполнение: ${errorMessage}`,
        duration: 5,
      });
      
      onExecutionError?.(errorMessage);
    }
  };

  const handleCancel = async () => {
    if (!executionId) return;
    
    try {
      await taskExecutionApi.cancelExecution(executionId);
      setIsExecuting(false);
      setExecutionId(null);
      setShowProgressModal(false);
      
      notification.info({
        message: 'Выполнение отменено',
        description: 'Выполнение задачи было отменено',
        duration: 3,
      });
    } catch (error: any) {
      notification.error({
        message: 'Ошибка отмены',
        description: 'Не удалось отменить выполнение',
        duration: 3,
      });
    }
  };

  const getButtonIcon = () => {
    if (isExecuting) {
      return <LoadingOutlined />;
    }
    
    switch (task.type) {
      case 'bug':
        return <BugOutlined />;
      case 'feature':
        return <PlusOutlined />;
      case 'test':
        return <CheckOutlined />;
      default:
        return <PlayCircleOutlined />;
    }
  };

  const getButtonText = () => {
    if (isExecuting) {
      return 'Выполняется...';
    }
    
    switch (task.status) {
      case 'todo':
        return 'Выполнить задачу';
      case 'in_progress':
        return 'Продолжить выполнение';
      case 'done':
        return 'Переопределить';
      default:
        return 'Выполнить';
    }
  };

  const getButtonType = () => {
    if (isExecuting) {
      return 'default';
    }
    
    switch (task.priority) {
      case 'critical':
        return 'primary' as const;
      case 'high':
        return 'primary' as const;
      default:
        return 'default' as const;
    }
  };

  const getButtonDanger = () => {
    return task.priority === 'critical';
  };

  const canExecute = !disabled && !isExecuting && (task.status === 'todo' || task.status === 'in_progress');

  const tooltipTitle = isExecuting 
    ? 'Задача выполняется' 
    : !canExecute 
      ? 'Задача не может быть выполнена в текущем состоянии'
      : 'Запустить автоматическое выполнение задачи';

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Button
          type={getButtonType()}
          danger={getButtonDanger()}
          size={size}
          icon={getButtonIcon()}
          loading={isExecuting}
          disabled={!canExecute}
          onClick={handleExecute}
        >
          {getButtonText()}
        </Button>
      </Tooltip>

      <Modal
        title={`Выполнение задачи: ${task.title}`}
        open={showProgressModal}
        onCancel={() => setShowProgressModal(false)}
        footer={[
          <Button key="cancel" onClick={handleCancel} disabled={!isExecuting}>
            Отменить выполнение
          </Button>,
          <Button key="close" onClick={() => setShowProgressModal(false)}>
            Скрыть
          </Button>
        ]}
        width={600}
      >
        {executionStatus && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Progress 
                percent={executionStatus.progress} 
                status={executionStatus.status === 'failed' ? 'exception' : 'active'}
                strokeColor={
                  executionStatus.status === 'failed' ? '#ff4d4f' :
                  executionStatus.status === 'completed' ? '#52c41a' : '#1890ff'
                }
              />
              <p style={{ marginTop: 8, color: '#666' }}>
                {executionStatus.message}
              </p>
            </div>

            {executionStatus.strategy && (
              <div style={{ marginBottom: 16 }}>
                <strong>Стратегия выполнения:</strong> {executionStatus.strategy}
              </div>
            )}

            {executionStatus.steps.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <strong>Этапы выполнения:</strong>
                <div style={{ marginTop: 8 }}>
                  {executionStatus.steps.map((step, index) => (
                    <div key={step.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: 4,
                      padding: '4px 8px',
                      backgroundColor: step.status === 'completed' ? '#f6ffed' : 
                                     step.status === 'failed' ? '#fff2f0' : 
                                     step.status === 'executing' ? '#e6f7ff' : '#fafafa',
                      borderRadius: 4
                    }}>
                      <span style={{ 
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: step.status === 'completed' ? '#52c41a' :
                                       step.status === 'failed' ? '#ff4d4f' :
                                       step.status === 'executing' ? '#1890ff' : '#d9d9d9',
                        marginRight: 8
                      }} />
                      <span style={{ flex: 1 }}>{step.name}</span>
                      {step.status === 'executing' && <Spin size="small" />}
                      {step.error && (
                        <span style={{ color: '#ff4d4f', fontSize: '12px', marginLeft: 8 }}>
                          {step.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {executionStatus.error && (
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                backgroundColor: '#fff2f0', 
                border: '1px solid #ffccc7',
                borderRadius: 4 
              }}>
                <strong style={{ color: '#ff4d4f' }}>Ошибка:</strong>
                <div style={{ marginTop: 4, color: '#ff4d4f' }}>
                  {executionStatus.error}
                </div>
              </div>
            )}

            {executionStatus.logs.length > 0 && (
              <div>
                <strong>Логи выполнения:</strong>
                <div style={{ 
                  marginTop: 8,
                  maxHeight: 200,
                  overflowY: 'auto',
                  backgroundColor: '#f5f5f5',
                  padding: 8,
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  {executionStatus.logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: 2 }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default TaskExecuteButton; 