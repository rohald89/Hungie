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
import {
	Form,
	useActionData,
	useNavigate,
	useNavigation,
} from '@remix-run/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import { StatusButton } from '#app/components/ui/status-button'
import { requireUserId } from '#app/utils/auth.server'
import { analyzeFridgeContents } from '#app/utils/ai.server'
import { cn } from '#app/utils/misc'
import { prisma } from '#app/utils/db.server'
import { createId } from '@paralleldrive/cuid2'
import Webcam from 'react-webcam'
import { PanelWrapper } from '#app/components/panel-wrapper.js'

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
			<p className="text-h2">🛒</p>
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
	const navigation = useNavigation()
	const navigate = useNavigate()
	const isPending =
		navigation.state === 'submitting' || navigation.state === 'loading'
	const webcamRef = useRef<Webcam>(null)
	const [showCamera, setShowCamera] = useState(false)

	const [form, fields] = useForm({
		id: 'scan-form',
		constraint: getZodConstraint(ScanFormSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ScanFormSchema })
		},
		defaultValue: {
			images: [{ id: createId() }],
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
			form.insert({
				name: fields.images.name,
				defaultValue: { id: createId() },
			})
		}
	}, [imageList, fields.images.name, form])

	const capture = useCallback(() => {
		if (!webcamRef.current) return
		const imageSrc = webcamRef.current.getScreenshot()
		if (!imageSrc) {
			console.log('No image captured')
			return
		}

		// Convert base64 to File object
		const blob = dataURLtoFile(imageSrc, 'webcam-photo.jpg')

		// Find first empty slot
		const emptyIndex = imageList.findIndex(
			(image) => !image.getFieldset().file.value,
		)
		if (emptyIndex !== -1) {
			// Get the field
			const imageField = imageList[emptyIndex]?.getFieldset().file
			const fieldId = imageField?.id
			if (!fieldId) return

			// Update the file input directly
			const dataTransfer = new DataTransfer()
			dataTransfer.items.add(blob)

			const input = document.getElementById(fieldId) as HTMLInputElement
			if (input) {
				input.files = dataTransfer.files
				// Trigger change event
				input.dispatchEvent(new Event('change', { bubbles: true }))

				// Add a new empty ImageChooser if we're at the last slot
				if (emptyIndex === imageList.length - 1 && imageList.length < 5) {
					form.insert({
						name: fields.images.name,
						defaultValue: { id: createId() },
					})
				}
			}
		}

		setShowCamera(false)
	}, [form, fields.images.name, imageList])

	return (
		<PanelWrapper
			title="Camera"
			rightButton={{
				icon: <Icon name="cross-1" className="h-5 w-5" />,
				onClick: () => navigate(-1),
				ariaLabel: 'Navigate back',
			}}
		>
			{isPending ? (
				<AnalyzingImages />
			) : (
				<>
					<div className="mb-8">
						{showCamera ? (
							<div className="relative mx-auto w-full max-w-2xl">
								<Webcam
									ref={webcamRef}
									screenshotFormat="image/jpeg"
									className="w-full rounded-lg"
								/>
								<button
									onClick={() => setShowCamera(false)}
									className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/40"
								>
									<Icon name="cross-1" className="h-5 w-5" />
								</button>
								<div className="absolute bottom-8 left-1/2 -translate-x-1/2">
									<div className="relative h-[50px] w-[50px]">
										<div className="absolute -inset-4 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm" />
										<button
											onClick={capture}
											className="relative h-[50px] w-[50px] rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
										/>
									</div>
								</div>
							</div>
						) : (
							<Button
								onClick={() => setShowCamera(true)}
								className="mb-4"
								disabled={imageList.length >= 5}
							>
								<Icon name="camera" className="mr-2" />
								Take Photo
							</Button>
						)}
					</div>
					<FormProvider context={form.context}>
						<Form
							method="POST"
							action="/scan"
							className="flex h-full flex-col gap-y-4"
							{...getFormProps(form)}
							encType="multipart/form-data"
						>
							<div className="flex justify-between">
								<div className="flex max-w-lg flex-row-reverse justify-end gap-4 overflow-x-scroll">
									{imageList.map((image, index) => (
										<ImageChooser
											key={image.key ?? index}
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
								{imageList.some((image) => image.getFieldset().file.value) && (
									<StatusButton
										type="submit"
										disabled={isPending}
										status={isPending ? 'pending' : 'idle'}
										className="h-20 w-20"
									>
										<Icon name="check" className="text-4xl" />
										<p className="sr-only">Analyze Images</p>
									</StatusButton>
								)}
							</div>
							<ErrorList id={form.errorId} errors={form.errors} />
						</Form>
					</FormProvider>
				</>
			)}
		</PanelWrapper>
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

	// Get input props but exclude the key
	const { key: _key, ...inputProps } = getInputProps(fields.file, {
		type: 'file',
	})

	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div className="relative">
				<label
					htmlFor={fields.file.id}
					className={cn('group block h-24 w-24 rounded-lg', {
						'bg-secondary focus-within:opacity-100 hover:opacity-100':
							!previewImage,
						'cursor-pointer': true,
					})}
				>
					{previewImage ? (
						<div className="relative">
							<img
								src={previewImage}
								alt={fields.altText.value ?? ''}
								className="h-24 w-24 rounded-lg object-cover"
							/>
							<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
								<div className="absolute inset-0 rounded-lg bg-black/10 backdrop-blur-sm" />
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault()
										onRemove()
									}}
									className="relative z-10 text-foreground"
								>
									<Icon name="trash2" className="text-2xl" />
								</button>
							</div>
						</div>
					) : (
						<div className="flex h-24 w-24 items-center justify-center rounded-lg border border-transparent text-4xl text-muted-foreground group-hover:border-muted-foreground">
							<Icon name="upload2" />
						</div>
					)}
					<input
						className="absolute left-0 top-0 z-0 h-24 w-24 cursor-pointer opacity-0"
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
						{...inputProps}
					/>
				</label>
				<div className="min-h-[32px] px-4 pb-3 pt-1">
					<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
				</div>
			</div>
		</fieldset>
	)
}

function AnalyzingImages() {
	const [dots, setDots] = useState(1)

	useEffect(() => {
		const interval = setInterval(() => {
			setDots((prev) => (prev === 3 ? 1 : prev + 1))
		}, 500)

		return () => clearInterval(interval)
	}, [])

	return (
		<p className="text-center text-h6 text-muted-foreground">
			Analyzing images{'.'.repeat(dots)}
		</p>
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

	// Redirect to the scan detail page
	return redirect(`/scan/${scan.id}`)
}

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}
// Helper function to convert dataURL to File
function dataURLtoFile(dataurl: string, filename: string): File {
	const arr = dataurl.split(',')
	const mime = arr[0]?.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
	const bstr = atob(arr[1] ?? '')
	let n = bstr.length
	const u8arr = new Uint8Array(n)

	while (n > 0) {
		n--
		u8arr[n] = bstr.charCodeAt(n)
	}

	return new File([u8arr], filename, { type: mime })
}
