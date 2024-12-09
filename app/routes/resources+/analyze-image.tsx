import {
	json,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { analyzeImage } from '#app/utils/ai.server'
import { requireUserId } from '#app/utils/auth.server'

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

type AnalyzeResponse = { error: string } | { ingredients: string }

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
		const imageFile = formData.get('image')

		if (!imageFile || !(imageFile instanceof File)) {
			return json(
				{ error: `Invalid image format: ${imageFile?.constructor.name}` },
				{ status: 400 },
			)
		}

		if (!imageFile.type.startsWith('image/')) {
			return json(
				{ error: `Invalid file type: ${imageFile.type}` },
				{ status: 400 },
			)
		}

		const buffer = Buffer.from(await imageFile.arrayBuffer())
		const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`

		const ingredients = await analyzeImage(base64Image)
		return json({ ingredients })
	} catch (error) {
		console.error('Failed to analyze image:', error)
		return json(
			{
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			} satisfies AnalyzeResponse,
			{ status: 500 },
		)
	}
}
