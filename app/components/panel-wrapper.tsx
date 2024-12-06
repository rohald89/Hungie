import { useNavigate } from '@remix-run/react'
import { Icon } from './ui/icon'

export function PanelWrapper({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	const navigate = useNavigate()

	return (
		<div className="h-full px-24 py-20">
			<div className="relative h-full rounded-2xl border border-[#D9D9D9] px-8 py-12">
				<button
					onClick={() => navigate(-1)}
					className="absolute right-10 top-10 flex h-10 w-10 items-center justify-center rounded-full bg-black hover:bg-gray-800"
				>
					<Icon name="arrow-up" className="h-5 w-5" />
				</button>
				<h3 className="mb-10 text-center text-h6 uppercase text-muted-foreground">
					{title}
				</h3>
				{children}
			</div>
		</div>
	)
}
