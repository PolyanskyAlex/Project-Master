import { ApiService } from './api';
import { 
  Document, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentType,
  ListResponse 
} from '../types/api';

export class DocumentService extends ApiService {
  private basePath = '/documents';

  async getAllDocuments(): Promise<Document[]> {
    const response = await this.get<ListResponse<Document>>(this.basePath);
    return response.items;
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
    const response = await this.get<ListResponse<Document>>(`${this.basePath}/project/${projectId}`);
    return response.items;
  }

  async getDocumentsByType(type: DocumentType): Promise<Document[]> {
    const response = await this.get<ListResponse<Document>>(`${this.basePath}/by-type?type=${type}`);
    return response.items;
  }

  async getDocumentsByProjectAndType(projectId: string, type: DocumentType): Promise<Document[]> {
    const response = await this.get<ListResponse<Document>>(`${this.basePath}/project/${projectId}/type/${type}`);
    return response.items;
  }

  async getAgentEditableDocumentsByProject(projectId: string): Promise<Document[]> {
    const response = await this.get<ListResponse<Document>>(`${this.basePath}/project/${projectId}/agent-editable`);
    return response.items;
  }

  async getValidDocumentTypes(): Promise<DocumentType[]> {
    const response = await this.get<{ types: DocumentType[] }>(`${this.basePath}/document-types`);
    return response.types;
  }
}

export const documentService = new DocumentService(); 