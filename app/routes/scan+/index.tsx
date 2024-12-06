import {
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
	type FieldMetadata,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	type ActionFunctionArgs,
	redirect,
} from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import { StatusButton } from '#app/components/ui/status-button'
import { requireUserId } from '#app/utils/auth.server'
import { analyzeFridgeContents } from '#app/utils/ai.server'
import { cn, useIsPending } from '#app/utils/misc'
import { prisma } from '#app/utils/db.server'
import { createId } from '@paralleldrive/cuid2'

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine(
			(file) => !file || file.size <= MAX_UPLOAD_SIZE,
			'File size must be less than 3MB',
		),
	altText: z.string().optional(),
})

export const handle = {
	panel: ScanPanel,
}

type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

const ScanFormSchema = z.object({
	images: z.array(ImageFieldsetSchema).max(5),
})

export default function ScanRoute() {
	return (
		<main className="mt-40">
			<p className="text-mega">🛒</p>
			<h2 className="mt-5 text-h6 text-muted-foreground">Step 1</h2>
			<p className="mt-4 text-body-md">
				Capture or upload a maximum of five (5) photos of your food items.
			</p>
			<p className="mt-4 text-body-md">
				Our AI will provide a checklist of all the items that it captured.
			</p>
		</main>
	)
}

function ScanPanel() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'scan-form',
		constraint: getZodConstraint(ScanFormSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ScanFormSchema })
		},
		defaultValue: {
			images: [{}],
		},
		shouldRevalidate: 'onBlur',
	})

	const imageList = fields.images.getFieldList()

	// Auto-add new image chooser when all current slots have images
	useEffect(() => {
		const hasEmptySlot = imageList.some(
			(image) => !image.getFieldset().file.value,
		)
		const canAddMore = imageList.length < 5

		if (!hasEmptySlot && canAddMore) {
			form.insert({ name: fields.images.name })
		}
	}, [imageList, fields.images.name, form])

	return (
		<div className="h-full px-24 py-20">
			<div className="h-full rounded-2xl border border-[#D9D9D9] p-8">
				<FormProvider context={form.context}>
					<Form
						method="POST"
						action="/scan"
						className="flex h-full flex-col gap-y-4"
						{...getFormProps(form)}
						encType="multipart/form-data"
					>
						<div className="flex flex-wrap gap-4">
							{imageList.map((image, index) => (
								<ImageChooser
									key={image.key}
									meta={image}
									onRemove={() =>
										form.remove({
											name: fields.images.name,
											index,
										})
									}
								/>
							))}
						</div>
						<ErrorList id={form.errorId} errors={form.errors} />
						{imageList.some((image) => image.getFieldset().file.value) && (
							<StatusButton
								type="submit"
								disabled={isPending}
								status={isPending ? 'pending' : 'idle'}
								className="mt-4"
							>
								<Icon name="check" className="mr-2" />
								Analyze Images
							</StatusButton>
						)}
					</Form>
				</FormProvider>
			</div>
		</div>
	)
}

function ImageChooser({
	meta,
	onRemove,
}: {
	meta: FieldMetadata<ImageFieldset>
	onRemove: () => void
}) {
	const fields = meta.getFieldset()
	const [previewImage, setPreviewImage] = useState<string | null>(null)

	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div className="relative">
				<label
					htmlFor={fields.file.id}
					className={cn('group block h-32 w-32 rounded-lg', {
						'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
							!previewImage,
						'cursor-pointer': true,
					})}
				>
					{previewImage ? (
						<div className="relative">
							<img
								src={previewImage}
								alt={fields.altText.value ?? ''}
								className="h-32 w-32 rounded-lg object-cover"
							/>
							<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
								<div className="absolute inset-0 rounded-lg bg-black/50" />
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault()
										onRemove()
									}}
									className="relative z-10 text-white"
								>
									<Icon name="trash2" className="h-12" />
								</button>
							</div>
						</div>
					) : (
						<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
							<Icon name="plus" />
						</div>
					)}
					<input
						className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
						onChange={(event) => {
							const file = event.target.files?.[0]
							if (file) {
								const reader = new FileReader()
								reader.onloadend = () => {
									setPreviewImage(reader.result as string)
								}
								reader.readAsDataURL(file)
							} else {
								setPreviewImage(null)
							}
						}}
						accept="image/*"
						{...getInputProps(fields.file, { type: 'file' })}
					/>
				</label>
				<div className="min-h-[32px] px-4 pb-3 pt-1">
					<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
				</div>
			</div>
		</fieldset>
	)
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)

	const submission = await parseWithZod(formData, {
		schema: ScanFormSchema.transform(async ({ images = [] }) => {
			return {
				imageFiles: await Promise.all(
					images.filter(imageHasFile).map(async (image) => ({
						contentType: image.file.type,
						blob: Buffer.from(await image.file.arrayBuffer()),
					})),
				),
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { imageFiles } = submission.value

	// Convert images to base64 for AI analysis
	const base64Images = imageFiles.map(
		(file) => `data:${file.contentType};base64,${file.blob.toString('base64')}`,
	)

	const ingredients = await analyzeFridgeContents(base64Images)
	if (!ingredients) {
		throw new Error('No ingredients were detected')
	}

	// Store everything in the database
	const scan = await prisma.scan.create({
		data: {
			userId,
			ingredients: JSON.stringify(ingredients),
			images: {
				create: imageFiles.map((file) => ({
					id: createId(),
					contentType: file.contentType,
					blob: file.blob,
				})),
			},
		},
		select: {
			id: true,
		},
	})

	// Add right after scan creation
	console.log('Created scan:', scan)

	// Redirect to the scan detail page
	return redirect(`/scan/${scan.id}`)
}

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}
