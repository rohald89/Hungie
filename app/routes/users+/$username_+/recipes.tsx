import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	Link,
	useParams,
	useRouteLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { PanelWrapper } from '#app/components/panel-wrapper.js'
import { RecipeCard } from '#app/components/recipe-card.js'
import { SearchBar } from '#app/components/search-bar.js'
import { Button } from '#app/components/ui/button.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'

export const meta = () => [{ title: 'Hungie' }]

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const searchParams = new URL(request.url).searchParams
	const query = searchParams.get('search')

	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: { id: true },
	})

	if (!user) {
		throw new Response('Not found', { status: 404 })
	}

	const recipes = await prisma.recipe.findMany({
		where: {
			userId: user.id,
			...(query
				? {
						OR: [
							{ title: { contains: query } },
							{ ingredients: { some: { item: { contains: query } } } },
						],
					}
				: {}),
		},
		select: {
			id: true,
			title: true,
			difficulty: true,
			cookingTime: true,
			calories: true,
			favorites: {
				where: { userId },
				select: { id: true },
			},
		},
		orderBy: { createdAt: 'desc' },
	})

	return json({
		recipes: recipes.map((recipe) => ({
			...recipe,
			isFavorited: recipe.favorites.length > 0,
			favorites: undefined,
		})),
		status: 'idle' as const,
	})
}

const steps = [
	'Take photo of your food items 🛒',
	'Choose recipe 📝',
	'Start cooking! 🧑‍🍳',
]

export default function Index() {
	return (
		<>
			<p className="text-5xl">📸</p>
			<h2 className="mt-5 text-h6 text-muted-foreground">
				Here's how it works:
			</h2>
			<ol className="mt-8 space-y-4">
				{steps.map((step, index) => (
					<li key={index} className="flex items-center gap-6">
						<div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50">
							<span className="ml-4 text-h6 text-blue-900">{index + 1}.</span>
						</div>
						<span className="text-body-md">{step}</span>
					</li>
				))}
			</ol>
			<div className="mt-16 flex gap-4">
				<Button asChild>
					<Link to="/scan">Open Camera</Link>
				</Button>
			</div>
		</>
	)
}

export const handle = {
	panel: PanelContent,
}

function PanelContent() {
	const data = useRouteLoaderData<typeof loader>(
		'routes/users+/$username_+/recipes',
	)
	const [searchParams] = useSearchParams()
	const query = searchParams.get('search')
	const params = useParams()

	console.log(data)

	return (
		<PanelWrapper title="Your Saved Recipes" rightButton={false}>
			<div className="mb-8 w-full">
				<SearchBar
					autoSubmit
					formAction={`/users/${params.username}/recipes`}
					placeholder="Search recipes..."
				/>
			</div>
			<div className="mt-8 flex flex-col gap-8 pb-10">
				{data?.recipes.length === 0 ? (
					<p className="text-center text-muted-foreground">
						{query
							? 'No recipes found. Try adjusting your search.'
							: 'No saved recipes yet. Start exploring and save your favorites!'}
					</p>
				) : (
					data?.recipes.map((recipe) => (
						<RecipeCard key={recipe.id} recipe={recipe} />
					))
				)}
			</div>
		</PanelWrapper>
	)
}
