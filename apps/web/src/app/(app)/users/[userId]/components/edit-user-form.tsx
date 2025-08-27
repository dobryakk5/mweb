import { type HTMLAttributes, type JSX, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
import Label from '@acme/ui/components/label'

import { useUpdateUser } from '@/domains/users/hooks/mutations'
import HookFormDevtool from '@/components/hookform-devtool'

const formSchema = upsertUserSchema.pick({
  username: true,
  firstName: true,
  lastName: true,
})

type FormValues = z.infer<typeof formSchema>

type EditUserFormProps = HTMLAttributes<HTMLFormElement> & {
  user?: User
  className?: string
  isLoading?: boolean
}

export default function EditUserForm({
  user,
  className,
  isLoading,
  ...props
}: EditUserFormProps): JSX.Element {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/'

  const defaultValues = useMemo(
    () => ({
      username: user?.username ?? '',
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    }),
    [user],
  )

  const { reset, formState, control, handleSubmit, ...form } =
    useForm<FormValues>({
      mode: 'onChange',
      defaultValues,
      resolver: zodResolver(formSchema),
    })

  useEffect(() => {
    if (user) {
      reset(defaultValues)
    }
  }, [user, defaultValues, reset])

  const { mutateAsync: updateUser } = useUpdateUser(user?.id as string)

  const cancel = () => reset(defaultValues)

  const onSubmit: SubmitHandler<FormValues> = async (values: FormValues) => {
    try {
      const modifiedFields: Partial<FormValues> = Object.fromEntries(
        Object.keys(formState.dirtyFields).map((key) => [
          key,
          values[key as keyof FormValues],
        ]),
      )

      await updateUser(modifiedFields)

      reset(values)
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
                href={returnTo}
              >
                <ArrowLeftIcon className='size-5' />

                <span className='sr-only'>Go back</span>
              </Link>

              <Page.Title>Edit user</Page.Title>

              {formState.isDirty ? (
                <div className='ml-auto flex items-center gap-x-4'>
                  <span className='text-muted-foreground text-xs'>
                    Unsaved changes
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
                      <span>Save</span>

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

                      <div className='space-y-2'>
                        <Label>Email</Label>

                        <div className='flex h-10 items-center text-muted-foreground text-sm'>
                          {isLoading ? (
                            <Skeleton className='h-5 w-64' />
                          ) : (
                            user?.email
                          )}
                        </div>
                      </div>
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
