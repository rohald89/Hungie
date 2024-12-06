import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useRouteLoaderData } from '@remix-run/react'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { type Ingredients } from '#app/utils/ai.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	const scan = await prisma.scan.findUnique({
		where: { id: params.scanId },
		select: { id: true, ingredients: true, userId: true },
	})

	if (!scan) {
		throw new Response('Not found', { status: 404 })
	}

	if (scan.userId !== userId) {
		throw new Response('Not found', { status: 404 })
	}

	const ingredients = JSON.parse(scan.ingredients) as Ingredients

	return json({ ingredients })
}

function IngredientsPanel() {
	const data = useRouteLoaderData<typeof loader>('routes/scan+/$scanId')

	if (!data) return null

	return (
		<main className="mt-40">
			<h1 className="text-h1">Detected Ingredients</h1>
			<div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3">
				{Object.entries(data.ingredients).map(([category, items]) => (
					<div key={category} className="space-y-4">
						<h2 className="text-h4 capitalize">{category}</h2>
						<ul className="space-y-2">
							{items.map((item) => (
								<li key={item} className="text-body-md">
									{item}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</main>
	)
}

export const handle = {
	panel: IngredientsPanel,
}

export default function ScanDetailsRoute() {
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
