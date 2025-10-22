import { Alert, AlertDescription } from "../ui/alert";
import { Construction } from "lucide-react";

export function WipBanner() {
	return (
		<Alert
			variant="destructive"
			className="fixed top-0 left-0 right-0 z-[60] rounded-none font-bold border-b-destructive border-x-0 border-t-0 flex items-center justify-center gap-2 px-4 py-3"
		>
			<Construction className="h-4 w-4 flex-shrink-0" />
			<AlertDescription className="font-medium">
				[WIP] This application is currently under development. Features may be
				incomplete or subject to change.
			</AlertDescription>
		</Alert>
	);
}
