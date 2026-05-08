import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
// import {schemaTypes} from './schemaTypes'
import {schemaTypes} from '../sanity/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Team Chords Blog',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'r499aase',
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'testing',
  apiVersion: process.env.SANITY_STUDIO_API_VERSION || process.env.SANITY_API_VERSION || '2025-05-08',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
