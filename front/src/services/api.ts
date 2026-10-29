import { ApiResponse } from '@/types';
import { useAuthStore } from '@/store/auth';

const API_BASE = (process.env.REACT_APP_API_BASE as string | undefined) || 'http://localhost:8080/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  useFormData?: boolean;
};

async function getToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  return state.token;
}

export async function apiClient<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, useFormData = false } = options;
  const token = await getToken();

  const finalHeaders: Record<string, string> = {
    ...headers,
  };

  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  let bodyToSend: any = body;
  if (!useFormData && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    bodyToSend = JSON.stringify(body);
  }

  const url = `${API_BASE}${path}`;
  console.log(`[API] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: bodyToSend,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { raw: text } : null;
  }

  if (!response.ok) {
    const errorResponse: ApiResponse = {
      ok: false,
      mensaje: data?.mensaje || `Error HTTP ${response.status}`,
      codigo_error: data?.codigo_error,
    };
    console.error(`[API ERROR] ${method} ${url}:`, errorResponse);
    throw errorResponse;
  }

  console.log(`[API OK] ${method} ${url}`, data);
  return data as ApiResponse<T>;
}

export async function apiUploadFiles(
  path: string,
  files: FileList | File[],
  extraFields?: Record<string, string>
): Promise<ApiResponse<any>> {
  const token = await getToken();
  const formData = new FormData();

  const fileArray = Array.from(files);
  fileArray.forEach((f) => {
    formData.append('adjuntos', f);
  });

  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { raw: text } : null;
  }

  if (!response.ok) {
    const errorResponse: ApiResponse = {
      ok: false,
      mensaje: data?.mensaje || `Error ${response.status}`,
      codigo_error: data?.codigo_error,
    };
    throw errorResponse;
  }

  return data as ApiResponse<any>;
}

export async function obtenerAdjuntoBlob(
  idSolicitud: number | string,
  idAdjunto: number | string
): Promise<Blob> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(
    `${API_BASE}/solicitudes/${idSolicitud}/adjuntos/${idAdjunto}`,
    { headers }
  );

  if (!response.ok) {
    let mensaje = `Error HTTP ${response.status}`;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      mensaje = data?.mensaje || mensaje;
    }
    const errorResponse: ApiResponse = { ok: false, mensaje };
    throw errorResponse;
  }

  return response.blob();
}

export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre || 'adjunto';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function descargarAdjunto(
  idSolicitud: number | string,
  idAdjunto: number | string,
  nombre: string
): Promise<void> {
  const blob = await obtenerAdjuntoBlob(idSolicitud, idAdjunto);
  descargarBlob(blob, nombre);
}

export async function obtenerCodigoBarras(idSolicitud: number | string): Promise<string> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/solicitudes/${idSolicitud}/codigo-barras`, { headers });
  if (!response.ok) {
    let mensaje = `Error HTTP ${response.status}`;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      mensaje = data?.mensaje || mensaje;
    }
    const errorResponse: ApiResponse = { ok: false, mensaje };
    throw errorResponse;
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function abrirPapeletaPdf(idSolicitud: number | string): Promise<void> {
  const ventana = window.open('', '_blank');
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/rrhh/${idSolicitud}/papeleta.pdf`, { headers });
  if (!response.ok) {
    ventana?.close();
    let mensaje = `Error HTTP ${response.status}`;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      mensaje = data?.mensaje || mensaje;
    }
    const errorResponse: ApiResponse = { ok: false, mensaje };
    throw errorResponse;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  if (ventana) {
    ventana.location.href = url;
  } else {
    window.open(url, '_blank');
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function descargarReporte(
  tipo: string,
  parametros: Record<string, string | number> = {}
): Promise<void> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const query = new URLSearchParams({ tipo });
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) {
      query.set(clave, String(valor));
    }
  });

  const response = await fetch(`${API_BASE}/rrhh/reportes/exportar?${query.toString()}`, { headers });
  if (!response.ok) {
    let mensaje = `Error HTTP ${response.status}`;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      mensaje = data?.mensaje || mensaje;
    }
    const errorResponse: ApiResponse = { ok: false, mensaje };
    throw errorResponse;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `reporte_${tipo}.xlsx`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export { API_BASE };
