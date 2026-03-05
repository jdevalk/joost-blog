import { joostPersonData } from '../person-data';

export function buildPersonPiece(): Record<string, unknown> {
    return { ...joostPersonData };
}
