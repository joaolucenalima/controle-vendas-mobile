import type { DriveBackupFile } from "./backup.types";

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";
const APP_PROPERTY_KEY = "application";
const APP_PROPERTY_VALUE = "controle-vendas-mobile";

type DriveFileResponse = {
  id: string;
  name: string;
  createdTime?: string;
  size?: string;
  appProperties?: Record<string, string>;
};

type DriveListResponse = {
  files?: DriveFileResponse[];
  nextPageToken?: string;
};

export class GoogleDriveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function ensureSuccess(response: Response, fallbackMessage: string) {
  if (response.ok) return;

  let apiMessage = "";
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    apiMessage = body.error?.message ?? "";
  } catch {
    // The fallback below is intentionally used for non-JSON responses.
  }

  throw new GoogleDriveError(apiMessage || fallbackMessage, response.status);
}

function authorizationHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function mapDriveFile(file: DriveFileResponse): DriveBackupFile {
  return {
    id: file.id,
    name: file.name,
    createdTime: file.createdTime ?? "",
    size: Number(file.size ?? 0),
    formatVersion: Number(file.appProperties?.formatVersion ?? 0),
  };
}

export const GoogleDriveClient = {
  async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
    const files: DriveBackupFile[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        spaces: "appDataFolder",
        orderBy: "createdTime desc",
        pageSize: "100",
        fields: "nextPageToken,files(id,name,createdTime,size,appProperties)",
        q: `appProperties has { key='${APP_PROPERTY_KEY}' and value='${APP_PROPERTY_VALUE}' }`,
      });
      if (pageToken) params.set("pageToken", pageToken);

      const response = await fetch(`${DRIVE_API_URL}/files?${params}`, {
        headers: authorizationHeaders(accessToken),
      });
      await ensureSuccess(response, "Não foi possível buscar os backups no Google Drive.");

      const body = (await response.json()) as DriveListResponse;
      files.push(...(body.files ?? []).map(mapDriveFile));
      pageToken = body.nextPageToken;
    } while (pageToken);

    return files.sort((left, right) => right.createdTime.localeCompare(left.createdTime));
  },

  async uploadBackup(
    accessToken: string,
    name: string,
    serializedBackup: string,
  ): Promise<DriveBackupFile> {
    const metadata = {
      name,
      parents: ["appDataFolder"],
      mimeType: "application/json",
      appProperties: {
        [APP_PROPERTY_KEY]: APP_PROPERTY_VALUE,
        formatVersion: "1",
      },
    };

    const startResponse = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=resumable`, {
      method: "POST",
      headers: {
        ...authorizationHeaders(accessToken),
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });
    await ensureSuccess(startResponse, "Não foi possível iniciar o envio do backup.");

    const uploadUrl = startResponse.headers.get("location");
    if (!uploadUrl) {
      throw new Error("O Google Drive não retornou um endereço para enviar o backup.");
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: serializedBackup,
    });
    await ensureSuccess(uploadResponse, "Não foi possível concluir o envio do backup.");

    const uploaded = (await uploadResponse.json()) as DriveFileResponse;

    const detailsResponse = await fetch(
      `${DRIVE_API_URL}/files/${encodeURIComponent(uploaded.id)}?fields=id,name,createdTime,size,appProperties`,
      { headers: authorizationHeaders(accessToken) },
    );
    await ensureSuccess(detailsResponse, "O backup foi enviado, mas seus detalhes não foram lidos.");

    return mapDriveFile((await detailsResponse.json()) as DriveFileResponse);
  },

  async downloadBackup(accessToken: string, fileId: string): Promise<string> {
    const response = await fetch(
      `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: authorizationHeaders(accessToken) },
    );
    await ensureSuccess(response, "Não foi possível baixar o backup selecionado.");
    return await response.text();
  },

  async deleteBackup(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(`${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: authorizationHeaders(accessToken),
    });
    await ensureSuccess(response, "Não foi possível remover um backup antigo.");
  },
};

