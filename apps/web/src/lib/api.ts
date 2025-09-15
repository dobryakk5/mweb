import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  isAxiosError,
} from 'axios'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:13001'

console.log('API URL:', apiUrl)

const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
} satisfies AxiosRequestConfig)

api.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url)
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.message, error.config?.url)
    return Promise.reject(error)
  }
)

export {
  api as default,
  axios,
  type AxiosResponse,
  type AxiosError,
  isAxiosError,
}
