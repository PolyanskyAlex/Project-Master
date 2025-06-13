import { ApiService } from './api';
import { 
  Document, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentType,
  ListResponse 
} from '../types/api';

export class DocumentService extends ApiService {
  private basePath = '/api/v1/documents';

  async getAllDocuments(): Promise<Document[]> {
    return await this.get<Document[]>(this.basePath);
  }

  async getDocument(id: string): Promise<Document> {
    return await this.get<Document>(`${this.basePath}/${id}`);
  }

  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    return await this.post<Document>(this.basePath, data);
  }

  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
    return await this.put<Document>(`${this.basePath}/${id}`, data);
  }

  async deleteDocument(id: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}`);
  }

  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return await this.get<Document[]>(`${this.basePath}/project/${projectId}`);
  }

  async getDocumentsByType(type: DocumentType): Promise<Document[]> {
    return await this.get<Document[]>(`${this.basePath}/by-type?type=${type}`);
  }

  async getDocumentsByProjectAndType(projectId: string, type: DocumentType): Promise<Document[]> {
    return await this.get<Document[]>(`${this.basePath}/project/${projectId}/type/${type}`);
  }

  async getAgentEditableDocumentsByProject(projectId: string): Promise<Document[]> {
    return await this.get<Document[]>(`${this.basePath}/project/${projectId}/agent-editable`);
  }

  async getValidDocumentTypes(): Promise<DocumentType[]> {
    const response = await this.get<{ documentTypes: DocumentType[] }>(`${this.basePath}/document-types`);
    return response.documentTypes;
  }
}

export const documentService = new DocumentService(); 