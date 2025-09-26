import { useState, useRef } from "react";

type LoadingState = "initializing" | "loading_chat" | "ready";

export function useLoadingState(initialState: LoadingState = "initializing") {
	const [current, setCurrent] = useState<LoadingState>(initialState);
	const [isReady, setIsReadyState] = useState(false);
	const transitionInProgress = useRef(false);

	const setReady = () => {
		setCurrent("ready");
		setIsReadyState(true);
	};

	const withTransition = async <T>(
		state: LoadingState,
		operation: () => Promise<T>
	): Promise<T | null> => {
		if (transitionInProgress.current) return null;

		transitionInProgress.current = true;
		setCurrent(state);

		try {
			const result = await operation();
			return result;
		} catch (error) {
			console.error(`Transition failed:`, error);
			return null;
		} finally {
			transitionInProgress.current = false;
		}
	};

	return {
		current,
		isReady,
		setReady,
		withTransition,
		transitionInProgress,
	};
}