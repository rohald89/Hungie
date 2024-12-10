import { Form, useSearchParams, useSubmit } from '@remix-run/react'
import { useId } from 'react'
import { useDebounce } from '#app/utils/misc.tsx'
import { Icon } from './ui/icon.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'

export function SearchBar({
	autoFocus = false,
	autoSubmit = false,
	formAction = '/recipes',
	placeholder = 'Search recipes...',
}: {
	autoFocus?: boolean
	autoSubmit?: boolean
	formAction?: string
	placeholder?: string
}) {
	const id = useId()
	const [searchParams] = useSearchParams()
	const submit = useSubmit()

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	return (
		<Form
			method="GET"
			action={formAction}
			className="relative"
			onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
		>
			<div className="relative">
				<Icon
					name="magnifying-glass"
					className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					name="search"
					id={id}
					defaultValue={searchParams.get('search') ?? ''}
					placeholder={placeholder}
					className="w-full border-0 pl-11 text-lg"
					autoFocus={autoFocus}
				/>
			</div>
			<Label htmlFor={id} className="sr-only">
				Search
			</Label>
			<button type="submit" className="sr-only">
				Search
			</button>
		</Form>
	)
}
