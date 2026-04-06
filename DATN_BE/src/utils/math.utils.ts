export const roundKcal = (val: number | string | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    return Math.round(Number(val) * 100) / 100;
};
