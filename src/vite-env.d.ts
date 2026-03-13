/// <reference types="vite/client" />

declare const __CHANGELOG__: Array<{ version: string; commits: string[] }>
declare const __FILAMENT_DATA__: Record<string, { grams: number; hours: number }>

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.css' {}
