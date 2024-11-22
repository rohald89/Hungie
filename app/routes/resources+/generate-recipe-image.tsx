import { json, type ActionFunctionArgs } from '@remix-run/node'
import { OpenAIProvider } from '#app/utils/providers/openai.server'
import { prisma } from '#app/utils/db.server'
import { requireUserId } from '#app/utils/auth.server'

const openai = OpenAIProvider.client()

async function urlToBuffer(url: string) {
	const response = await fetch(url)
	return Buffer.from(await response.arrayBuffer())
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const { recipeId, title } = (await request.json()) as {
		recipeId: string
		title: string
	}

	// Verify recipe ownership
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, userId },
		select: { id: true },
	})
	if (!recipe) throw new Error('Recipe not found')

	const completion = await openai.images.generate({
		model: 'dall-e-3',
		prompt: `A professional food photography style image of ${title}. The image should be well-lit, appetizing, and styled like a cookbook photo.`,
		size: '1024x1024',
		quality: 'standard',
		n: 1,
	})

	const imageUrl = completion.data[0]?.url
	if (!imageUrl) throw new Error('Failed to generate image')

	const buffer = await urlToBuffer(imageUrl)

	await prisma.recipeImage.create({
		data: {
			recipeId,
			contentType: 'image/jpeg',
			blob: buffer,
			altText: `AI generated image of ${title}`,
		},
	})

	// Return base64 for immediate display
	return json({
		imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
	})
}
