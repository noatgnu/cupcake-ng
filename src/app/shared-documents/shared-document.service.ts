import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SharedDocument,
  SharedDocumentQuery,
  DocumentPermission,
  DocumentPermissionQuery,
  DocumentBrowseResponse,
  DocumentSearchResponse,
  DocumentShareRequest,
  DocumentUnshareRequest,
  DocumentCreateFolderRequest,
  DocumentSignedUrlResponse,
  DocumentBindRequest,
  ChunkedUploadResponse,
  FolderShareRequest,
  FolderUnshareRequest,
  FolderPermissionsResponse,
  SharedFolder, DocumentRenameRequest
} from './shared-document';

@Injectable({
  providedIn: 'root'
})
export class SharedDocumentService {
  private apiUrl = `${environment.baseURL}/api/shared_documents`;
  private permissionsUrl = `${environment.baseURL}/api/document_permissions`;

  constructor(private http: HttpClient) { }

  // Browse documents and folders hierarchically
  browse(folderId?: number, filterType?: 'all' | 'personal' | 'shared', offset?: number, limit?: number): Observable<DocumentBrowseResponse> {
    let params = new HttpParams();
    if (folderId !== undefined) {
      params = params.set('folder_id', folderId.toString());
    }
    if (filterType !== undefined) {
      params = params.set('filter_type', filterType);
    }
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<DocumentBrowseResponse>(`${this.apiUrl}/browse/`, { params });
  }

  // Get user's own documents
  getMyDocuments(offset?: number, limit?: number): Observable<SharedDocumentQuery> {
    let params = new HttpParams();
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<SharedDocumentQuery>(`${this.apiUrl}/my_documents/`, { params });
  }

  // Get documents shared with current user
  getSharedWithMe(offset?: number, limit?: number): Observable<SharedDocumentQuery> {
    let params = new HttpParams();
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<SharedDocumentQuery>(`${this.apiUrl}/shared_with_me/`, { params });
  }

  // Search documents
  search(query: string, folderId?: number, offset?: number, limit?: number): Observable<DocumentSearchResponse> {
    let params = new HttpParams().set('search', query);
    if (folderId !== undefined) {
      params = params.set('folder', folderId.toString());
    }
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<DocumentSearchResponse>(`${this.apiUrl}/search/`, { params });
  }

  // Create a new folder
  createFolder(request: DocumentCreateFolderRequest): Observable<SharedFolder> {
    return this.http.post<SharedFolder>(`${this.apiUrl}/create_folder/`, request);
  }

  // Delete a folder that user owns
  deleteFolder(folderId: number): Observable<{message: string}> {
    const params = new HttpParams().set('folder_id', folderId.toString());
    return this.http.delete<{message: string}>(`${this.apiUrl}/delete_folder/`, { params });
  }

  // Share folder with users or groups
  shareFolder(request: FolderShareRequest): Observable<{message: string; permissions: DocumentPermission[]; warnings?: string[]}> {
    return this.http.post<{message: string; permissions: DocumentPermission[]; warnings?: string[]}>(`${this.apiUrl}/share_folder/`, request);
  }

  // Remove folder sharing permissions
  unshareFolder(folderId: number, request: FolderUnshareRequest): Observable<{message: string; deleted_count: number}> {
    const params = new HttpParams().set('folder_id', folderId.toString());
    return this.http.request<{message: string; deleted_count: number}>('delete', `${this.apiUrl}/unshare_folder/`, {
      params,
      body: request
    });
  }

  // Get all permissions for a folder
  getFolderPermissions(folderId: number): Observable<FolderPermissionsResponse> {
    const params = new HttpParams().set('folder_id', folderId.toString());
    return this.http.get<FolderPermissionsResponse>(`${this.apiUrl}/folder_permissions/`, { params });
  }

