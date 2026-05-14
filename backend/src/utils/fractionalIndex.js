/**
 * Simple fractional indexing implementation for ordering items.
 * This allows inserting items between two existing items without re-ordering everyone.
 */

export const generateInitialIndex = () => {
    return 'h'; // Middle of 'a' to 'z'
};

export const generateIndexBetween = (prev, next) => {
    if (!prev && !next) return generateInitialIndex();
    if (!prev) {
        // Before the first item
        const firstChar = next.charCodeAt(0);
        return String.fromCharCode(Math.floor(firstChar / 2));
    }
    if (!next) {
        // After the last item
        const lastChar = prev.charCodeAt(0);
        return String.fromCharCode(Math.min(122, lastChar + 10)); // 'z' is 122
    }

    // Between two items
    let result = '';
    let i = 0;
    while (true) {
        const p = prev.charCodeAt(i) || 32; // space is 32
        const n = next.charCodeAt(i) || 126; // ~ is 126

        if (n - p > 1) {
            result += String.fromCharCode(Math.floor((p + n) / 2));
            break;
        } else {
            result += String.fromCharCode(p);
            i++;
        }
    }
    return result;
};
