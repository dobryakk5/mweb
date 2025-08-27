import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  isAxiosError,
} from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
} satisfies AxiosRequestConfig)

export {
  api as default,
  axios,
  type AxiosResponse,
  type AxiosError,
  isAxiosError,
}