  // Share document with users/groups
  shareDocument(documentId: number, request: DocumentShareRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${documentId}/share/`, request);
  }

  // Remove sharing permissions
  unshareDocument(documentId: number, request: DocumentUnshareRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${documentId}/unshare/`, request);
  }

  // Get signed URL for secure download
  getSignedUrl(documentId: number): Observable<DocumentSignedUrlResponse> {
    return this.http.get<DocumentSignedUrlResponse>(`${this.apiUrl}/${documentId}/get_signed_url/`);
  }

  // Download document directly
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/download/`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/octet-stream'
      })
    });
  }

  // Download via signed URL
  downloadSigned(token: string): Observable<Blob> {
    const params = new HttpParams().set('token', token);
    return this.http.get(`${this.apiUrl}/download_signed/`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/octet-stream'
      }),
      params
    });
  }

  // Bind completed chunked upload
  bindChunkedFile(request: DocumentBindRequest): Observable<SharedDocument> {
    return this.http.post<SharedDocument>(`${this.apiUrl}/bind_chunked_file/`, request);
  }

  // Get document by ID
  getDocument(id: number): Observable<SharedDocument> {
    return this.http.get<SharedDocument>(`${this.apiUrl}/${id}/`);
  }

  // Update document
  updateDocument(id: number, data: Partial<SharedDocument>): Observable<SharedDocument> {
    return this.http.patch<SharedDocument>(`${this.apiUrl}/${id}/`, data);
  }

  // Delete document
  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`);
  }

  // Document Permissions API

  // Get permissions for a document
  getDocumentPermissions(documentId: number, offset?: number, limit?: number): Observable<DocumentPermissionQuery> {
    let params = new HttpParams().set('annotation', documentId.toString());
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<DocumentPermissionQuery>(this.permissionsUrl + '/', { params });
  }

  // Create new permission
  createPermission(permission: Partial<DocumentPermission>): Observable<DocumentPermission> {
    return this.http.post<DocumentPermission>(this.permissionsUrl + '/', permission);
  }

  // Update permission
  updatePermission(id: number, permission: Partial<DocumentPermission>): Observable<DocumentPermission> {
    return this.http.patch<DocumentPermission>(`${this.permissionsUrl}/${id}/`, permission);
  }

  // Delete permission
  deletePermission(id: number): Observable<any> {
    return this.http.delete(`${this.permissionsUrl}/${id}/`);
  }

  // Utility methods

  // Get file icon based on extension
  getFileIcon(item: SharedDocument | SharedFolder): string {
    if ('type' in item && item.type === 'folder') {
      return 'folder';
    }

    const document = item as SharedDocument;

    // Extract extension from file_info or file name
    let extension: string | undefined;
    if (document.file_info?.extension) {
      extension = document.file_info.extension.toLowerCase();
    } else if (document.file_info?.name) {
      const lastDot = document.file_info.name.lastIndexOf('.');
      extension = lastDot > -1 ? document.file_info.name.substring(lastDot + 1).toLowerCase() : undefined;
    }

    if (!extension) {
      return 'insert_drive_file';
    }
    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'ppt':
      case 'pptx':
        return 'slideshow';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'video_file';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'audio_file';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      case 'txt':
        return 'text_snippet';
      default:
        return 'insert_drive_file';
    }
  }

  // Format file size for display
  formatFileSize(input: number | SharedDocument | null): string {
    let bytes: number | null = null;

    if (typeof input === 'number') {
      bytes = input;
    } else if (input && typeof input === 'object' && 'file_info' in input) {
      bytes = input.file_info?.size || null;
    }

    if (!bytes) return 'Unknown size';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Check if user has specific permission on document
  hasPermission(document: SharedDocument, permission: keyof NonNullable<SharedDocument['user_permissions']>): boolean {
    return document.user_permissions?.[permission] || false;
  }

  // Check if user has specific permission on folder
  hasFolderPermission(folder: SharedFolder, permission: keyof SharedFolder['user_permissions']): boolean {
    return folder.user_permissions[permission] || false;
  }

  // Get folder icon (always returns 'folder')
  getFolderIcon(folder: SharedFolder): string {
    return 'folder';
  }

  rename(renameRequest: DocumentRenameRequest) {
    return this.http.post<{message: string, folder_name?: string, annotation_name?: string}>(`${this.apiUrl}/rename/`, renameRequest);
  }
}
