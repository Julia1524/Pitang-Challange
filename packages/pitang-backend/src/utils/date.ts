import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function parseDate(value: string): Date {
    return dayjs(value).toDate();
}

export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    return dayjs(date).format(format);
}

export function formatToUTC(date: Date): string {
    return dayjs(date).utc().toISOString();
}

export function isValidDate(value: string): boolean {
    return dayjs(value).isValid();
}

export { dayjs };
