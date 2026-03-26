export const MAX_CONTEXT_CHARS = 10000;
export const MAX_QUERY_LENGTH = 500;
export const AI_TIMEOUT_MS = 10000;
export const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

export const TYPE_LABELS = {
	'WebPage': 'page',
	'BlogPosting': 'blog post',
	'VideoObject': 'video',
};

export function withTimeout(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('AI request timed out')), ms);
		promise.then(
			(val) => { clearTimeout(timer); resolve(val); },
			(err) => { clearTimeout(timer); reject(err); },
		);
	});
}
