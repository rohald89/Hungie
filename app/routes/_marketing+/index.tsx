import { redirect, type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'
import { getUserId } from '#app/utils/auth.server.js'
import { useOptionalUser } from '#app/utils/user.js'

export const meta: MetaFunction = () => [{ title: 'Hungie' }]

export async function loader({ request }: { request: Request }) {
	const user = await getUserId(request)
	if (user) return redirect('/dashboard')
	return null
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
				Here’s how it works:
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

				<Button asChild variant="secondary">
					<Link to="/login">Login</Link>
				</Button>
			</div>
		</>
	)
}
