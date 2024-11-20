import { type MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => [{ title: 'RecipeRadar' }]

export default function Index() {
	return (
		<main className="grid h-full place-items-center">
			<div className="container flex flex-col items-center gap-8 px-4 py-16 text-center">
				<h1 className="text-4xl font-medium text-foreground md:text-5xl xl:text-6xl">
					Find recipes with what you have
				</h1>
				<p className="text-xl/7 text-muted-foreground">
					Take a photo of your fridge or pantry and let AI suggest recipes
				</p>
				<div className="flex gap-4">
					<a
						href="/scan"
						className="rounded-md bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground"
					>
						Scan Fridge
					</a>
					<a
						href="/recipes"
						className="rounded-md bg-secondary px-8 py-3 text-lg font-semibold text-secondary-foreground"
					>
						Browse Recipes
					</a>
				</div>
			</div>
		</main>
	)
}
