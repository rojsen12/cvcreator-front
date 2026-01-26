import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentEditRequest {
    currentDocument: string;
    userPrompt: string;
}

export interface DocumentEditResponse {
    document?: string;
    updatedDocument?: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentEditService {
    private readonly API_URL = 'http://localhost:8080';
    private readonly EDIT_ENDPOINT = '/api/cv-edit/edit-document';

    constructor(private http: HttpClient) {}

    editDocument(request: DocumentEditRequest): Observable<DocumentEditResponse> {
        const url = `${this.API_URL}${this.EDIT_ENDPOINT}`;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        return this.http.post<DocumentEditResponse>(url, request, {
            headers,
            withCredentials: true
        });
    }

    parseResponse(response: DocumentEditResponse): {
        success: boolean;
        document: string;
        message: string;
    } {
        const doc = response.updatedDocument || response.document || '';
        const isBlocked = response.message.includes('❌') || response.message.includes('Nie mogę zmienić treści');

        return {
            success: !isBlocked && doc.length > 0,
            document: doc,
            message: response.message
        };
    }
}
