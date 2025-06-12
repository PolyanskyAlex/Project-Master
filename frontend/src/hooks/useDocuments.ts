import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../services/documentService';
import { Document, CreateDocumentRequest, UpdateDocumentRequest, DocumentType } from '../types/api';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getAllDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке документов');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentsByProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocumentsByProject(projectId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке документов проекта');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentsByType = useCallback(async (type: DocumentType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocumentsByType(type);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке документов по типу');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocument = useCallback(async (data: CreateDocumentRequest): Promise<Document> => {
    setLoading(true);
    setError(null);
    try {
      const newDocument = await documentService.createDocument(data);
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании документа');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (id: string, data: UpdateDocumentRequest): Promise<Document> => {
    setLoading(true);
    setError(null);
    try {
      const updatedDocument = await documentService.updateDocument(id, data);
      setDocuments(prev => prev.map(doc => doc.id === id ? updatedDocument : doc));
      return updatedDocument;
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении документа');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении документа');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    fetchDocumentsByProject,
    fetchDocumentsByType,
    createDocument,
    updateDocument,
    deleteDocument,
    setError
  };
};

export const useDocumentTypes = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = await documentService.getValidDocumentTypes();
      setDocumentTypes(types);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке типов документов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  return {
    documentTypes,
    loading,
    error
  };
}; 