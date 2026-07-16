import { api } from "@/lib/api";

import type {
  DocumentItem,
  DocumentListResponse,
  DocumentUploadResponse,
} from "@/types/document";

function normalizeDocumentList(
  data:
    | DocumentItem[]
    | DocumentListResponse,
): DocumentListResponse {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
    };
  }

  return {
    items: data.items ?? [],
    total:
      data.total ??
      data.items?.length ??
      0,
  };
}

export async function getKnowledgeBaseDocuments(
  knowledgeBaseId: string,
): Promise<DocumentListResponse> {
  const response = await api.get<
    DocumentItem[] | DocumentListResponse
  >(
    `/knowledge-bases/${knowledgeBaseId}/documents`,
  );

  return normalizeDocumentList(
    response.data,
  );
}

export async function getDocument(
  documentId: string,
): Promise<DocumentItem> {
  const response =
    await api.get<DocumentItem>(
      `/documents/${documentId}`,
    );

  return response.data;
}

export async function uploadDocument(
  knowledgeBaseId: string,
  file: File,
  onUploadProgress?: (
    progressPercentage: number,
  ) => void,
): Promise<DocumentUploadResponse> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
  );

  const response =
    await api.post<DocumentUploadResponse>(
      `/knowledge-bases/${knowledgeBaseId}/documents/upload`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },

        onUploadProgress: (
          progressEvent,
        ) => {
          if (
            !progressEvent.total ||
            !onUploadProgress
          ) {
            return;
          }

          const percentage =
            Math.round(
              (
                progressEvent.loaded *
                100
              ) /
                progressEvent.total,
            );

          onUploadProgress(
            percentage,
          );
        },
      },
    );

  return response.data;
}

export async function retryDocument(
  documentId: string,
): Promise<DocumentItem> {
  const response =
    await api.post<DocumentItem>(
      `/documents/${documentId}/retry`,
    );

  return response.data;
}

export async function deleteDocument(
  documentId: string,
): Promise<void> {
  await api.delete(
    `/documents/${documentId}`,
  );
}