export const generateClientRequestId = (prefix: 'bk' | 'dn') => {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${time}_${random}`;
};

