import { useNavigate } from '@remix-run/react'
import { Icon } from './ui/icon'

export function PanelWrapper({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate()

	return (
		<div className="h-full px-24 py-20">
			<div className="relative h-full rounded-2xl border border-[#D9D9D9] p-8">
				<button
					onClick={() => navigate(-1)}
					className="absolute right-10 top-10 flex h-10 w-10 items-center justify-center rounded-full bg-black hover:bg-gray-800"
				>
					<Icon name="arrow-up" className="h-5 w-5" />
				</button>
				{children}
			</div>
		</div>
	)
}
