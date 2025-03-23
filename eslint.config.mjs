// @ts-check

import { fileURLToPath } from 'url'
import { dirname } from 'path'
import path from 'path'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'
import eslint from '@eslint/js'
import { includeIgnoreFile } from '@eslint/compat'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

const compat = new FlatCompat({
    baseDirectory: __dirname,
})

// Convert legacy Next.js config
const nextConfig = compat.extends('next')

/** @type {import('eslint').Linter.Config}  */
const config = tseslint.config(
    includeIgnoreFile(gitignorePath),
    nextConfig,
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        rules: {
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
                },
            ],
        },
    },
    {
        settings: {
            'import/resolver': {
                typescript: true,
                node: true,
            },
        },
    },
    {
        files: ['**/*.mjs', '**/*.js'],
        extends: [tseslint.configs.disableTypeChecked],
    },
)

export default config
