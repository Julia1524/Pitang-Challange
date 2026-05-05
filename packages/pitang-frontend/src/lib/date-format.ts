import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export function formatDate(date: string | Date, format: 'short' | 'full' = 'short') {
    if (format === 'full') {
        return dayjs(date).format('DD/MM/YYYY HH:mm');
    }

    return dayjs(date).format('DD/MM/YYYY');
}

export function formatCurrency(value: number | string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(typeof value === 'string' ? Number(value) : value);
}
