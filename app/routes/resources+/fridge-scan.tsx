import { json, type ActionFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server'
import { analyzeFridgeContents } from '#app/utils/ai.server'
import {
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
} from '@remix-run/node'

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

export async function action({ request }: ActionFunctionArgs) {
	try {
		await requireUserId(request)

		const uploadHandler = unstable_createMemoryUploadHandler({
			maxPartSize: MAX_SIZE,
		})

		const formData = await unstable_parseMultipartFormData(
			request,
			uploadHandler,
		)
		const imageFiles = formData.getAll('images[]')

		if (!imageFiles.length) {
			return json({ error: 'No images provided' }, { status: 400 })
		}

		if (imageFiles.length > 5) {
			return json({ error: 'Maximum 5 images allowed' }, { status: 400 })
		}

		const base64Images = await Promise.all(
			imageFiles.map(async (file) => {
				if (!(file instanceof File)) {
					throw new Error(`Invalid image format: ${file?.constructor.name}`)
				}

				if (!file.type.startsWith('image/')) {
					throw new Error(`Invalid file type: ${file.type}`)
				}

				const buffer = Buffer.from(await file.arrayBuffer())
				return `data:${file.type};base64,${buffer.toString('base64')}`
			}),
		)

		const ingredients = await analyzeFridgeContents(base64Images)
		return json({ ingredients })
	} catch (error) {
		console.error('Failed to process request:', error)
		return json(
			{
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			},
			{ status: 500 },
		)
	}
}
