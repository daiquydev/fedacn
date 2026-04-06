export const roundKcal = (val) => {
    if (val === undefined || val === null) return 0;
    return Math.round(Number(val) * 100) / 100;
};
