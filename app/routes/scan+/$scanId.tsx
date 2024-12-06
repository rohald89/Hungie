import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { PanelWrapper } from '#app/components/panel-wrapper.js'
import { Icon } from '#app/components/ui/icon'
import { type Ingredients } from '#app/utils/ai.server'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

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
		<PanelWrapper title="Item Checklist">
			<div className="mt-8 grid grid-cols-2 gap-8">
				{Object.entries(data.ingredients).map(([category, items]) => (
					<div key={category} className="space-y-4">
						<h2 className="text-h4 capitalize">{category}</h2>
						<ul className="space-y-4">
							{items.map((item) => (
								<li key={item} className="flex items-center gap-2">
									<div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50">
										<Icon
											name="check2"
											className="h-4 w-4 translate-x-1/2 text-blue-900"
										/>
									</div>
									<span className="text-body-md">{item}</span>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</PanelWrapper>
	)
}

export const handle = {
	panel: IngredientsPanel,
}

export default function ScanDetailsRoute() {
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
