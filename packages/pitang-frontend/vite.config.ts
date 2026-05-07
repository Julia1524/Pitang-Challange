/// <reference types="vitest/config" />
import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        tanstackRouter({
            autoCodeSplitting: true,
            target: 'react',
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
    },
});
