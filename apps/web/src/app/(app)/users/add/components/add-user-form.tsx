'use client'

import type { HTMLAttributes, JSX } from 'react'
import Link from 'next/link'

import type { User } from '@acme/db/types'
import { upsertUserSchema } from '@acme/db/schemas'
import { type z, zodResolver } from '@acme/ui/lib/zod'
import { useForm, type SubmitHandler } from '@acme/ui/hooks/use-form'
import Form from '@acme/ui/components/form'
import cn from '@acme/ui/utils/cn'
import Page from '@acme/ui/components/page'
import Button, { buttonVariants } from '@acme/ui/components/button'
import { ArrowLeftIcon, Loader2Icon } from '@acme/ui/components/icon'
import Fieldset from '@acme/ui/components/fieldset'
import Card from '@acme/ui/components/card'
import Skeleton from '@acme/ui/components/skeleton'
import Input from '@acme/ui/components/input'

import { useAddUser } from '@/domains/users/hooks/mutations'
import HookFormDevtool from '@/components/hookform-devtool'

const formSchema = upsertUserSchema.pick({
  firstName: true,
  email: true,
  lastName: true,
  username: true,
})

type FormValues = z.infer<typeof formSchema>

type EditUserFormProps = HTMLAttributes<HTMLFormElement> & {
  user?: User
  className?: string
  isLoading?: boolean
}

export default function AddUserForm({
  className,
  isLoading,
  ...props
}: EditUserFormProps): JSX.Element {
  const defaultValues = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  }

  const { reset, formState, control, handleSubmit, ...form } =
    useForm<FormValues>({
      mode: 'onChange',
      defaultValues,
      resolver: zodResolver(formSchema),
    })

  const { mutateAsync: addUser } = useAddUser()

  const cancel = () => reset(defaultValues)

  const onSubmit: SubmitHandler<FormValues> = async (values: FormValues) => {
    try {
      await addUser(values)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <HookFormDevtool control={control} />

      <Form {...{ reset, formState, control, handleSubmit, ...form }}>
        <form
          className={cn('h-full w-full', className)}
          onSubmit={handleSubmit(onSubmit)}
          {...props}
        >
          <Page>
            <Page.Header>
              <Link
                className={buttonVariants({ size: 'icon', variant: 'outline' })}
                href='/users'
              >
                <ArrowLeftIcon className='size-5' />

                <span className='sr-only'>Go back</span>
              </Link>

              <Page.Title>Add user</Page.Title>

              {formState.isDirty ? (
                <div className='ml-auto flex items-center gap-x-4'>
                  <span className='text-muted-foreground text-xs'>
                    Unsaved user
                  </span>

                  <div className='flex gap-x-2'>
                    <Button onClick={cancel} variant='outline'>
                      Cancel
                    </Button>

                    <Button
                      className='gap-x-2'
                      disabled={!formState.isValid}
                      type='submit'
                    >
                      <span>Add</span>

                      {formState.isSubmitting ? (
                        <Loader2Icon className='size-4 animate-spin' />
                      ) : null}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Page.Header>

            <Page.Content className='divide-y *:py-5 first:*:pt-0 last:*:pb-0'>
              <Fieldset className='xl:grid-cols-9' title='Details'>
                <Card className='divide-y xl:col-span-6'>
                  <Card.Content>
                    <div className='grid gap-3 xl:grid-cols-2'>
                      <Form.Field
                        control={control}
                        name='firstName'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>First name</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input type='text' {...field} />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />

                      <Form.Field
                        control={control}
                        name='lastName'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Last name</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input type='text' {...field} />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />

                      <Form.Field
                        control={control}
                        name='username'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Usename</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input type='text' {...field} />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />

                      <Form.Field
                        control={control}
                        name='email'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Email</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input type='email' {...field} />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </div>
                  </Card.Content>
                </Card>
              </Fieldset>
            </Page.Content>
          </Page>
        </form>
      </Form>
    </>
  )
}
