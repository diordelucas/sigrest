import axios from 'axios';
import { ApiErrorResponse } from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
});

/**
 * Extrai a mensagem de erro a ser mostrada ao usuário. O backend já devolve
 * um ErrorResponse {codigo, message, status, timestamp} com texto pronto para
 * exibição (ver GlobalExceptionHandler) — aqui só tratamos os casos em que
 * essa resposta não existe (erro de rede) ou não veio no formato esperado.
 */
export function getErrorMessage(err: unknown, fallback = 'Ocorreu um erro inesperado. Tente novamente.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
    if (!err.response) return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@sigrest:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@sigrest:token');
      localStorage.removeItem('@sigrest:user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
