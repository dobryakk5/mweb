import {
  forwardRef,
  type HTMLAttributes,
  useId,
  type ElementRef,
  type ComponentPropsWithoutRef,
} from 'react'
import type * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
} from 'react-hook-form'

import { FormFieldContext, FormItemContext } from '../contexts/form'
import cn from '../utils/cn'
import Label from './label'
import useFormField from '../hooks/use-form-field'

const FormRoot = FormProvider

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = useId()

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    )
  },
)
FormItem.displayName = 'FormItem'

const FormLabel = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { formItemId } = useFormField()

  return (
    <Label className={className} htmlFor={formItemId} ref={ref} {...props} />
  )
})
FormLabel.displayName = 'FormLabel'

const FormControl = forwardRef<
  ElementRef<typeof Slot>,
  ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      id={formItemId}
      ref={ref}
      {...props}
    />
  )
})
FormControl.displayName = 'FormControl'

const FormDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      className={cn('text-[0.8rem] text-muted-foreground leading-5', className)}
      id={formDescriptionId}
      ref={ref}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

const FormMessage = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      className={cn('text-[0.8rem]', className)}
      id={formMessageId}
      ref={ref}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = 'FormMessage'

type FormProps = typeof FormRoot & {
  Item: typeof FormItem
  Label: typeof FormLabel
  Control: typeof FormControl
  Description: typeof FormDescription
  Message: typeof FormMessage
  Field: typeof FormField
}

const Form = FormRoot as FormProps

Form.Item = FormItem
Form.Label = FormLabel
Form.Control = FormControl
Form.Description = FormDescription
Form.Message = FormMessage
Form.Field = FormField

export default Form

// Именованные экспорты для удобства
export { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage }
