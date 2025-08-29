import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  isAxiosError,
} from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:13001',
} satisfies AxiosRequestConfig)

export {
  api as default,
  axios,
  type AxiosResponse,
  type AxiosError,
  isAxiosError,
}
