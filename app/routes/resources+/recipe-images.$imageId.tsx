import { type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server'

export async function loader({ params }: LoaderFunctionArgs) {
	const image = await prisma.recipeImage.findUnique({
		where: { id: params.imageId },
		select: { contentType: true, blob: true },
	})

	if (!image) {
		throw new Response('Not found', { status: 404 })
	}

	return new Response(image.blob, {
		headers: {
			'Content-Type': image.contentType,
			'Content-Length': Buffer.from(image.blob).length.toString(),
			'Content-Disposition': 'inline',
		},
	})
} 
