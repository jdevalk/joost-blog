export const MAX_CONTEXT_CHARS: number = 10000;
export const MAX_QUERY_LENGTH: number = 500;
export const AI_TIMEOUT_MS: number = 10000;
export const MODEL: string = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const EMBEDDING_MODEL: string = '@cf/baai/bge-base-en-v1.5';

export const TYPE_LABELS: Record<string, string> = {
	'WebPage': 'page',
	'BlogPosting': 'blog post',
	'VideoObject': 'video',
};

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('AI request timed out')), ms);
		promise.then(
			(val) => { clearTimeout(timer); resolve(val); },
			(err) => { clearTimeout(timer); reject(err); },
		);
	});
}
