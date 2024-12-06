import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { FridgeImageInput } from '#app/components/fridge-image-input'
import { requireUserId } from '#app/utils/auth.server.js'
import { useState } from 'react'
import { type RecipeResponse } from '#app/utils/ai.server'
import { useDelayedIsPending } from '#app/utils/misc.js'
import { RecipeCard } from '#app/components/recipe-card'
import { Button } from '#app/components/ui/button.js'
import {
	FormProvider,
	getFieldsetProps,
	getFormProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { Form } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon'
import { ErrorList } from '#app/components/forms'
import { cn, getNoteImgSrc } from '#app/utils/misc'

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const ImageFieldsetSchema = z.object({
	file: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 3MB'),
})

const ScanFormSchema = z.object({
	images: z.array(ImageFieldsetSchema).max(5),
})

export const meta: MetaFunction = () => [{ title: 'Scan Fridge | RecipeRadar' }]

export const handle = {
	panel: ScanPanel,
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return null
}

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
		// <div className="container py-8">
		// 	<h1 className="mb-8 text-3xl font-bold">Scan Your Fridge</h1>
		// 	<FridgeImageInput
		// 		onAnalyzeStart={() => {
		// 			setError(null)
		// 		}}
		// 		onAnalyzeComplete={(data) => {
		// 			setResult(data)
		// 		}}
		// 		onError={(err) => {
		// 			setError(err)
		// 		}}
		// 	/>

		// 	{isPending ? (
		// 		<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		// 			<RecipeSkeleton />
		// 			<RecipeSkeleton />
		// 			<RecipeSkeleton />
		// 		</div>
		// 	) : error ? (
		// 		<div className="mt-8 rounded-md bg-destructive/10 p-4 text-destructive">
		// 			{error}
		// 		</div>
		// 	) : result ? (
		// 		<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		// 			{result.suggestedRecipes.map((recipe, i) => (
		// 				<div
		// 					key={recipe.title}
		// 					className="animate-fade-up"
		// 					style={{ animationDelay: `${i * 150}ms` }}
		// 				>
		// 					<RecipeCard recipe={recipe} size="sm" />
		// 				</div>
		// 			))}
		// 		</div>
		// 	) : null}
		// </div>
	)
}

// export function RecipeSkeleton() {
// 	return (
// 		<div className="animate-pulse space-y-4 rounded-lg border p-4">
// 			<div className="h-6 w-3/4 rounded bg-muted" />
// 			<div className="space-y-2">
// 				<div className="h-4 w-1/4 rounded bg-muted" />
// 				<div className="h-4 w-1/3 rounded bg-muted" />
// 			</div>
// 			<div className="space-y-2">
// 				<div className="h-4 w-full rounded bg-muted" />
// 				<div className="h-4 w-5/6 rounded bg-muted" />
// 			</div>
// 		</div>
// 	)
// }

function ScanPanel() {
	const [form, fields] = useForm({
		id: 'scan-form',
		constraint: getZodConstraint(ScanFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ScanFormSchema })
		},
		defaultValue: {
			images: [{}],
		},
	})

	const imageList = fields.images.getFieldList()

	return (
		<div className="h-full px-24 py-20">
			<div className="h-full rounded-2xl border border-[#D9D9D9] p-8">
				<FormProvider context={form.context}>
					<Form
						method="POST"
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
										form.remove.click({
											name: fields.images.name,
											index,
										})
									}
								/>
							))}
							{imageList.length < 5 && (
								<Button
									className="h-32 w-32"
									{...form.insert.getButtonProps({
										name: fields.images.name,
									})}
								>
									<Icon name="plus" />
								</Button>
							)}
						</div>
						<ErrorList id={form.errorId} errors={form.errors} />
					</Form>
				</FormProvider>
			</div>
		</div>
	)
}

function ImageChooser({ meta, onRemove }) {
	const fields = meta.getFieldset()
	const [previewImage, setPreviewImage] = useState(null)

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
						<img
							src={previewImage}
							alt="Preview"
							className="h-32 w-32 rounded-lg object-cover"
						/>
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
						type="file"
						name={fields.file.name}
						id={fields.file.id}
					/>
				</label>
				{previewImage && (
					<button
						onClick={onRemove}
						className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
					>
						<Icon name="cross-1" />
					</button>
				)}
				<div className="min-h-[32px] px-4 pb-3 pt-1">
					<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
				</div>
			</div>
		</fieldset>
	)
}
