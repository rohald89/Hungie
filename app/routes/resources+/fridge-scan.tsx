import { json, type ActionFunctionArgs } from '@remix-run/node'
import { analyzeAndGenerateRecipes } from '#app/utils/ai.server'
import { requireUserId } from '#app/utils/auth.server'
import {
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
} from '@remix-run/node'

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

export async function action({ request }: ActionFunctionArgs) {
	try {
		const userId = await requireUserId(request)

		const uploadHandler = unstable_createMemoryUploadHandler({
			maxPartSize: MAX_SIZE,
		})

		const formData = await unstable_parseMultipartFormData(request, uploadHandler)
		const imageFile = formData.get('image')

		console.log('Received file:', {
			type: imageFile?.constructor.name,
			mimeType: imageFile instanceof File ? imageFile.type : 'not a file',
			size: imageFile instanceof File ? imageFile.size : 'not a file',
		})

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

		// Convert File to base64 for OpenAI API
		const buffer = Buffer.from(await imageFile.arrayBuffer())
		const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`

		const result = await analyzeAndGenerateRecipes(base64Image)
		return json(result)
	} catch (error) {
		console.error('Failed to process request:', error)
		return json(
			{
				error: error instanceof Error ? error.message : 'Unknown error occurred',
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 },
		)
	}
}
