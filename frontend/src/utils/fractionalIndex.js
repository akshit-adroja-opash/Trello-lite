const MIN_CHAR = 33;
const MAX_CHAR = 126;
const MID_CHAR = Math.floor((MIN_CHAR + MAX_CHAR) / 2);

const isEmpty = (v) => v === null || v === undefined || v === '';

export const generateIndexBetween = (prev, next) => {
    const p = isEmpty(prev) ? null : prev;
    const n = isEmpty(next) ? null : next;

    if (!p && !n) return String.fromCharCode(MID_CHAR);

    if (!p) {
        const firstCode = n.charCodeAt(0);
        if (firstCode > MIN_CHAR + 1) {
            return String.fromCharCode(Math.floor((MIN_CHAR + firstCode) / 2));
        }
        return String.fromCharCode(MIN_CHAR) + generateIndexBetween(null, n.length > 1 ? n.slice(1) : null);
    }

    if (!n) {
        const lastCode = p.charCodeAt(0);
        if (lastCode < MAX_CHAR - 1) {
            return String.fromCharCode(Math.floor((lastCode + MAX_CHAR) / 2));
        }
        return String.fromCharCode(MAX_CHAR) + generateIndexBetween(p.length > 1 ? p.slice(1) : null, null);
    }

    let result = '';
    let i = 0;
    while (i <= 20) {
        const pc = i < p.length ? p.charCodeAt(i) : MIN_CHAR;
        const nc = i < n.length ? n.charCodeAt(i) : MAX_CHAR;
        if (nc - pc > 1) {
            result += String.fromCharCode(Math.floor((pc + nc) / 2));
            return result;
        }
        result += String.fromCharCode(pc);
        i++;
    }
    return result + String.fromCharCode(MID_CHAR);
};
