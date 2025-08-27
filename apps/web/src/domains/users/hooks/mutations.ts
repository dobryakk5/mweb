import {
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import type { User } from '@acme/db/types'
import toast from '@acme/ui/lib/toast'

import type { FormValues } from '@/types'
import api, { type AxiosResponse, type AxiosError } from '@/lib/api'

import { userKeys } from '../query-keys'

const useUpdateUser: (
  id: string,
) => UseMutationResult<AxiosResponse, AxiosError, FormValues> = (id) => {
  const queryClient = useQueryClient()

  return useMutation<AxiosResponse, AxiosError, FormValues>({
    mutationKey: userKeys.updateUser(id),
    mutationFn: (values: FormValues) => api.patch(`/users/${id}`, values),
    onError() {
      toast.error(
        'The user update is currently unavailable, please try again later :(',
      )
    },
    onSuccess: async ({ data }) => {
      for (const query of queryClient
        .getQueryCache()
        .findAll({ queryKey: userKeys.getUsers({}) })) {
        queryClient.setQueryData<User[]>(query.queryKey, (users) =>
          users?.map((user) =>
            user.id === data.id ? { ...user, ...data } : user,
          ),
        )
      }

      queryClient.setQueryData<User>(userKeys.getUser(id), (user) =>
        user ? { ...user, ...data } : data,
      )

      toast.success('User updated successfully! 🎉')
    },
  })
}

const useAddUser: () => UseMutationResult<
  AxiosResponse,
  AxiosError,
  FormValues
> = () => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  return useMutation<AxiosResponse, AxiosError, FormValues>({
    mutationKey: userKeys.addUser(),
    mutationFn: (values: FormValues) => api.post('/users', values),
    onError(err) {
      if (err.status === 403) {
        toast.error('Username or email already in use. Please try again. 😅')
      } else {
        toast.error(
          'User addition is temporarily unavailable. Please try again later. 🙁',
        )
      }
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.getUsers({}),
      })

      push(`/users/${data.id}`)

      toast.success('User added successfully! 🎉')
    },
  })
}

export { useUpdateUser, useAddUser }
