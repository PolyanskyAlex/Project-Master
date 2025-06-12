import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import FunctionalBlocks from '../pages/FunctionalBlocks';
import Projects from '../pages/Projects';
import Tasks from '../pages/Tasks';
import Documents from '../pages/Documents';
import DevelopmentPlan from '../pages/DevelopmentPlan';
import OperationLogs from '../pages/OperationLogs';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Главная страница - дашборд */}
      <Route path="/" element={<Dashboard />} />
      
      {/* Функциональные блоки */}
      <Route path="/functional-blocks" element={<FunctionalBlocks />} />
      
      {/* Проекты */}
      <Route path="/projects" element={<Projects />} />
      
      {/* Задачи */}
      <Route path="/tasks" element={<Tasks />} />
      
      {/* Документы */}
      <Route path="/documents" element={<Documents />} />
      
      {/* План разработки */}
      <Route path="/development-plan" element={<DevelopmentPlan />} />
      
      {/* Логи операций */}
      <Route path="/operation-logs" element={<OperationLogs />} />
      
      {/* Перенаправление неизвестных маршрутов на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter; 