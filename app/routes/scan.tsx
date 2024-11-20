import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { FridgeImageInput } from '#app/components/fridge-image-input'
import { requireUserId } from '#app/utils/auth.server.js'

export const meta: MetaFunction = () => [{ title: 'Scan Fridge | RecipeRadar' }]

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return null
}

export default function ScanRoute() {
	return (
		<div className="container py-8">
			<h1 className="mb-8 text-3xl font-bold">Scan Your Fridge</h1>
			<FridgeImageInput />
		</div>
	)
}
