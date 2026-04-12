import { execSync } from 'child_process';

const BULK_COMMITS = new Set(['52130a9', '989dc47', '53c0235', '6def8ab', 'a3f7e33']);

export function gitLastmod(filePath: string): Date | null {
    try {
        const log = execSync(`git log -10 --format="%H\t%cI" -- "${filePath}"`, {
            encoding: 'utf-8',
        }).trim();
        if (!log) return null;
        for (const line of log.split('\n')) {
            const [hash, date] = line.split('\t');
            if (!BULK_COMMITS.has(hash.slice(0, 7))) {
                return date ? new Date(date) : null;
            }
        }
        return null;
    } catch {
        return null;
    }
}
